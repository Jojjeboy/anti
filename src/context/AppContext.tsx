import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SunCalc from 'suncalc';
import { Category, List, Item, Note } from '../types';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { useMigrateLocalStorage } from '../hooks/useMigrateLocalStorage';

interface AppContextType {
    categories: Category[];
    lists: List[];
    theme: 'light' | 'dark';
    addCategory: (name: string) => Promise<void>;
    updateCategoryName: (id: string, name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addList: (name: string, categoryId: string) => Promise<string>;
    updateListName: (id: string, name: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
    copyList: (listId: string) => Promise<void>;
    moveList: (listId: string, newCategoryId: string) => Promise<void>;
    updateListItems: (listId: string, items: Item[]) => Promise<void>;
    deleteItem: (listId: string, itemId: string) => Promise<void>;
    toggleTheme: () => void;
    notes: Note[];
    addNote: (title: string, content: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
    updateNote: (id: string, title: string, content: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { migrating } = useMigrateLocalStorage(user?.uid);

    const categoriesSync = useFirestoreSync<Category>('users/{uid}/categories', user?.uid);
    const listsSync = useFirestoreSync<List>('users/{uid}/lists', user?.uid);
    const notesSync = useFirestoreSync<Note>('users/{uid}/notes', user?.uid);

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
        if (!manualTheme && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const now = new Date();
                    const times = SunCalc.getTimes(now, latitude, longitude);

                    // Check if it's daytime (between sunrise and sunset)
                    const isDay = now > times.sunrise && now < times.sunset;

                    setTheme(isDay ? 'light' : 'dark');
                },
                (error) => {
                    console.error("Error getting location for auto-theme:", error);
                }
            );
        }
    }, []);

    const addCategory = async (name: string) => {
        await categoriesSync.addItem({ id: uuidv4(), name });
    };

    const updateCategoryName = async (id: string, name: string) => {
        await categoriesSync.updateItem(id, { name });
    };

    const deleteCategory = async (id: string) => {
        await categoriesSync.deleteItem(id);
        // Also delete associated lists
        const listsToDelete = listsSync.data.filter((l) => l.categoryId === id);
        await Promise.all(listsToDelete.map(l => listsSync.deleteItem(l.id)));
    };

    const addList = async (name: string, categoryId: string) => {
        const id = uuidv4();
        await listsSync.addItem({ id, name, categoryId, items: [] });
        return id;
    };

    const updateListName = async (id: string, name: string) => {
        await listsSync.updateItem(id, { name });
    };

    const deleteList = async (id: string) => {
        const listToDelete = listsSync.data.find(l => l.id === id);
        if (listToDelete) {
            await listsSync.deleteItem(id);
            showToast(t('toasts.listDeleted', { name: listToDelete.name }), 'info', {
                label: t('common.undo'),
                onClick: async () => {
                    await listsSync.addItem(listToDelete);
                }
            });
        }
    };

    const copyList = async (listId: string) => {
        const listToCopy = listsSync.data.find((l) => l.id === listId);
        if (listToCopy) {
            // Determine base name
            let baseName = listToCopy.name;
            const match = baseName.match(/^(.*?) kopia \d+$/);
            if (match) {
                baseName = match[1];
            }

            // Find all existing copies to determine the next number
            let maxCopyNumber = 0;
            listsSync.data.forEach((l) => {
                if (l.name === baseName) {
                    // The original list counts as "copy 0" effectively for logic, but we start numbering at 1
                }
                const copyMatch = l.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} kopia (\\d+)$`));
                if (copyMatch) {
                    const num = parseInt(copyMatch[1], 10);
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
                items: listToCopy.items.map(item => ({ ...item, id: uuidv4() })) // Deep copy items with new IDs
            };
            await listsSync.addItem(newList);
        }
    };

    const moveList = async (listId: string, newCategoryId: string) => {
        await listsSync.updateItem(listId, { categoryId: newCategoryId });
    };

    const updateListItems = async (listId: string, items: Item[]) => {
        await listsSync.updateItem(listId, { items });
    };

    const deleteItem = async (listId: string, itemId: string) => {
        const list = listsSync.data.find(l => l.id === listId);
        if (list) {
            const itemToDelete = list.items.find(i => i.id === itemId);
            if (itemToDelete) {
                const newItems = list.items.filter(i => i.id !== itemId);
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
                        const currentList = listsSync.data.find(l => l.id === listId);
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

    const addNote = async (title: string, content: string, priority: 'low' | 'medium' | 'high') => {
        const newNote: Note = {
            id: uuidv4(),
            title,
            content,
            createdAt: new Date().toISOString(),
            priority,
        };
        await notesSync.addItem(newNote);
    };

    const updateNote = async (id: string, title: string, content: string, priority: 'low' | 'medium' | 'high') => {
        await notesSync.updateItem(id, { title, content, priority });
    };

    const deleteNote = async (id: string) => {
        await notesSync.deleteItem(id);
    };

    return (
        <AppContext.Provider
            value={{
                categories: categoriesSync.data,
                lists: listsSync.data,
                theme,
                addCategory,
                updateCategoryName,
                deleteCategory,
                addList,
                updateListName,
                deleteList,
                copyList,
                moveList,
                updateListItems,
                deleteItem,
                toggleTheme,
                notes: notesSync.data,
                addNote,
                updateNote,
                deleteNote,
                searchQuery,
                setSearchQuery,
                loading: categoriesSync.loading || listsSync.loading || notesSync.loading || migrating,
            }}
        >
            {children}
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
