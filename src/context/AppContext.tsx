import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SunCalc from 'suncalc';
import useLocalStorage from '../hooks/useLocalStorage';
import { Category, List, Item, Note } from '../types';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';

interface AppContextType {
    categories: Category[];
    lists: List[];
    theme: 'light' | 'dark';
    addCategory: (name: string) => void;
    updateCategoryName: (id: string, name: string) => void;
    deleteCategory: (id: string) => void;
    addList: (name: string, categoryId: string) => void;
    updateListName: (id: string, name: string) => void;
    deleteList: (id: string) => void;
    copyList: (listId: string) => void;
    moveList: (listId: string, newCategoryId: string) => void;
    togglePin: (listId: string) => void;
    updateListItems: (listId: string, items: Item[]) => void;
    deleteItem: (listId: string, itemId: string) => void;
    importData: (data: any) => void;
    toggleTheme: () => void;
    notes: Note[];
    addNote: (title: string, content: string, priority: 'low' | 'medium' | 'high') => void;
    updateNote: (id: string, title: string, content: string, priority: 'low' | 'medium' | 'high') => void;
    deleteNote: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
    const [lists, setLists] = useLocalStorage<List[]>('lists', []);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
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

    const addCategory = (name: string) => {
        setCategories([...categories, { id: uuidv4(), name }]);
    };

    const updateCategoryName = (id: string, name: string) => {
        setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
    };

    const deleteCategory = (id: string) => {
        setCategories(categories.filter((c) => c.id !== id));
        setLists(lists.filter((l) => l.categoryId !== id));
    };

    const addList = (name: string, categoryId: string) => {
        setLists([...lists, { id: uuidv4(), name, categoryId, items: [] }]);
    };

    const updateListName = (id: string, name: string) => {
        setLists(lists.map((l) => (l.id === id ? { ...l, name } : l)));
    };

    const deleteList = (id: string) => {
        const listToDelete = lists.find(l => l.id === id);
        if (listToDelete) {
            setLists(lists.filter((l) => l.id !== id));
            showToast(t('toasts.listDeleted', { name: listToDelete.name }), 'info', {
                label: t('common.undo'),
                onClick: () => {
                    setLists(prev => [...prev, listToDelete]);
                }
            });
        }
    };

    const copyList = (listId: string) => {
        const listToCopy = lists.find((l) => l.id === listId);
        if (listToCopy) {
            // Determine base name
            let baseName = listToCopy.name;
            const match = baseName.match(/^(.*?) kopia \d+$/);
            if (match) {
                baseName = match[1];
            }

            // Find all existing copies to determine the next number
            let maxCopyNumber = 0;
            lists.forEach((l) => {
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
            setLists([...lists, newList]);
        }
    };

    const moveList = (listId: string, newCategoryId: string) => {
        setLists(lists.map((l) => (l.id === listId ? { ...l, categoryId: newCategoryId } : l)));
    };

    const togglePin = (listId: string) => {
        setLists(lists.map((l) => (l.id === listId ? { ...l, isPinned: !l.isPinned } : l)));
    };

    const updateListItems = (listId: string, items: Item[]) => {
        setLists(lists.map((l) => (l.id === listId ? { ...l, items } : l)));
    };

    const deleteItem = (listId: string, itemId: string) => {
        const list = lists.find(l => l.id === listId);
        if (list) {
            const itemToDelete = list.items.find(i => i.id === itemId);
            if (itemToDelete) {
                const newItems = list.items.filter(i => i.id !== itemId);
                updateListItems(listId, newItems);

                showToast(t('toasts.itemDeleted'), 'info', {
                    label: t('common.undo'),
                    onClick: () => {
                        // Re-fetch list to get current state in case of other changes
                        setLists(currentLists => {
                            return currentLists.map(l => {
                                if (l.id === listId) {
                                    return { ...l, items: [...l.items, itemToDelete] };
                                }
                                return l;
                            });
                        });
                    }
                });
            }
        }
    };

    const importData = (data: any) => {
        try {
            if (data.categories) setCategories(data.categories);
            if (data.lists) setLists(data.lists);
            if (data.notes) setNotes(data.notes);
            if (data.theme) setTheme(data.theme);
            showToast(t('toasts.dataImported'), 'success');
        } catch (error) {
            showToast(t('toasts.importFailed'), 'error');
            console.error('Import error:', error);
        }
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
        localStorage.setItem('manual_theme', 'true');
    };

    const addNote = (title: string, content: string, priority: 'low' | 'medium' | 'high') => {
        const newNote: Note = {
            id: uuidv4(),
            title,
            content,
            createdAt: new Date().toISOString(),
            priority,
        };
        setNotes([newNote, ...notes]);
    };

    const updateNote = (id: string, title: string, content: string, priority: 'low' | 'medium' | 'high') => {
        setNotes(notes.map((n) => (n.id === id ? { ...n, title, content, priority } : n)));
    };

    const deleteNote = (id: string) => {
        setNotes(notes.filter((n) => n.id !== id));
    };

    return (
        <AppContext.Provider
            value={{
                categories,
                lists,
                theme,
                addCategory,
                updateCategoryName,
                deleteCategory,
                addList,
                updateListName,
                deleteList,
                copyList,
                moveList,
                togglePin,
                updateListItems,
                deleteItem,
                importData,
                toggleTheme,
                notes,
                addNote,
                updateNote,
                deleteNote,
                searchQuery,
                setSearchQuery,
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
