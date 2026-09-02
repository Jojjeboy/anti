import { render, screen, fireEvent, act } from '@testing-library/react';
import { SortableListCard } from './SortableListCard';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { List, Category } from '../types';

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

vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

describe('SortableListCard', () => {
    const mockList: List = {
        id: 'list-1',
        name: 'Matvaror',
        categoryId: 'cat-1',
        items: [{ id: '1', text: 'Ägg', completed: true }],
    };

    const mockCategories: Category[] = [
        { id: 'cat-1', name: 'Hem' },
        { id: 'cat-2', name: 'Jobb' },
    ];

    it('renders list title and link', () => {
        render(
            <MemoryRouter>
                <SortableListCard
                    list={mockList}
                    onCopy={vi.fn()}
                    onMove={vi.fn()}
                    onDelete={vi.fn()}
                    onClearCompleted={vi.fn()}
                    isMoving={false}
                    categories={mockCategories}
                    currentCategoryId="cat-1"
                    onMoveToCategory={vi.fn()}
                    showHandle={true}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Matvaror')).toBeDefined();
    });

    it('opens dropdown menu on actions button click', () => {
        const onCopy = vi.fn();
        render(
            <MemoryRouter>
                <SortableListCard
                    list={mockList}
                    onCopy={onCopy}
                    onMove={vi.fn()}
                    onDelete={vi.fn()}
                    onClearCompleted={vi.fn()}
                    isMoving={false}
                    categories={mockCategories}
                    currentCategoryId="cat-1"
                    onMoveToCategory={vi.fn()}
                    showHandle={true}
                />
            </MemoryRouter>
        );

        const moreBtn = screen.getByTitle('lists.actions');
        act(() => {
            fireEvent.click(moreBtn);
        });

        expect(screen.getByText('lists.copy')).toBeDefined();
        expect(screen.getByText('lists.deleteTitle')).toBeDefined();

        act(() => {
            fireEvent.click(screen.getByText('lists.copy'));
        });
        expect(onCopy).toHaveBeenCalledWith('list-1');
    });

    it('renders move category options when isMoving is true', () => {
        const onMoveToCategory = vi.fn();
        render(
            <MemoryRouter>
                <SortableListCard
                    list={mockList}
                    onCopy={vi.fn()}
                    onMove={vi.fn()}
                    onDelete={vi.fn()}
                    onClearCompleted={vi.fn()}
                    isMoving={true}
                    categories={mockCategories}
                    currentCategoryId="cat-1"
                    onMoveToCategory={onMoveToCategory}
                    showHandle={true}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Jobb')).toBeDefined();
        fireEvent.click(screen.getByText('Jobb'));
        expect(onMoveToCategory).toHaveBeenCalledWith('list-1', 'cat-2');
    });
});
