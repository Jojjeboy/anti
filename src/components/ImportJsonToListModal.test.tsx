import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportJsonToListModal } from './ImportJsonToListModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { List } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultOrOptions?: string | { [key: string]: unknown }) => {
            if (typeof defaultOrOptions === 'string') return defaultOrOptions;
            return key;
        },
    }),
}));

vi.mock('lucide-react', () => ({
    ChevronDown: () => <div />,
    ChevronUp: () => <div />,
    X: () => <div data-testid="close-icon" />,
    Copy: () => <div />,
    Check: () => <div />,
    AlertTriangle: () => <div data-testid="alert-triangle" />,
    Plus: () => <div />,
    RefreshCw: () => <div />,
}));

Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const mockCurrentList: List = {
    id: 'list1',
    name: 'Packlista',
    categoryId: 'cat1',
    items: [
        { id: 'i1', text: 'Tandborste', completed: false, sectionId: 'sec1' }
    ],
    sections: [
        { id: 'sec1', name: 'Hygien', order: 0 }
    ]
};

const mockOnReplace = vi.fn();
const mockOnAppend = vi.fn();
const mockOnClose = vi.fn();

describe('ImportJsonToListModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid' as `${string}-${string}-${string}-${string}-${string}`);
        }
    });

    const renderModal = (isOpen = true, currentList = mockCurrentList) =>
        render(
            <ImportJsonToListModal
                isOpen={isOpen}
                onClose={mockOnClose}
                currentList={currentList}
                onReplace={mockOnReplace}
                onAppend={mockOnAppend}
            />
        );

    it('does not render when isOpen is false', () => {
        renderModal(false);
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders the modal title when open', () => {
        renderModal();
        expect(screen.getByText('Importera lista (JSON)')).toBeDefined();
    });

    it('shows error when validating empty JSON', () => {
        renderModal();
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('Klistra in JSON-data för att importera.')).toBeDefined();
    });

    it('shows error for invalid JSON syntax', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '{ invalid: json ' } });
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('Ogiltigt JSON-format. Kontrollera syntaxfel.')).toBeDefined();
    });

    it('shows error when JSON is not an object', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '["item1", "item2"]' } });
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('JSON måste vara ett objekt med fälten "name" samt "items" eller "sections".')).toBeDefined();
    });

    it('shows error when "name" is missing', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: JSON.stringify({ items: ['Test'] }) } });
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('Fältet "name" saknas eller är tomt.')).toBeDefined();
    });

    it('shows error when neither "items" nor "sections" is present', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: JSON.stringify({ name: 'Test' }) } });
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('JSON måste innehålla fältet "items" eller "sections".')).toBeDefined();
    });

    it('shows error when items and sections are both empty arrays', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: JSON.stringify({ name: 'Test', items: [] }) } });
        fireEvent.click(screen.getByText('Validera JSON'));
        expect(screen.getByText('Listan är tom. Lägg till minst ett objekt.')).toBeDefined();
    });

    it('validates correctly and displays confirmation step with summary', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: {
                value: JSON.stringify({
                    name: 'Import List',
                    items: ['Item 1', 'Item 2']
                })
            }
        });
        fireEvent.click(screen.getByText('Validera JSON'));

        expect(screen.getByText('✅ JSON validerat!')).toBeDefined();
        expect(screen.getByText('Lägg till i listan')).toBeDefined();
        expect(screen.getByText('Ersätt hela listan')).toBeDefined();
    });

    it('shows duplicate section warning when imported section exists in current list', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: {
                value: JSON.stringify({
                    name: 'Import List',
                    sections: [
                        { name: 'Hygien', items: ['Schampo'] },
                        { name: 'Kläder', items: ['Tröja'] }
                    ]
                })
            }
        });
        fireEvent.click(screen.getByText('Validera JSON'));

        expect(screen.getByText('Sektioner finns redan')).toBeDefined();
        expect(screen.getByTestId('alert-triangle')).toBeDefined();
    });

    it('calls onAppend when clicking "Lägg till i listan"', async () => {
        mockOnAppend.mockResolvedValue(undefined);
        renderModal();

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: {
                value: JSON.stringify({
                    name: 'Import List',
                    items: ['Ny punkt']
                })
            }
        });
        fireEvent.click(screen.getByText('Validera JSON'));

        const appendButton = screen.getByText('Lägg till i listan').closest('button');
        fireEvent.click(appendButton!);

        await waitFor(() => {
            expect(mockOnAppend).toHaveBeenCalledWith(
                [expect.objectContaining({ text: 'Ny punkt', completed: false })],
                undefined
            );
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('calls onReplace when clicking "Ersätt hela listan"', async () => {
        mockOnReplace.mockResolvedValue(undefined);
        renderModal();

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: {
                value: JSON.stringify({
                    name: 'Import List',
                    sections: [{ name: 'Nya sektionen', items: ['Ny punkt'] }]
                })
            }
        });
        fireEvent.click(screen.getByText('Validera JSON'));

        const replaceButton = screen.getByText('Ersätt hela listan').closest('button');
        fireEvent.click(replaceButton!);

        await waitFor(() => {
            expect(mockOnReplace).toHaveBeenCalledWith(
                [expect.objectContaining({ text: 'Ny punkt', completed: false })],
                [expect.objectContaining({ name: 'Nya sektionen' })]
            );
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('allows going back to edit JSON from confirmation step', () => {
        renderModal();
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, {
            target: { value: JSON.stringify({ name: 'Test', items: ['A'] }) }
        });
        fireEvent.click(screen.getByText('Validera JSON'));

        expect(screen.getByText('← Ändra JSON')).toBeDefined();
        fireEvent.click(screen.getByText('← Ändra JSON'));

        expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('toggles example format view and copies example', async () => {
        renderModal();
        const exampleToggle = screen.getByText('Visa exempelformat');
        fireEvent.click(exampleToggle);

        expect(screen.getByText('Dölj exempelformat')).toBeDefined();
        const copyButton = screen.getByText('Kopiera');
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
});
