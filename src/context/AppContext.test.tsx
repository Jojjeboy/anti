import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { List, Category, ListCombination } from '../types';

// Mocks — declared once, reused across both describe blocks
const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../hooks/useFirestoreSync', () => ({
    useFirestoreSync: (path: string) => {
        let data: Array<Category | List | ListCombination> = [];
        if (path.includes('combinations')) {
            data = [
                { id: 'combo1', name: 'Combo 1', listIds: ['list1', 'list2'], createdAt: '2023-01-01' },
                { id: 'combo2', name: 'Combo 2', listIds: ['list1', 'list2', 'list3'], createdAt: '2023-01-01' },
            ];
        } else if (path.includes('lists')) {
            data = [
                {
                    id: 'list1',
                    name: 'List 1',
                    categoryId: 'cat1',
                    items: [],
                    settings: { threeStageMode: false, defaultSort: 'manual', pinned: false },
                },
                {
                    id: 'list2',
                    name: 'List 2',
                    categoryId: 'cat1',
                    items: [{ id: 'i1', text: 'Item', completed: true }],
                },
                { id: 'list3', name: 'List 3', categoryId: 'cat2', items: [] },
            ];
        } else if (path.includes('sessions')) {
            data = [];
        } else if (path.includes('categories')) {
            data = [
                { id: 'cat1', name: 'Category 1', order: 0 },
                { id: 'cat2', name: 'Category 2', order: 1 },
            ];
        } else if (path.includes('notes')) {
            data = [
                {
                    id: 'note1',
                    title: 'Note 1',
                    content: 'c',
                    priority: 'low',
                    completed: false,
                    createdAt: '2024-01-01',
                },
            ];
        }

        return {
            data,
            loading: false,
            error: null,
            addItem: mockAddItem,
            updateItem: mockUpdateItem,
            deleteItem: mockDeleteItem,
        };
    },
}));

vi.mock('./AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-user' } }),
}));

vi.mock('./ToastContext', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../hooks/useMigrateLocalStorage', () => ({
    useMigrateLocalStorage: () => ({ migrating: false }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Original test suite (combinations, basic CRUD)
// ─────────────────────────────────────────────────────────────────────────────
describe('AppContext - Combinations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('addCombination calls firestore addItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addCombination('New Combo', ['list1', 'list2']);
        });

        expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Combo',
            listIds: ['list1', 'list2'],
        }));
    });

    it('updateCombination calls firestore updateItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.updateCombination('combo1', { name: 'Updated Name' });
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('combo1', expect.objectContaining({
            name: 'Updated Name',
        }));
    });

    it('deleteCombination calls firestore deleteItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.deleteCombination('combo1');
        });

        expect(mockDeleteItem).toHaveBeenCalledWith('combo1');
    });

    it('deleteList cascades correctly (Update 3+ lists, Delete 2 lists)', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.deleteList('list1');
        });

        expect(mockDeleteItem).toHaveBeenCalledWith('list1');
        expect(mockDeleteItem).toHaveBeenCalledWith('combo1');
        expect(mockUpdateItem).toHaveBeenCalledWith('combo2', expect.objectContaining({
            listIds: ['list2', 'list3'],
        }));
    });

    it('addList calls firestore addItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addList('New List', 'cat1');
        });

        expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New List',
            categoryId: 'cat1',
            items: [],
        }));
    });

    it('addSession calls firestore addItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addSession('New Session', ['list1', 'list2']);
        });

        expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Session',
            listIds: ['list1', 'list2'],
        }));
    });

    it('addCategory calls firestore addItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addCategory('New Category');
        });

        expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Category',
        }));
    });

    it('deleteCategory calls firestore deleteItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.deleteCategory('cat1');
        });

        expect(mockDeleteItem).toHaveBeenCalledWith('cat1');
    });

    it('addSection adds new section at the top (order 0)', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addSection('list1', 'New Top Section');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list1', expect.objectContaining({
            sections: expect.arrayContaining([
                expect.objectContaining({ name: 'New Top Section', order: 0 }),
            ]),
        }));
    });

    it('reorderSections updates sections array and re-indexes order sequentially', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const reorderedSections = [
            { id: 'sec2', name: 'Second Section', order: 1 },
            { id: 'sec1', name: 'First Section', order: 0 },
        ];

        await act(async () => {
            await result.current.reorderSections('list1', reorderedSections);
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list1', {
            sections: [
                { id: 'sec2', name: 'Second Section', order: 0 },
                { id: 'sec1', name: 'First Section', order: 1 },
            ],
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Extended operations: archive, copy, move, todos, settings, importItems
// ─────────────────────────────────────────────────────────────────────────────
describe('AppContext - Extended Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('archiveList resets items and sets archived=true', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.archiveList('list2', true);
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list2', expect.objectContaining({
            archived: true,
            items: expect.arrayContaining([
                expect.objectContaining({ completed: false, state: 'unresolved' }),
            ]),
        }));
    });

    it('archiveList sets archived=false without resetting items', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.archiveList('list2', false);
        });

        const call = mockUpdateItem.mock.calls.find((c) => c[0] === 'list2');
        expect(call?.[1]).toMatchObject({ archived: false });
        expect(call?.[1]).not.toHaveProperty('items');
    });

    it('copyList creates a new list with "kopia 1" suffix', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.copyList('list1');
        });

        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'List 1 kopia 1' })
        );
    });

    it('moveList updates the categoryId of the list', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.moveList('list1', 'cat2');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list1', { categoryId: 'cat2' });
    });

    it('addTodo creates a todo with correct fields', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.addTodo('Buy milk', 'from store', 'high');
        });

        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Buy milk',
                content: 'from store',
                priority: 'high',
                completed: false,
            })
        );
    });

    it('toggleTodo flips the completed state', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.toggleTodo('note1');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('note1', { completed: true });
    });

    it('deleteTodo calls firestore deleteItem', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        await act(async () => {
            await result.current.deleteTodo('note1');
        });

        expect(mockDeleteItem).toHaveBeenCalledWith('note1');
    });

    it('updateListSettings persists new settings', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const newSettings = { threeStageMode: true, defaultSort: 'alphabetical' as const, pinned: false };

        await act(async () => {
            await result.current.updateListSettings('list1', newSettings);
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list1', { settings: newSettings });
    });

    it('importItemsFromList appends items with a new section', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const sourceItems = [
            { id: 'src1', text: 'Towel', completed: false },
            { id: 'src2', text: 'Shoes', completed: true },
        ];

        await act(async () => {
            await result.current.importItemsFromList('list1', sourceItems, 'Gym Bag', 'Gym Section');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith(
            'list1',
            expect.objectContaining({
                sections: expect.arrayContaining([
                    expect.objectContaining({ name: 'Gym Section' }),
                ]),
                items: expect.arrayContaining([
                    expect.objectContaining({ text: 'Towel', completed: false }),
                    expect.objectContaining({ text: 'Shoes', completed: false }), // reset on import
                ]),
            })
        );
        expect(mockShowToast).toHaveBeenCalled();
    });

    it('importItemsFromList without section name appends items directly', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const sourceItems = [{ id: 'src1', text: 'Milk', completed: false }];

        await act(async () => {
            await result.current.importItemsFromList('list1', sourceItems, 'Shopping');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith(
            'list1',
            expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({ text: 'Milk', completed: false }),
                ]),
            })
        );
    });

    it('importJsonToList replaces items and sections in replace mode', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const newItems = [{ id: 'new1', text: 'New Item', completed: true }];
        const newSections = [{ id: 'newSec1', name: 'New Section', order: 0 }];

        await act(async () => {
            await result.current.importJsonToList('list1', newItems, newSections, 'replace');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith('list1', {
            items: newItems,
            sections: newSections,
        });
    });

    it('importJsonToList merges sections and appends items in append mode', async () => {
        const { result } = renderHook(() => useApp(), { wrapper: AppProvider });

        const appendItems = [
            { id: 'app1', text: 'Apple', completed: false, sectionId: 'incomingSec1' },
            { id: 'app2', text: 'Orange', completed: false }
        ];
        const appendSections = [
            { id: 'incomingSec1', name: 'Fruit', order: 0 }
        ];

        await act(async () => {
            await result.current.importJsonToList('list1', appendItems, appendSections, 'append');
        });

        expect(mockUpdateItem).toHaveBeenCalledWith(
            'list1',
            expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({ text: 'Apple' }),
                    expect.objectContaining({ text: 'Orange' }),
                ]),
                sections: expect.arrayContaining([
                    expect.objectContaining({ name: 'Fruit' }),
                ]),
            })
        );
    });
});
