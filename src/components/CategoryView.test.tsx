import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryView } from './CategoryView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as AppContext from '../context/AppContext';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock dnd-kit to avoid issues in test environment
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
    rectSortingStrategy: vi.fn(),
}));

// Mock child components to simplify testing CategoryView logic
vi.mock('./CategorySection', () => ({
    CategorySection: ({ category }: { category: { name: string } }) => <div data-testid="category-section">{category.name}</div>
}));

vi.mock('./ManageCategoriesModal', () => ({
    ManageCategoriesModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="manage-categories-modal">Manage Categories Modal</div> : null
}));

vi.mock('./CombinationCard', () => ({
    CombinationCard: ({ combination }: { combination: { name: string } }) => <div data-testid="combination-card">{combination.name}</div>
}));

vi.mock('./SessionPicker', () => ({
    SessionPicker: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="session-picker" /> : null
}));

vi.mock('./ImportListModal', () => ({
    ImportListModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="import-list-modal">Import List Modal</div> : null
}));

vi.mock('./AIListGeneratorModal', () => ({
    AIListGeneratorModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="ai-list-modal">AI Modal</div> : null
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Plus: () => <div data-testid="plus" />,
    Folder: () => <div data-testid="folder" />,
    PlayCircle: () => <div data-testid="play-circle" />,
    ChevronDown: () => <div data-testid="chevron-down" />,
    ChevronRight: () => <div data-testid="chevron-right" />,
    Layers: () => <div data-testid="layers" />,
    Home: () => <div data-testid="home" />,
    Sparkles: () => <div data-testid="sparkles" />,
    Archive: () => <div data-testid="archive" />,
    ArchiveRestore: () => <div data-testid="archive-restore" />,
    Trash2: () => <div data-testid="trash2" />
}));



const mockAddCategory = vi.fn();
const mockAddCombination = vi.fn();
const mockArchiveList = vi.fn();

describe('CategoryView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            categories: [
                { id: 'cat1', name: 'Work', order: 0 },
                { id: 'cat2', name: 'Personal', order: 1 }
            ],
            lists: [
                { id: 'l1', name: 'List 1', categoryId: 'cat1', items: [] },
                { id: 'l2', name: 'Archived List', categoryId: 'cat1', items: [], archived: true }
            ],
            combinations: [
                { id: 'combo1', name: 'Morning Routine', listIds: ['l1'], createdAt: '' }
            ],
            addCategory: mockAddCategory,
            addCombination: mockAddCombination,
            archiveList: mockArchiveList,
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addSession: vi.fn(),
            sessions: [],
            updateListItems: vi.fn(),
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            updateListName: vi.fn(),
            reorderLists: vi.fn(),
        } as unknown as ReturnType<typeof AppContext.useApp>);
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <CategoryView />
            </MemoryRouter>
        );
    };

    it('renders categories and home tab by default', () => {
        renderComponent();

        expect(screen.getByText('Work')).toBeDefined();
        expect(screen.getByText('Personal')).toBeDefined();
        expect(screen.getByText('categories.title')).toBeDefined();

        // Combinations should NOT be visible initially
        expect(screen.queryByText('Morning Routine')).toBeNull();
    });

    it('switches to templates tab', () => {
        renderComponent();

        // Click templates tab using translation key or button text
        fireEvent.click(screen.getByText('combinations.title'));

        // Check for templates content
        expect(screen.getByText('combinations.createRaw')).toBeDefined();
    });

    it('switches to archived tab and can restore a list', () => {
        renderComponent();

        // Click archived tab
        fireEvent.click(screen.getByText('categories.archived'));

        // Check archived list is displayed
        expect(screen.getByText('Archived List')).toBeDefined();

        // Click restore button
        const restoreButton = screen.getByTitle('lists.unarchive');
        expect(restoreButton).toBeDefined();
        fireEvent.click(restoreButton);

        expect(mockArchiveList).toHaveBeenCalledWith('l2', false);
    });

    it('opens manage categories modal', () => {
        renderComponent();

        const manageButton = screen.getByText('categories.manage');
        expect(manageButton).toBeDefined();

        fireEvent.click(manageButton);

        expect(screen.getByTestId('manage-categories-modal')).toBeDefined();
    });

    it('opens import list modal', () => {
        renderComponent();

        const importButton = screen.getByText('categories.importJSON');
        expect(importButton).toBeDefined();

        fireEvent.click(importButton);

        expect(screen.getByTestId('import-list-modal')).toBeDefined();
    });
});
