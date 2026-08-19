import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySection } from './CategorySection';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category, List } from '../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, defaultVal?: string) => defaultVal || key }),
}));

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    closestCenter: vi.fn(),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Trash2: () => <div data-testid="trash-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    Edit2: () => <div data-testid="edit-icon" />,
    MoreVertical: () => <div data-testid="more-icon" />,
    Copy: () => <div data-testid="copy-icon" />,
    ArrowRight: () => <div data-testid="arrow-icon" />,
    CheckCheck: () => <div data-testid="check-icon" />,
    Archive: () => <div data-testid="archive-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
}));

// Mock SortableListCard to avoid deep rendering complexity
vi.mock('./SortableListCard', () => ({
    SortableListCard: ({ list }: { list: { name: string } }) => (
        <div data-testid="list-card">{list.name}</div>
    ),
}));

describe('CategorySection - Duplicate list name validation', () => {
    const mockCategory: Category = { id: 'cat1', name: 'Work', order: 0 };
    const mockCategories: Category[] = [
        { id: 'cat1', name: 'Work', order: 0 },
        { id: 'cat2', name: 'Personal', order: 1 },
    ];
    const mockLists: List[] = [
        { id: 'list1', name: 'Groceries', categoryId: 'cat1', items: [] },
        { id: 'list2', name: 'Todos', categoryId: 'cat1', items: [] },
    ];

    const mockOnAddList = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnUpdateName = vi.fn();
    const mockOnCopyList = vi.fn();
    const mockOnMoveList = vi.fn();
    const mockOnDeleteList = vi.fn();
    const mockOnClearCompleted = vi.fn();
    const mockOnReorderLists = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderSection = () =>
        render(
            <CategorySection
                category={mockCategory}
                lists={mockLists}
                categories={mockCategories}
                onDelete={mockOnDelete}
                onUpdateName={mockOnUpdateName}
                onAddList={mockOnAddList}
                onCopyList={mockOnCopyList}
                onMoveList={mockOnMoveList}
                onDeleteList={mockOnDeleteList}
                onClearCompleted={mockOnClearCompleted}
                onReorderLists={mockOnReorderLists}
            />
        );

    it('shows error and disables submit when typing an existing list name', () => {
        renderSection();

        // Open the add list form
        fireEvent.click(screen.getByText('+ Lägg till lista'));

        const input = screen.getByPlaceholderText('lists.newPlaceholder');
        fireEvent.change(input, { target: { value: 'groceries' } }); // case-insensitive match

        expect(screen.getByText('En lista med detta namn finns redan')).toBeDefined();

        const submitButton = screen.getByTestId('plus-icon').closest('button')!;
        expect(submitButton).toHaveProperty('disabled', true);
    });

    it('does not call onAddList when submitting a duplicate list name', () => {
        renderSection();

        fireEvent.click(screen.getByText('+ Lägg till lista'));

        const input = screen.getByPlaceholderText('lists.newPlaceholder');
        fireEvent.change(input, { target: { value: 'Todos' } });

        fireEvent.submit(input.closest('form')!);

        expect(mockOnAddList).not.toHaveBeenCalled();
    });

    it('calls onAddList when typing a unique list name', () => {
        renderSection();

        fireEvent.click(screen.getByText('+ Lägg till lista'));

        const input = screen.getByPlaceholderText('lists.newPlaceholder');
        fireEvent.change(input, { target: { value: 'New Unique List' } });

        expect(screen.queryByText('En lista med detta namn finns redan')).toBeNull();

        fireEvent.submit(input.closest('form')!);

        expect(mockOnAddList).toHaveBeenCalledWith('New Unique List', 'cat1');
    });
});
