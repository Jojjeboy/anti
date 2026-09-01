import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportListModal } from './ImportListModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Category } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('lucide-react', () => ({
    ChevronDown: () => <div />,
    ChevronUp: () => <div />,
    X: () => <div data-testid="close-icon" />,
    Folder: () => <div />,
    Copy: () => <div />,
    Check: () => <div />,
}));

// Mock clipboard API
Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const mockCategories: Category[] = [
    { id: 'cat1', name: 'Work', order: 0 },
    { id: 'cat2', name: 'Personal', order: 1 },
];

const mockOnImport = vi.fn();
const mockOnClose = vi.fn();

describe('ImportListModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid' as `${string}-${string}-${string}-${string}-${string}`);
        }
    });

    const renderModal = (isOpen = true) =>
        render(
            <ImportListModal
                isOpen={isOpen}
                onClose={mockOnClose}
                onImport={mockOnImport}
                categories={mockCategories}
            />
        );

    it('does not render when isOpen is false', () => {
        renderModal(false);
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders the modal title when open', () => {
        renderModal();
        expect(screen.getByText('import.title')).toBeDefined();
    });

    it('shows an error when submitting empty JSON input', async () => {
        renderModal();
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorPaste')).toBeDefined();
        });
    });

    it('shows an error for invalid JSON syntax', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '{invalid json' } });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorInvalid')).toBeDefined();
        });
    });

    it('shows an error when JSON is an array instead of object', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '[1, 2, 3]' } });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorObject')).toBeDefined();
        });
    });

    it('shows an error when the "name" field is missing', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: { value: JSON.stringify({ items: ['a', 'b'] }) },
        });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorName')).toBeDefined();
        });
    });

    it('shows an error when both "items" and "sections" fields are missing', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: { value: JSON.stringify({ name: 'My List' }) },
        });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorItems')).toBeDefined();
        });
    });

    it('shows an error when items is not an array', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: { value: JSON.stringify({ name: 'My List', items: 'not-array' }) },
        });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorItemsArray')).toBeDefined();
        });
    });

    it('shows an error when items and sections arrays are empty', async () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: { value: JSON.stringify({ name: 'My List', items: [] }) },
        });
        fireEvent.click(screen.getByText('import.import'));
        await waitFor(() => {
            expect(screen.getByText('import.errorItemsEmpty')).toBeDefined();
        });
    });

    it('calls onImport with correct data for a simple string-items format', async () => {
        mockOnImport.mockResolvedValue(undefined);
        renderModal();

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: {
                value: JSON.stringify({ name: 'Grocery List', items: ['Milk', 'Eggs'] }),
            },
        });

        fireEvent.click(screen.getByText('import.import'));

        await waitFor(() => {
            expect(mockOnImport).toHaveBeenCalledWith(
                'Grocery List',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Milk', completed: false }),
                    expect.objectContaining({ text: 'Eggs', completed: false }),
                ]),
                'cat1',
                undefined,
                undefined
            );
        });
    });

    it('calls onImport with correct data for a detailed object-items format', async () => {
        mockOnImport.mockResolvedValue(undefined);
        renderModal();

        const detailedJson = JSON.stringify({
            name: 'Work Tasks',
            items: [
                { text: 'Write report', completed: true },
                { text: 'Send email', completed: false },
            ],
        });

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: detailedJson } });
        fireEvent.click(screen.getByText('import.import'));

        await waitFor(() => {
            expect(mockOnImport).toHaveBeenCalledWith(
                'Work Tasks',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Write report', completed: true }),
                    expect.objectContaining({ text: 'Send email', completed: false }),
                ]),
                'cat1',
                undefined,
                undefined
            );
        });
    });

    it('calls onImport with correct sections and section-assigned items', async () => {
        mockOnImport.mockResolvedValue(undefined);
        renderModal();

        const sectionsJson = JSON.stringify({
            name: 'Ski Trip',
            sections: [
                {
                    name: 'Clothes',
                    items: ['Jacket', 'Gloves'],
                },
                {
                    name: 'Gear',
                    items: [{ text: 'Skis', completed: true }],
                },
            ],
        });

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: sectionsJson } });
        fireEvent.click(screen.getByText('import.import'));

        await waitFor(() => {
            expect(mockOnImport).toHaveBeenCalledWith(
                'Ski Trip',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Jacket', completed: false, sectionId: expect.any(String) }),
                    expect.objectContaining({ text: 'Gloves', completed: false, sectionId: expect.any(String) }),
                    expect.objectContaining({ text: 'Skis', completed: true, sectionId: expect.any(String) }),
                ]),
                'cat1',
                undefined,
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Clothes', order: 0 }),
                    expect.objectContaining({ name: 'Gear', order: 1 }),
                ])
            );
        });
    });
});
