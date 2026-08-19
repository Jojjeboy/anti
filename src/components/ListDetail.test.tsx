import { render, screen, fireEvent } from '@testing-library/react';
import { ListDetail } from './ListDetail';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import * as AppContext from '../context/AppContext';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
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
    arrayMove: vi.fn(),
}));

// Mock child components
vi.mock('./SortableItem', () => ({
    SortableItem: ({ item, onToggle }: { item: { id: string; text: string }; onToggle: (id: string) => void }) => (
        <div data-testid="sortable-item">
            {item.text}
            <button onClick={() => onToggle(item.id)}>Toggle</button>
        </div>
    )
}));

vi.mock('lucide-react', () => ({
    Plus: () => <div />,
    ChevronLeft: () => <div />,
    RotateCcw: () => <div />,
    Settings: () => <div data-testid="settings-icon" />,
    ChevronDown: () => <div />,
    Pin: () => <div />,
    EyeOff: () => <div />,
    Trash2: () => <div />,
    Edit2: () => <div />,
    FolderInput: () => <div />,
    MoreVertical: () => <div />,
    Download: () => <div />,
    FileText: () => <div />,
    X: () => <div />,
    Copy: () => <div />,
    Check: () => <div />,
    Archive: () => <div />,
    ArchiveRestore: () => <div />,
}));

const mockUpdateListItems = vi.fn();
const mockArchiveList = vi.fn();

describe('ListDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            lists: [
                {
                    id: 'list1',
                    name: 'My List',
                    categoryId: 'cat1',
                    items: [
                        { id: 'i1', text: 'Apple', completed: false },
                        { id: 'i2', text: 'Banana', completed: true }
                    ]
                }
            ],
            updateListItems: mockUpdateListItems,
            deleteItem: vi.fn(),
            updateListName: vi.fn(),
            updateListSettings: vi.fn(),
            updateListAccess: vi.fn(),
            // defaults
            categories: [],
            addCategory: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            reorderLists: vi.fn(),
            addSession: vi.fn(),
            combinations: [],
            addCombination: vi.fn(),
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            sessions: [],
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
            archiveList: mockArchiveList,
            addSection: vi.fn(),
            updateSection: vi.fn(),
            deleteSection: vi.fn(),
        } as Partial<ReturnType<typeof AppContext.useApp>> as ReturnType<typeof AppContext.useApp>);
    });

    const renderComponent = () => {
        const router = createMemoryRouter(
            [
                {
                    path: '/list/:listId',
                    element: <ListDetail />,
                },
            ],
            {
                initialEntries: ['/list/list1'],
            }
        );

        render(<RouterProvider router={router} />);
    };

    it('renders list items', () => {
        renderComponent();
        expect(screen.getByText('Apple')).toBeDefined();
        expect(screen.getByText('Banana')).toBeDefined();
    });

    it('adds a new item', () => {
        renderComponent();
        const input = screen.getByPlaceholderText('lists.addItemPlaceholder');
        fireEvent.change(input, { target: { value: 'Cherry' } });

        const form = input.closest('form');
        fireEvent.submit(form!);

        expect(mockUpdateListItems).toHaveBeenCalledWith('list1', expect.arrayContaining([
            expect.objectContaining({ text: 'Apple' }),
            expect.objectContaining({ text: 'Banana' }),
            expect.objectContaining({ text: 'Cherry', completed: false })
        ]));
    });

    it('toggles item completion', () => {
        renderComponent();
        const toggleButtons = screen.getAllByText('Toggle');
        fireEvent.click(toggleButtons[0]); // Apple

        expect(mockUpdateListItems).toHaveBeenCalledWith('list1', expect.arrayContaining([
            expect.objectContaining({ id: 'i1', completed: true }), // Toggled to true
            expect.objectContaining({ id: 'i2', completed: true })
        ]));
    });

    it('toggles item 3-stage unresolved -> prepared -> completed', async () => {
        // Mock list with 3-stage enabled
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            lists: [
                {
                    id: 'list1',
                    name: 'My List',
                    categoryId: 'cat1',
                    items: [
                        { id: 'i1', text: 'Apple', completed: false, state: 'unresolved' }
                    ],
                    settings: { threeStageMode: true, defaultSort: 'manual' }
                }
            ],
            updateListItems: mockUpdateListItems,
            deleteItem: vi.fn(),
            updateListName: vi.fn(),
            updateListSettings: vi.fn(),
            updateListAccess: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            reorderLists: vi.fn(),
            addSession: vi.fn(),
            combinations: [],
            addCombination: vi.fn(),
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            sessions: [],
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
            archiveList: vi.fn(),
            addSection: vi.fn(),
            updateSection: vi.fn(),
            deleteSection: vi.fn(),
        } as Partial<ReturnType<typeof AppContext.useApp>> as ReturnType<typeof AppContext.useApp>);

        renderComponent();
        const toggleButtons = screen.getAllByText('Toggle');
        fireEvent.click(toggleButtons[0]); // Apple: unresolved -> ongoing

        expect(mockUpdateListItems).toHaveBeenCalledWith('list1', expect.arrayContaining([
            expect.objectContaining({ id: 'i1', completed: false, state: 'ongoing' })
        ]));
    });

    it('filters out completed items when hideCompleted is true', () => {
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            lists: [
                {
                    id: 'list1',
                    name: 'My List',
                    categoryId: 'cat1',
                    items: [
                        { id: 'i1', text: 'Apple', completed: false },
                        { id: 'i2', text: 'Banana', completed: true }
                    ],
                    settings: { hideCompleted: true, threeStageMode: false, defaultSort: 'manual' }
                }
            ],
            updateListItems: mockUpdateListItems,
            deleteItem: vi.fn(),
            updateListName: vi.fn(),
            updateListSettings: vi.fn(),
            updateListAccess: vi.fn(),
            archiveList: vi.fn(),
            addSection: vi.fn(),
            updateSection: vi.fn(),
            deleteSection: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            reorderLists: vi.fn(),
            addSession: vi.fn(),
            combinations: [],
            addCombination: vi.fn(),
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            sessions: [],
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
        } as Partial<ReturnType<typeof AppContext.useApp>> as ReturnType<typeof AppContext.useApp>);

        renderComponent();
        expect(screen.getByText('Apple')).toBeDefined();
        // Banana is in the accordion, which is closed by default
        expect(screen.queryByText('Banana')).toBeNull();

        // Find and click the accordion button
        const accordionButton = screen.getByText(/lists.completedAccordion/);
        expect(accordionButton).toBeDefined();
        fireEvent.click(accordionButton);

        // Now Banana should be visible
        expect(screen.getByText('Banana')).toBeDefined();
    });

    it('shows all items when hideCompleted is false', () => {
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            lists: [
                {
                    id: 'list1',
                    name: 'My List',
                    categoryId: 'cat1',
                    items: [
                        { id: 'i1', text: 'Apple', completed: false },
                        { id: 'i2', text: 'Banana', completed: true }
                    ],
                    settings: { hideCompleted: false, threeStageMode: false, defaultSort: 'manual' }
                }
            ],
            updateListItems: mockUpdateListItems,
            deleteItem: vi.fn(),
            updateListName: vi.fn(),
            updateListSettings: vi.fn(),
            updateListAccess: vi.fn(),
            archiveList: vi.fn(),
            addSection: vi.fn(),
            updateSection: vi.fn(),
            deleteSection: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            reorderLists: vi.fn(),
            addSession: vi.fn(),
            combinations: [],
            addCombination: vi.fn(),
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            sessions: [],
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
        } as Partial<ReturnType<typeof AppContext.useApp>> as ReturnType<typeof AppContext.useApp>);

        renderComponent();
        expect(screen.getByText('Apple')).toBeDefined();
        expect(screen.getByText('Banana')).toBeDefined();
        // Accordion should not be present
        expect(screen.queryByText(/lists.completedAccordion/)).toBeNull();
    });

    it('opens export modal from quick settings menu', () => {
        renderComponent();
        const moreButton = screen.getByTitle('common.more');
        fireEvent.click(moreButton);

        const exportButton = screen.getByText('export.buttonTitle');
        expect(exportButton).toBeDefined();
        fireEvent.click(exportButton);

        expect(screen.getByText('export.title')).toBeDefined();
    });

    it('archives list from quick settings menu', () => {
        renderComponent();
        const moreButton = screen.getByTitle('common.more');
        fireEvent.click(moreButton);

        const archiveButton = screen.getByText('lists.archive');
        expect(archiveButton).toBeDefined();
        fireEvent.click(archiveButton);

        expect(mockArchiveList).toHaveBeenCalledWith('list1', true);
    });

    it('displays banner and unarchives list when list is archived', () => {
        vi.spyOn(AppContext, 'useApp').mockReturnValue({
            lists: [
                {
                    id: 'list1',
                    name: 'Archived List',
                    categoryId: 'cat1',
                    archived: true,
                    items: []
                }
            ],
            updateListItems: mockUpdateListItems,
            deleteItem: vi.fn(),
            updateListName: vi.fn(),
            updateListSettings: vi.fn(),
            updateListAccess: vi.fn(),
            categories: [],
            addCategory: vi.fn(),
            deleteCategory: vi.fn(),
            reorderCategories: vi.fn(),
            addList: vi.fn(),
            deleteList: vi.fn(),
            copyList: vi.fn(),
            moveList: vi.fn(),
            updateCategoryName: vi.fn(),
            reorderLists: vi.fn(),
            addSession: vi.fn(),
            combinations: [],
            addCombination: vi.fn(),
            updateCombination: vi.fn(),
            deleteCombination: vi.fn(),
            sessions: [],
            completeSession: vi.fn(),
            deleteSession: vi.fn(),
            archiveList: mockArchiveList,
            addSection: vi.fn(),
            updateSection: vi.fn(),
            deleteSection: vi.fn(),
            importItemsFromList: vi.fn(),
        } as Partial<ReturnType<typeof AppContext.useApp>> as ReturnType<typeof AppContext.useApp>);

        renderComponent();

        expect(screen.getByText('lists.archivedBadge')).toBeDefined();
        expect(screen.getByText('lists.archivedWarning')).toBeDefined();

        const unarchiveButtons = screen.getAllByText('lists.unarchive');
        expect(unarchiveButtons.length).toBeGreaterThan(0);
        fireEvent.click(unarchiveButtons[0]);

        expect(mockArchiveList).toHaveBeenCalledWith('list1', false);
    });

});
