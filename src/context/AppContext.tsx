import React, { createContext, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SunCalc from 'suncalc';
import useLocalStorage from '../hooks/useLocalStorage';
import { Category, List, Item } from '../types';

interface AppContextType {
    categories: Category[];
    lists: List[];
    theme: 'light' | 'dark';
    addCategory: (name: string) => void;
    deleteCategory: (id: string) => void;
    addList: (name: string, categoryId: string) => void;
    deleteList: (id: string) => void;
    copyList: (listId: string) => void;
    moveList: (listId: string, newCategoryId: string) => void;
    updateListItems: (listId: string, items: Item[]) => void;
    toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
    const [lists, setLists] = useLocalStorage<List[]>('lists', []);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (navigator.geolocation) {
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

    const deleteCategory = (id: string) => {
        setCategories(categories.filter((c) => c.id !== id));
        setLists(lists.filter((l) => l.categoryId !== id));
    };

    const addList = (name: string, categoryId: string) => {
        setLists([...lists, { id: uuidv4(), name, categoryId, items: [] }]);
    };

    const deleteList = (id: string) => {
        setLists(lists.filter((l) => l.id !== id));
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

    const updateListItems = (listId: string, items: Item[]) => {
        setLists(lists.map((l) => (l.id === listId ? { ...l, items } : l)));
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <AppContext.Provider
            value={{
                categories,
                lists,
                theme,
                addCategory,
                deleteCategory,
                addList,
                deleteList,
                copyList,
                moveList,
                updateListItems,
                toggleTheme,
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
