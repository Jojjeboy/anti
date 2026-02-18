import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { List, Category, ListCombination } from '../types';

interface CombinationEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, listIds: string[]) => void;
    lists: List[];
    categories: Category[];
    combination?: ListCombination; // If editing
    initialName?: string;
}

export const CombinationEditor: React.FC<CombinationEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    lists,
    categories,
    combination,
    initialName = ''
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialName);
    const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (combination) {
                setName(combination.name);
                setSelectedListIds(combination.listIds);
            } else {
                setName(initialName);
                setSelectedListIds([]);
            }
            setSearchQuery('');
        }
    }, [isOpen, combination, initialName]);

    // Helper function to get category name
    const getCategoryName = (categoryId: string): string => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : '';
    };

    if (!isOpen) return null;

    const toggleList = (listId: string) => {
        setSelectedListIds(prev =>
            prev.includes(listId)
                ? prev.filter(id => id !== listId)
                : [...prev, listId]
        );
    };

    // Filter lists based on search query
    const filteredLists = lists.filter(list => {
        if (!list || !list.name) return false;
        const searchLower = searchQuery.toLowerCase();
        const matchesName = list.name.toLowerCase().includes(searchLower);
        const matchesCategory = getCategoryName(list.categoryId).toLowerCase().includes(searchLower);
        return matchesName || matchesCategory;
    });

    // Sort lists: selected first (in selection order), then unselected (alphabetically)
    const sortedLists = [
        // Selected lists in selection order
        ...selectedListIds.map(id => filteredLists.find(list => list.id === id)).filter((l): l is List => !!l),
        // Unselected lists alphabetically
        ...filteredLists.filter(list => !selectedListIds.includes(list.id)).sort((a, b) => a.name.localeCompare(b.name))
    ];

    const handleSave = () => {
        if (name.trim() && selectedListIds.length >= 2) {
            onSave(name.trim(), selectedListIds);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
                <div className="p-6 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {combination ? t('combinations.edit', 'Redigera kombination') : t('combinations.create', 'Skapa kombination')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('common.name', 'Namn')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('combinations.namePlaceholder', 'T.ex. Helgrutin')}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('sessions.selectLists', 'Välj listor')} ({selectedListIds.length})
                            {selectedListIds.length < 2 && (
                                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                                    {t('sessions.minTwoLists', '(minst 2 listor krävs)')}
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('sessions.searchPlaceholder', 'Sök listor...')}
                            className="w-full p-2 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-2">
                    <div className="space-y-2">
                        {sortedLists.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">
                                {searchQuery ? t('sessions.noResults', 'Inga listor hittades') : t('sessions.noLists', 'Inga listor tillgängliga')}
                            </p>
                        ) : (
                            sortedLists.map((list) => {
                                const isSelected = selectedListIds.includes(list.id);
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => toggleList(list.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                                            isSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                                : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {list.name}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {getCategoryName(list.categoryId)}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-6 flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('common.cancel', 'Avbryt')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim() || selectedListIds.length < 2}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                                !name.trim() || selectedListIds.length < 2
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {t('common.save', 'Spara')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
