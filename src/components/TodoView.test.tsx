import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TodoView } from './TodoView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AppContext from '../context/AppContext';
import { Todo } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

vi.mock('lucide-react', () => ({
    Plus: () => <div data-testid="plus-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    Edit2: () => <div data-testid="edit-icon" />,
    Save: () => <div data-testid="save-icon" />,
    X: () => <div data-testid="x-icon" />,
    Check: () => <div data-testid="check-icon" />,
}));

vi.mock('./Modal', () => ({
    Modal: ({
        isOpen,
        onConfirm,
        onClose,
        title,
    }: {
        isOpen: boolean;
        onConfirm: () => void;
        onClose: () => void;
        title: string;
    }) =>
        isOpen ? (
            <div data-testid="modal">
                <span>{title}</span>
                <button onClick={onConfirm} data-testid="modal-confirm">
                    Confirm
                </button>
                <button onClick={onClose} data-testid="modal-cancel">
                    Cancel
                </button>
            </div>
        ) : null,
}));

const mockAddTodo = vi.fn();
const mockUpdateTodo = vi.fn();
const mockToggleTodo = vi.fn();
const mockDeleteTodo = vi.fn();

const baseTodos: Todo[] = [
    {
        id: 'todo1',
        title: 'High priority task',
        content: 'details',
        priority: 'high',
        completed: false,
        createdAt: '2024-01-03T00:00:00Z',
    },
    {
        id: 'todo2',
        title: 'Low priority task',
        content: '',
        priority: 'low',
        completed: false,
        createdAt: '2024-01-02T00:00:00Z',
    },
    {
        id: 'todo3',
        title: 'Completed task',
        content: '',
        priority: 'medium',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
    },
];

const mockUseApp = (todos: Todo[] = baseTodos) => {
    vi.spyOn(AppContext, 'useApp').mockReturnValue({
        todos,
        addTodo: mockAddTodo,
        updateTodo: mockUpdateTodo,
        toggleTodo: mockToggleTodo,
        deleteTodo: mockDeleteTodo,
        categories: [],
        lists: [],
        theme: 'light',
        addCategory: vi.fn(),
        updateCategoryName: vi.fn(),
        deleteCategory: vi.fn(),
        reorderCategories: vi.fn(),
        addList: vi.fn(),
        updateListName: vi.fn(),
        updateListSettings: vi.fn(),
        deleteList: vi.fn(),
        copyList: vi.fn(),
        moveList: vi.fn(),
        reorderLists: vi.fn(),
        updateListItems: vi.fn(),
        deleteItem: vi.fn(),
        toggleTheme: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        loading: false,
        sessions: [],
        addSession: vi.fn(),
        completeSession: vi.fn(),
        deleteSession: vi.fn(),
        combinations: [],
        addCombination: vi.fn(),
        updateCombination: vi.fn(),
        deleteCombination: vi.fn(),
        updateListAccess: vi.fn(),
        archiveList: vi.fn(),
        addSection: vi.fn(),
        updateSection: vi.fn(),
        deleteSection: vi.fn(),
        importItemsFromList: vi.fn(),
    } as ReturnType<typeof AppContext.useApp>);
};

describe('TodoView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseApp();
    });

    it('renders the page title', () => {
        render(<TodoView />);
        expect(screen.getByText('todos.title')).toBeDefined();
    });

    it('shows empty state when there are no todos', () => {
        mockUseApp([]);
        render(<TodoView />);
        expect(screen.getByText('todos.empty')).toBeDefined();
    });

    it('renders a list of todos', () => {
        render(<TodoView />);
        expect(screen.getByText('High priority task')).toBeDefined();
        expect(screen.getByText('Low priority task')).toBeDefined();
        expect(screen.getByText('Completed task')).toBeDefined();
    });

    it('sorts todos: incomplete first, then by priority (high→low), then by date', () => {
        render(<TodoView />);
        const items = screen.getAllByText(/priority task|Completed task/);
        expect(items[0].textContent).toContain('High priority');
        expect(items[1].textContent).toContain('Low priority');
        expect(items[2].textContent).toContain('Completed');
    });

    it('shows the add-todo form when the add button is clicked', () => {
        render(<TodoView />);
        const addButton = screen.getByText('todos.add');
        fireEvent.click(addButton);
        expect(screen.getByPlaceholderText('todos.titlePlaceholder')).toBeDefined();
    });

    it('calls addTodo with correct arguments when form is submitted', async () => {
        mockAddTodo.mockResolvedValue(undefined);
        render(<TodoView />);

        fireEvent.click(screen.getByText('todos.add'));

        const titleInput = screen.getByPlaceholderText('todos.titlePlaceholder');
        fireEvent.change(titleInput, { target: { value: 'New task' } });

        const form = titleInput.closest('form')!;
        const highPriorityBtn = within(form).getByText('todos.priority.high');
        fireEvent.click(highPriorityBtn);

        const submitButton = screen.getByText('todos.save');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockAddTodo).toHaveBeenCalledWith('New task', '', 'high');
        });
    });

    it('does not call addTodo when title is empty', () => {
        render(<TodoView />);
        fireEvent.click(screen.getByText('todos.add'));

        const submitButton = screen.getByText('todos.save');
        expect(submitButton).toHaveProperty('disabled', true);
        fireEvent.click(submitButton);
        expect(mockAddTodo).not.toHaveBeenCalled();
    });

    it('calls toggleTodo when clicking the toggle button on an item', () => {
        render(<TodoView />);
        const highPriorityItem = screen.getByText('High priority task').closest('.group')!;
        const checkbox = highPriorityItem.querySelector('button')!;
        fireEvent.click(checkbox);
        expect(mockToggleTodo).toHaveBeenCalledWith('todo1');
    });

    it('opens delete confirmation modal when trash icon is clicked', () => {
        render(<TodoView />);
        const trashButtons = screen.getAllByTestId('trash-icon');
        fireEvent.click(trashButtons[0].closest('button')!);
        expect(screen.getByTestId('modal')).toBeDefined();
    });

    it('calls deleteTodo after confirming delete modal', async () => {
        mockDeleteTodo.mockResolvedValue(undefined);
        render(<TodoView />);

        const trashButtons = screen.getAllByTestId('trash-icon');
        fireEvent.click(trashButtons[0].closest('button')!);

        fireEvent.click(screen.getByTestId('modal-confirm'));

        await waitFor(() => {
            expect(mockDeleteTodo).toHaveBeenCalledWith('todo1');
        });
    });

    it('enters edit mode and calls updateTodo on save', async () => {
        mockUpdateTodo.mockResolvedValue(undefined);
        render(<TodoView />);

        const editButtons = screen.getAllByTestId('edit-icon');
        fireEvent.click(editButtons[0].closest('button')!);

        const editInput = screen.getByDisplayValue('High priority task');
        fireEvent.change(editInput, { target: { value: 'Updated task' } });

        const saveButton = screen.getByTestId('save-icon').closest('button')!;
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockUpdateTodo).toHaveBeenCalledWith(
                'todo1',
                'Updated task',
                'details',
                'high'
            );
        });
    });
});
