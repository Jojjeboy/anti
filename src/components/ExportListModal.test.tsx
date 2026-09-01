import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportListModal } from './ExportListModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="x-icon" />,
    Copy: () => <div data-testid="copy-icon" />,
    Check: () => <div data-testid="check-icon" />,
    Download: () => <div data-testid="download-icon" />,
    FileText: () => <div data-testid="filetext-icon" />,
}));

const mockList = {
    id: 'list1',
    name: 'Groceries',
    categoryId: 'cat1',
    items: [
        { id: 'i1', text: 'Milk', completed: false },
        { id: 'i2', text: 'Bread', completed: true },
    ],
};

describe('ExportListModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        list: mockList,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(<ExportListModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Exportera lista till JSON')).toBeNull();
    });

    it('renders list JSON preview in simple format by default', () => {
        render(<ExportListModal {...defaultProps} />);
        expect(screen.getByText('Exportera lista till JSON')).toBeDefined();

        const preview = screen.getByText((content) => content.includes('"Groceries"') && content.includes('"Milk"'));
        expect(preview).toBeDefined();

        // Simple format should contain array of strings for items
        const parsed = JSON.parse(preview.textContent || '{}');
        expect(parsed.name).toBe('Groceries');
        expect(parsed.items).toEqual(['Milk', 'Bread']);
    });

    it('switches format to detailed when clicking detailed tab', () => {
        render(<ExportListModal {...defaultProps} />);
        const detailedTab = screen.getByText('Detaljerat format (med status)');
        fireEvent.click(detailedTab);

        const preview = screen.getByText((content) => content.includes('"Groceries"') && content.includes('"completed"'));
        expect(preview).toBeDefined();

        const parsed = JSON.parse(preview.textContent || '{}');
        expect(parsed.items).toEqual([
            { text: 'Milk', completed: false },
            { text: 'Bread', completed: true },
        ]);
    });

    it('copies JSON string to clipboard when clicking copy', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
            },
        });

        render(<ExportListModal {...defaultProps} />);
        const copyButton = screen.getByText('Kopiera JSON');
        fireEvent.click(copyButton);

        expect(writeTextMock).toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByText('Kopierat!')).toBeDefined();
        });
    });

    it('triggers file download when clicking download button', () => {
        const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
        const revokeObjectURLMock = vi.fn();
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        const linkClickMock = vi.fn();
        const origCreateElement = document.createElement.bind(document);
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            const el = origCreateElement(tagName);
            if (tagName === 'a') {
                el.click = linkClickMock;
            }
            return el;
        });

        render(<ExportListModal {...defaultProps} />);
        const downloadButton = screen.getByText('Ladda ner JSON');
        fireEvent.click(downloadButton);

        expect(createObjectURLMock).toHaveBeenCalled();
        expect(linkClickMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();

        createElementSpy.mockRestore();
    });

    it('calls onClose when clicking close button or cancel', () => {
        render(<ExportListModal {...defaultProps} />);
        const cancelButton = screen.getByText('Avbryt');
        fireEvent.click(cancelButton);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('renders sections in simple format when list has sections', () => {
        const listWithSections = {
            id: 'list2',
            name: 'Packing List',
            categoryId: 'cat1',
            sections: [
                { id: 'sec1', name: 'Clothes', order: 0 },
                { id: 'sec2', name: 'Gear', order: 1 },
            ],
            items: [
                { id: 'i1', text: 'Jacket', completed: false, sectionId: 'sec1' },
                { id: 'i2', text: 'Gloves', completed: true, sectionId: 'sec1' },
                { id: 'i3', text: 'Helmet', completed: false, sectionId: 'sec2' },
                { id: 'i4', text: 'General Item', completed: false }, // unsectioned
            ],
        };

        render(<ExportListModal {...defaultProps} list={listWithSections} />);

        const preview = screen.getByText((content) => content.includes('"Packing List"') && content.includes('"Clothes"'));
        expect(preview).toBeDefined();

        const parsed = JSON.parse(preview.textContent || '{}');
        expect(parsed.name).toBe('Packing List');
        expect(parsed.items).toEqual(['General Item']);
        expect(parsed.sections).toEqual([
            {
                name: 'Clothes',
                items: ['Jacket', 'Gloves'],
            },
            {
                name: 'Gear',
                items: ['Helmet'],
            },
        ]);
    });

    it('renders sections in detailed format when list has sections and detailed tab is active', () => {
        const listWithSections = {
            id: 'list2',
            name: 'Packing List',
            categoryId: 'cat1',
            sections: [
                { id: 'sec1', name: 'Clothes', order: 0 },
            ],
            items: [
                { id: 'i1', text: 'Jacket', completed: true, sectionId: 'sec1' },
                { id: 'i2', text: 'General Item', completed: false },
            ],
        };

        render(<ExportListModal {...defaultProps} list={listWithSections} />);
        const detailedTab = screen.getByText('Detaljerat format (med status)');
        fireEvent.click(detailedTab);

        const preview = screen.getByText((content) => content.includes('"Packing List"') && content.includes('"Clothes"'));
        expect(preview).toBeDefined();

        const parsed = JSON.parse(preview.textContent || '{}');
        expect(parsed.items).toEqual([{ text: 'General Item', completed: false }]);
        expect(parsed.sections).toEqual([
            {
                name: 'Clothes',
                items: [{ text: 'Jacket', completed: true }],
            },
        ]);
    });
});
