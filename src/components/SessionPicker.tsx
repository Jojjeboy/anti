import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { List, Category } from '../types';

interface SessionPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (name: string, listIds: string[]) => void;
    lists: List[];
    categories?: Category[]; // Optional for backward compatibility
    onSaveCombination?: (name: string, listIds: string[]) => Promise<void>;
}

export const SessionPicker: React.FC<SessionPickerProps> = ({
    isOpen,
    onClose,
    onCreateSession,
    lists,
    categories,
    onSaveCombination,
}) => {
    const { t } = useTranslation();
    const [sessionName, setSessionName] = useState('');
    const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    // Helper function to get category name
    const getCategoryName = (categoryId: string): string => {
        if (!categories) return '';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : '';
    };

    if (!isOpen) return null;

    const toggleList = (listId: string) => {
        setSelectedListIds(prev =>
            prev.includes(listId)
                ? prev.filter(id => id !== listId) // Remove - maintains order
                : [...prev, listId] // Add to end - preserves selection order
        );
    };

    // Filter lists based on search query
    const filteredLists = lists.filter(list => {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = list.name.toLowerCase().includes(searchLower);
        const matchesCategory = categories 
            ? getCategoryName(list.categoryId).toLowerCase().includes(searchLower)
            : false;
        return matchesName || matchesCategory;
    });

    // Sort lists: selected first (in selection order), then unselected (alphabetically)
    const sortedLists = [
        // Selected lists in selection order
        ...selectedListIds.map(id => filteredLists.find(list => list.id === id)).filter(Boolean) as typeof filteredLists,
        // Unselected lists alphabetically
        ...filteredLists.filter(list => !selectedListIds.includes(list.id)).sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
    ];

    const handleCreate = async () => {
        if (sessionName.trim() && selectedListIds.length >= 2) { // Minimum 2 lists required
            if (saveAsTemplate && onSaveCombination) {
                await onSaveCombination(sessionName.trim(), selectedListIds);
            }
            onCreateSession(sessionName.trim(), selectedListIds);
            // Reset state
            setSessionName('');
            setSelectedListIds([]);
            setSearchQuery('');
            setSaveAsTemplate(false);
            onClose();
        }
    };

    const handleCancel = () => {
        // Reset state
        setSessionName('');
        setSelectedListIds([]);
        setSearchQuery('');
        setSaveAsTemplate(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t('sessions.createTitle', 'Skapa Session')}
                        </h3>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('sessions.sessionName', 'Sessionsnamn')}
                        </label>
                        <input
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder={t('sessions.namePlaceholder', 'T.ex. Tisdagens morgon')}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    
                    {onSaveCombination && (
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={saveAsTemplate}
                                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span>{t('combinations.saveAsTemplate', 'Spara som mall för återanvändning')}</span>
                            </label>
                        </div>
                    )}

                    <div className="mb-4">
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
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
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
                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {list.name}
                                                </span>
                                                {categories && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {getCategoryName(list.categoryId)}
                                                    </span>
                                                )}
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

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('common.cancel', 'Avbryt')}
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!sessionName.trim() || selectedListIds.length < 2}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                                !sessionName.trim() || selectedListIds.length < 2
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {t('sessions.create', 'Skapa Session')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
