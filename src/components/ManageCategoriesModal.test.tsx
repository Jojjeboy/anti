import { render, screen, fireEvent } from '@testing-library/react';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    X: () => <div data-testid="x-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    GripVertical: () => <div data-testid="grip-icon" />,
    Edit2: () => <div data-testid="edit-icon" />,
    Check: () => <div data-testid="check-icon" />,
}));

describe('ManageCategoriesModal', () => {
    const mockCategories = [
        { id: 'cat1', name: 'Work', order: 0 },
        { id: 'cat2', name: 'Personal', order: 1 }
    ];

    const mockOnClose = vi.fn();
    const mockOnReorder = vi.fn();
    const mockOnAdd = vi.fn();
    const mockOnUpdateName = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders category names when open', () => {
        render(
            <ManageCategoriesModal
                isOpen={true}
                onClose={mockOnClose}
                categories={mockCategories}
                onReorder={mockOnReorder}
                onAdd={mockOnAdd}
                onUpdateName={mockOnUpdateName}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('Work')).toBeDefined();
        expect(screen.getByText('Personal')).toBeDefined();
    });

    it('allows editing a category name', async () => {
        render(
            <ManageCategoriesModal
                isOpen={true}
                onClose={mockOnClose}
                categories={mockCategories}
                onReorder={mockOnReorder}
                onAdd={mockOnAdd}
                onUpdateName={mockOnUpdateName}
                onDelete={mockOnDelete}
            />
        );

        // Click on category name or edit button to enter edit mode
        const editButtons = screen.getAllByLabelText('Edit category name');
        fireEvent.click(editButtons[0]);

        // Input should appear with current value
        const input = screen.getByDisplayValue('Work');
        expect(input).toBeDefined();

        // Change value
        fireEvent.change(input, { target: { value: 'Work & Office' } });

        // Save
        const saveButton = screen.getByLabelText('Save category name');
        fireEvent.click(saveButton);

        expect(mockOnUpdateName).toHaveBeenCalledWith('cat1', 'Work & Office');
    });

    it('adds a new category', () => {
        render(
            <ManageCategoriesModal
                isOpen={true}
                onClose={mockOnClose}
                categories={mockCategories}
                onReorder={mockOnReorder}
                onAdd={mockOnAdd}
                onUpdateName={mockOnUpdateName}
                onDelete={mockOnDelete}
            />
        );

        const input = screen.getByPlaceholderText('Ny kategori');
        fireEvent.change(input, { target: { value: 'Hobbies' } });
        fireEvent.submit(input.closest('form')!);

        expect(mockOnAdd).toHaveBeenCalledWith('Hobbies');
    });

    it('shows warning and prevents adding duplicate category name', () => {
        render(
            <ManageCategoriesModal
                isOpen={true}
                onClose={mockOnClose}
                categories={mockCategories}
                onReorder={mockOnReorder}
                onAdd={mockOnAdd}
                onUpdateName={mockOnUpdateName}
                onDelete={mockOnDelete}
            />
        );

        const input = screen.getByPlaceholderText('Ny kategori');
        fireEvent.change(input, { target: { value: 'work' } }); // Case insensitive match

        expect(screen.getByText('En kategori med detta namn finns redan')).toBeDefined();

        fireEvent.submit(input.closest('form')!);
        expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('shows warning and prevents saving duplicate category name on rename', () => {
        render(
            <ManageCategoriesModal
                isOpen={true}
                onClose={mockOnClose}
                categories={mockCategories}
                onReorder={mockOnReorder}
                onAdd={mockOnAdd}
                onUpdateName={mockOnUpdateName}
                onDelete={mockOnDelete}
            />
        );

        const editButtons = screen.getAllByLabelText('Edit category name');
        fireEvent.click(editButtons[0]);

        const input = screen.getByDisplayValue('Work');
        fireEvent.change(input, { target: { value: 'personal' } }); // Matches cat2

        expect(screen.getByText('En kategori med detta namn finns redan')).toBeDefined();

        const saveButton = screen.getByLabelText('Save category name');
        fireEvent.click(saveButton);

        expect(mockOnUpdateName).not.toHaveBeenCalled();
    });
});
