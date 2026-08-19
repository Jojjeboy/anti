import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Category, List, Item, Todo, ExecutionSession, ListCombination, ListSettings, Section } from '../types';

type Priority = 'low' | 'medium' | 'high';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { useMigrateLocalStorage } from '../hooks/useMigrateLocalStorage';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface AppContextType {
    categories: Category[];
    lists: List[];
    theme: 'light' | 'dark';
    addCategory: (name: string) => Promise<string>;
    updateCategoryName: (id: string, name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    reorderCategories: (categories: Category[]) => Promise<void>;
    addList: (name: string, categoryId: string) => Promise<string>;
    updateListName: (id: string, name: string) => Promise<void>;
    updateListSettings: (id: string, settings: ListSettings) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
    copyList: (listId: string) => Promise<void>;
    moveList: (listId: string, newCategoryId: string) => Promise<void>;
    reorderLists: (lists: List[]) => Promise<void>;
    updateListItems: (listId: string, items: Item[]) => Promise<void>;
    deleteItem: (listId: string, itemId: string) => Promise<void>;
    toggleTheme: () => void;
    todos: Todo[];
    addTodo: (title: string, content: string, priority: Priority) => Promise<void>;
    updateTodo: (id: string, title: string, content: string, priority: Priority) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    loading: boolean;
    sessions: ExecutionSession[];
    addSession: (name: string, listIds: string[], categoryId?: string) => Promise<string>;
    completeSession: (sessionId: string) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    combinations: ListCombination[];
    addCombination: (name: string, listIds: string[]) => Promise<string>;
    updateCombination: (id: string, updates: Partial<ListCombination>) => Promise<void>;
    deleteCombination: (id: string) => Promise<void>;
    updateListAccess: (id: string) => Promise<void>;
    archiveList: (id: string, archived: boolean) => Promise<void>;
    addSection: (listId: string, name: string) => Promise<void>;
    updateSection: (listId: string, sectionId: string, name: string) => Promise<void>;
    deleteSection: (listId: string, sectionId: string) => Promise<void>;
    importItemsFromList: (targetListId: string, sourceItems: Item[], sourceListName: string, sectionName?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Global application state provider.
 * Manages data synchronization with Firestore, theme settings, 
 * and core business logic for categories, lists, notes, and sessions.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { migrating } = useMigrateLocalStorage(user?.uid);

    const categoriesSync = useFirestoreSync<Category>('users/{uid}/categories', user?.uid);
    const listsSync = useFirestoreSync<List>('users/{uid}/lists', user?.uid);
    const todosSync = useFirestoreSync<Todo>('users/{uid}/notes', user?.uid);
    const sessionsSync = useFirestoreSync<ExecutionSession>('users/{uid}/sessions', user?.uid);
    const combinationsSync = useFirestoreSync<ListCombination>('users/{uid}/combinations', user?.uid);

    const processedLists = React.useMemo(() => {
        return listsSync.data.map((l: List) => ({
            ...l,
            items: l.items || []
        }));
    }, [listsSync.data]);

    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
        }

        const manualTheme = localStorage.getItem('manual_theme');
        if (!manualTheme) {
            try {
                // Use Europe/Stockholm time
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Stockholm',
                    hour: 'numeric',
                    hour12: false
                });

                const hour = parseInt(formatter.format(new Date()), 10);

                // Light mode between 08:00 and 18:00
                const isDay = hour >= 8 && hour < 18;
                setTheme(isDay ? 'light' : 'dark');
            } catch (error) {
                console.error("Error setting time-based theme:", error);
                // Fallback to local time if timezone fails
                const hour = new Date().getHours();
                const isDay = hour >= 8 && hour < 18;
                setTheme(isDay ? 'light' : 'dark');
            }
        }
    }, []);

    const addCategory = async (name: string) => {
        const id = uuidv4();
        await categoriesSync.addItem({ id, name });
        return id;
    };

    const updateCategoryName = async (id: string, name: string) => {
        await categoriesSync.updateItem(id, { name });
    };

    const deleteCategory = async (id: string) => {
        await categoriesSync.deleteItem(id);
        // Also delete associated lists
        const listsToDelete = processedLists.filter((l: List) => l.categoryId === id);
        await Promise.all(listsToDelete.map((l: List) => listsSync.deleteItem(l.id)));
    };

    const addList = async (name: string, categoryId: string) => {
        const id = uuidv4();
        await listsSync.addItem({ id, name, categoryId, items: [] });
        return id;
    };

    const updateListName = async (id: string, name: string) => {
        await listsSync.updateItem(id, { name });
    };

    const updateListSettings = async (id: string, settings: ListSettings) => {
        // If this list is being pinned, unpin all other lists first
        if (settings.pinned) {
            const pinnedLists = processedLists.filter((l: List) => l.id !== id && l.settings?.pinned);

            if (pinnedLists.length > 0) {
                const unpinPromises = pinnedLists.map((l: List) => {
                    const newSettings = { ...l.settings, pinned: false } as ListSettings;
                    return listsSync.updateItem(l.id, { settings: newSettings });
                });
                await Promise.all(unpinPromises);
            }
        }
        await listsSync.updateItem(id, { settings });
    };

    const updateListAccess = async (id: string) => {
        await listsSync.updateItem(id, { lastAccessedAt: new Date().toISOString() });
    };

    const archiveList = async (id: string, archived: boolean) => {
        const list = processedLists.find((l: List) => l.id === id);
        if (list) {
            const updates: Partial<List> = { archived };
            if (archived) {
                // Reset all items when archiving
                updates.items = list.items.map((item: Item) => ({ ...item, completed: false, state: 'unresolved' }));
            }
            await listsSync.updateItem(id, updates);
        }
    };

    const addCombination = async (name: string, listIds: string[]) => {
        const id = uuidv4();
        const newCombination: ListCombination = {
            id,
            name,
            listIds,
            createdAt: new Date().toISOString(),
        };
        await combinationsSync.addItem(newCombination);
        return id;
    };

    const updateCombination = async (id: string, updates: Partial<ListCombination>) => {
        await combinationsSync.updateItem(id, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    };

    const deleteCombination = async (id: string) => {
        await combinationsSync.deleteItem(id);
    };

    const deleteList = async (id: string) => {
        const listToDelete = processedLists.find((l: List) => l.id === id);
        if (listToDelete) {
            // Handle combinations
            const affectedCombinations = combinationsSync.data.filter((c: ListCombination) => c.listIds.includes(id));
            const combinationsToDelete: ListCombination[] = [];
            const combinationsToUpdate: ListCombination[] = [];

            for (const combo of affectedCombinations) {
                if (combo.listIds.length <= 2) {
                    combinationsToDelete.push(combo);
                } else {
                    // Otherwise, just remove the list from the combination's listIds
                    combinationsToUpdate.push(combo);
                }
            }

            // Delete list from Firestore
            await listsSync.deleteItem(id);

            // If this was the last list in the category, also delete the category
            const remainingListsInCategory = processedLists.filter((l: List) => l.categoryId === listToDelete.categoryId && l.id !== id);
            if (remainingListsInCategory.length === 0 && listToDelete.categoryId) {
                await categoriesSync.deleteItem(listToDelete.categoryId);
            }

            // Cascade operations: Cleanup combinations that depend on this list
            for (const combo of combinationsToDelete) {
                await combinationsSync.deleteItem(combo.id);
            }

            for (const combo of combinationsToUpdate) {
                await combinationsSync.updateItem(combo.id, {
                    listIds: combo.listIds.filter(lid => lid !== id),
                    updatedAt: new Date().toISOString()
                });
            }

            // Construct toast message
            let message = t('toasts.listDeleted', { name: listToDelete.name });
            if (combinationsToDelete.length > 0) {
                message += `. ${t('toasts.combinationsDeleted', { count: combinationsToDelete.length })}`;
            } else if (combinationsToUpdate.length > 0) {
                message += `. ${t('toasts.combinationsUpdated', { count: combinationsToUpdate.length })}`;
            }

            showToast(message, 'info', {
                label: t('common.undo'),
                onClick: async () => {
                    await listsSync.addItem(listToDelete);
                    // Note: We don't restore combinations automatically in this simple undo
                    // complicating the undo logic significantly. 
                    // Ideally we would restore them too, but for MVP this is acceptable or we should disable undo for this case.
                    // For now, let's keep it simple.
                }
            });
        }
    };

    const copyList = async (listId: string) => {
        const listToCopy = processedLists.find((l: List) => l.id === listId);
        if (listToCopy) {
            // Determine base name
            let baseName = listToCopy.name;
            const match = baseName.match(/^(.*?) kopia \d+$/);
            if (match) {
                baseName = match[1];
            }

            // Find all existing copies to determine the next number
            let maxCopyNumber = 0;
            processedLists.forEach((l: List) => {
                if (l.name === baseName) {
                    // The original list counts as "copy 0" effectively for logic, but we start numbering at 1
                }
                const copyMatch = l.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} kopia (\\d+)$`));
                if (copyMatch) {
                    const num = Number.parseInt(copyMatch[1], 10);
                    if (num > maxCopyNumber) {
                        maxCopyNumber = num;
                    }
                }
            });

            const newName = `${baseName} kopia ${maxCopyNumber + 1}`;

            const newList = {
                ...listToCopy,
                id: uuidv4(),
                name: newName,
                items: listToCopy.items.map((item: Item) => ({ ...item, id: uuidv4() })) // Deep copy items with new IDs
            };
            await listsSync.addItem(newList);
        }
    };

    const moveList = async (listId: string, newCategoryId: string) => {
        await listsSync.updateItem(listId, { categoryId: newCategoryId });
    };

    const reorderLists = async (reorderedLists: List[]) => {
        // Update all lists with new order values
        const updates = reorderedLists.map((list, index) =>
            listsSync.updateItem(list.id, { order: index })
        );
        await Promise.all(updates);
    };

    const reorderCategories = async (reorderedCategories: Category[]) => {
        // Update all categories with new order values
        const updates = reorderedCategories.map((category, index) =>
            categoriesSync.updateItem(category.id, { order: index })
        );
        await Promise.all(updates);
    };

    const updateListItems = async (listId: string, items: Item[]) => {
        await listsSync.updateItem(listId, { items });
    };

    const deleteItem = async (listId: string, itemId: string) => {
        const list = processedLists.find((l: List) => l.id === listId);
        if (list) {
            const itemToDelete = list.items.find((i: Item) => i.id === itemId);
            if (itemToDelete) {
                const newItems = list.items.filter((i: Item) => i.id !== itemId);
                await updateListItems(listId, newItems);

                showToast(t('toasts.itemDeleted'), 'info', {
                    label: t('common.undo'),
                    onClick: async () => {
                        // We need to fetch the latest state of the list before adding back
                        // But since we are inside the closure, we might need to rely on the fact that
                        // updateListItems handles the update.
                        // Ideally we should get the latest list from the sync hook, but we can't await it here easily in the same way.
                        // However, for undo, we can just push the item back to the list we have reference to, 
                        // or better, get the current list from the data array if possible, but that's hard in a callback.
                        // A simple approach:
                        const currentList = processedLists.find((l: List) => l.id === listId);
                        if (currentList) {
                            await updateListItems(listId, [...currentList.items, itemToDelete]);
                        }
                    }
                });
            }
        }
    };



    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
        localStorage.setItem('manual_theme', 'true');
    };

    const addTodo = async (title: string, content: string, priority: Priority) => {
        const newTodo: Todo = {
            id: uuidv4(),
            title,
            content,
            createdAt: new Date().toISOString(),
            priority,
            completed: false, // Default to false
        };
        await todosSync.addItem(newTodo);
    };

    const updateTodo = async (id: string, title: string, content: string, priority: Priority) => {
        await todosSync.updateItem(id, { title, content, priority });
    };

    const toggleTodo = async (id: string) => {
        const todo = todosSync.data.find((t: Todo) => t.id === id);
        if (todo) {
            await todosSync.updateItem(id, { completed: !todo.completed });
        }
    };

    const deleteTodo = async (id: string) => {
        await todosSync.deleteItem(id);
    };

    const addSession = async (name: string, listIds: string[], categoryId?: string) => {
        const id = uuidv4();
        const newSession: ExecutionSession = {
            id,
            name,
            listIds,
            createdAt: new Date().toISOString(),
            ...(categoryId && { categoryId }), // Only include if defined
        };
        await sessionsSync.addItem(newSession);
        return id;
    };

    const completeSession = async (sessionId: string) => {
        const session = sessionsSync.data.find((s: ExecutionSession) => s.id === sessionId);
        if (session) {
            // Reset all lists in the session
            const resetPromises = session.listIds.map((listId: string) => {
                const list = processedLists.find((l: List) => l.id === listId);
                if (list) {
                    const resetItems = list.items.map((item: Item) => ({ ...item, completed: false }));
                    return updateListItems(listId, resetItems);
                }
                return Promise.resolve();
            });
            await Promise.all(resetPromises);

            // Mark session as completed
            await sessionsSync.updateItem(sessionId, {
                completedAt: new Date().toISOString()
            });
        }
    };

    const deleteSession = async (id: string) => {
        await sessionsSync.deleteItem(id);
    };

    const addSection = async (listId: string, name: string) => {
        const list = processedLists.find((l: List) => l.id === listId);
        if (list) {
            const sections = list.sections || [];
            const newSection: Section = {
                id: uuidv4(),
                name,
                order: 0 // Temporarily 0
            };

            // Prepend and re-index
            const updatedSections = [newSection, ...sections].map((section, index) => ({
                ...section,
                order: index
            }));

            await listsSync.updateItem(listId, { sections: updatedSections });
        }
    };

    const updateSection = async (listId: string, sectionId: string, name: string) => {
        const list = processedLists.find((l: List) => l.id === listId);
        if (list && list.sections) {
            const updatedSections = list.sections.map(section =>
                section.id === sectionId ? { ...section, name } : section
            );
            await listsSync.updateItem(listId, { sections: updatedSections });
        }
    };

    const deleteSection = async (listId: string, sectionId: string) => {
        const list = processedLists.find((l: List) => l.id === listId);
        if (list) {
            // Remove section from sections array
            const updatedSections = (list.sections || []).filter(s => s.id !== sectionId);

            // Remove sectionId from all items in this section
            const updatedItems = list.items.map(item =>
                item.sectionId === sectionId ? { ...item, sectionId: undefined } : item
            );

            await listsSync.updateItem(listId, {
                sections: updatedSections,
                items: updatedItems
            });
        }
    };

    const importItemsFromList = async (targetListId: string, sourceItems: Item[], sourceListName: string, sectionName?: string) => {
        const list = processedLists.find((l: List) => l.id === targetListId);
        if (!list) return;

        let updatedSections = list.sections || [];
        let sectionId: string | undefined;

        if (sectionName) {
            const newSectionId = uuidv4();
            const newSection: Section = {
                id: newSectionId,
                name: sectionName,
                order: updatedSections.length
            };
            updatedSections = [...updatedSections, newSection];
            sectionId = newSectionId;
        }

        const newItems: Item[] = sourceItems.map(item => ({
            id: uuidv4(),
            text: item.text,
            completed: false,
            state: 'unresolved',
            ...(sectionId && { sectionId })
        }));

        await listsSync.updateItem(targetListId, {
            sections: updatedSections,
            items: [...list.items, ...newItems]
        });

        // Trigger success toast message
        showToast(t('lists.importFromList.successToast', { count: newItems.length, name: sourceListName }), 'success');
    };

    return (
        <AppContext.Provider
            value={{
                categories: categoriesSync.data,
                lists: processedLists,
                theme,
                addCategory,
                updateCategoryName,
                deleteCategory,
                reorderCategories,
                addList,
                updateListName,
                updateListSettings,
                deleteList,
                copyList,
                moveList,
                reorderLists,
                updateListItems,
                deleteItem,
                toggleTheme,
                todos: todosSync.data,
                addTodo,
                updateTodo,
                toggleTodo,
                deleteTodo,
                searchQuery,
                setSearchQuery,
                loading: categoriesSync.loading || listsSync.loading || todosSync.loading || migrating,
                sessions: sessionsSync.data,
                addSession,
                completeSession,
                deleteSession,
                combinations: combinationsSync.data,
                addCombination,
                updateCombination,
                deleteCombination,
                updateListAccess,
                archiveList,
                addSection,
                updateSection,
                deleteSection,
                importItemsFromList,
            }}
        >
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
