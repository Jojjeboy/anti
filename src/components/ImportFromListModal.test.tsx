import { render, screen, fireEvent, act } from '@testing-library/react';
import { ImportFromListModal } from './ImportFromListModal';
import { describe, it, expect, vi } from 'vitest';
import { List } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: string | { defaultValue?: string; [k: string]: unknown }) => {
            if (typeof options === 'string') return options;
            if (options && typeof options === 'object' && typeof options.defaultValue === 'string') {
                return options.defaultValue;
            }
            return key;
        },
    }),
}));

describe('ImportFromListModal', () => {
    const mockLists: List[] = [
        {
            id: 'list-1',
            name: 'Inköp',
            categoryId: 'cat-1',
            items: [
                { id: 'i-1', text: 'Mjölk', completed: false },
                { id: 'i-2', text: 'Smör', completed: true },
            ],
        },
        {
            id: 'list-2',
            name: 'Packlista',
            categoryId: 'cat-1',
            items: [{ id: 'i-3', text: 'Pass', completed: false }],
        },
    ];

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <ImportFromListModal
                isOpen={false}
                onClose={vi.fn()}
                onImport={vi.fn()}
                currentListId="list-2"
                lists={mockLists}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders list of available lists excluding currentListId', () => {
        render(
            <ImportFromListModal
                isOpen={true}
                onClose={vi.fn()}
                onImport={vi.fn()}
                currentListId="list-2"
                lists={mockLists}
            />
        );

        expect(screen.getByText('Inköp')).toBeDefined();
        expect(screen.queryByText('Packlista')).toBeNull();
    });

    it('selects a list and allows selecting items to import', async () => {
        const onImport = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();

        render(
            <ImportFromListModal
                isOpen={true}
                onClose={onClose}
                onImport={onImport}
                currentListId="list-2"
                lists={mockLists}
            />
        );

        // Click on list 'Inköp'
        act(() => { fireEvent.click(screen.getByText('Inköp')); });

        // Should now show items
        expect(screen.getByText('Mjölk')).toBeDefined();
        expect(screen.getByText('Smör')).toBeDefined();

        // Submit import button has text "Importera 2 objekt"
        const submitBtn = screen.getByRole('button', { name: /importera/i });
        act(() => { fireEvent.click(submitBtn); });

        expect(onImport).toHaveBeenCalledWith(
            mockLists[0],
            mockLists[0].items,
            'Inköp'
        );
    });
});
