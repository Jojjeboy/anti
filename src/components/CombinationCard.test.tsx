import { render, screen, fireEvent } from '@testing-library/react';
import { CombinationCard } from './CombinationCard';
import { describe, it, expect, vi } from 'vitest';
import { ListCombination, List } from '../types';

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

describe('CombinationCard', () => {
    const mockCombination: ListCombination = {
        id: 'comb-1',
        name: 'Morgonrutin',
        listIds: ['list-1', 'list-2'],
        createdAt: '2026-09-01T08:00:00Z',
    };

    const mockLists: List[] = [
        { id: 'list-1', name: 'Frukost', categoryId: 'cat-1', items: [] },
        { id: 'list-2', name: 'Träning', categoryId: 'cat-1', items: [] },
    ];

    it('renders combination name and list previews', () => {
        render(
            <CombinationCard
                combination={mockCombination}
                lists={mockLists}
                onStart={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText('Morgonrutin')).toBeDefined();
        expect(screen.getByText('Frukost')).toBeDefined();
        expect(screen.getByText('Träning')).toBeDefined();
    });

    it('handles start session, edit and delete actions', () => {
        const onStart = vi.fn();
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(
            <CombinationCard
                combination={mockCombination}
                lists={mockLists}
                onStart={onStart}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        );

        // t() mock returns defaultValue: 'common.edit' => 'Redigera', 'common.delete' => 'Radera'
        fireEvent.click(screen.getByTitle('Redigera'));
        expect(onEdit).toHaveBeenCalledWith('comb-1');

        fireEvent.click(screen.getByTitle('Radera'));
        expect(onDelete).toHaveBeenCalledWith('comb-1');

        // t() mock returns defaultValue: 'sessions.start' => 'Starta Session'
        fireEvent.click(screen.getByRole('button', { name: /starta session/i }));
        expect(onStart).toHaveBeenCalledWith(['list-1', 'list-2']);
    });
});
