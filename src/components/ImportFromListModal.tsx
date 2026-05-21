import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronLeft, Folder, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { List, Item } from '../types';

interface ImportFromListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (sourceList: List, selectedItems: Item[], sectionName?: string) => Promise<void>;
    currentListId: string;
    lists: List[];
}

export const ImportFromListModal: React.FC<ImportFromListModalProps> = ({
    isOpen,
    onClose,
    onImport,
    currentListId,
    lists,
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedList, setSelectedList] = useState<List | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [createSection, setCreateSection] = useState(true);
    const [sectionName, setSectionName] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Filter out the current list and archived lists
    const availableLists = useMemo(() => {
        return lists
            .filter((l) => l.id !== currentListId && !l.archived)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [lists, currentListId]);

    // Filter available lists by search query
    const filteredLists = useMemo(() => {
        if (!searchQuery.trim()) return availableLists;
        const query = searchQuery.toLowerCase();
        return availableLists.filter((l) => l.name.toLowerCase().includes(query));
    }, [availableLists, searchQuery]);

    // Handle list selection
    const handleSelectList = (list: List) => {
        setSelectedList(list);
        setSectionName(list.name);
        // By default, check all items
        setSelectedItemIds(new Set(list.items.map((i) => i.id)));
    };

    // Toggle single item selection
    const handleToggleItem = (itemId: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItemIds(newSet);
    };

    // Toggle select all / none
    const handleSelectAll = () => {
        if (!selectedList) return;
        setSelectedItemIds(new Set(selectedList.items.map((i) => i.id)));
    };

    const handleSelectNone = () => {
        setSelectedItemIds(new Set());
    };

    // Reset state on close
    const handleClose = () => {
        setSelectedList(null);
        setSelectedItemIds(new Set());
        setSearchQuery('');
        setCreateSection(true);
        setSectionName('');
        setIsImporting(false);
        onClose();
    };

    // Trigger import callback
    const handleImportSubmit = async () => {
        if (!selectedList || selectedItemIds.size === 0) return;

        const itemsToImport = selectedList.items.filter((item) => selectedItemIds.has(item.id));

        try {
            setIsImporting(true);
            await onImport(
                selectedList,
                itemsToImport,
                createSection && sectionName.trim() ? sectionName.trim() : undefined
            );
            handleClose();
        } catch (err) {
            console.error('Failed to import items:', err);
        } finally {
            setIsImporting(false);
        }
    };

    // Keep active list's items length in mind
    const hasItems = selectedList && selectedList.items.length > 0;

    // Reset selected items checklist if selectedList disappears
    useEffect(() => {
        if (!isOpen) {
            setSelectedList(null);
            setSelectedItemIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {selectedList && (
                            <button
                                onClick={() => setSelectedList(null)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                                title={t('common.back', 'Back')}
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {selectedList
                                ? t('lists.importFromList.title', 'Lägg till från annan lista')
                                : t('lists.importFromList.title', 'Lägg till från annan lista')}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar">
                    {!selectedList ? (
                        /* Step 1: List Picker */
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                    'lists.importFromList.description',
                                    'Välj en lista att hämta objekt ifrån. Du kan välja exakt vilka objekt du vill importera.'
                                )}
                            </p>

                            {/* Search bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('lists.importFromList.searchPlaceholder', 'Sök listor...')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            {/* Lists display */}
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                {filteredLists.length === 0 ? (
                                    <p className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 italic">
                                        {searchQuery
                                            ? t('sessions.noResults', 'Inga listor hittades')
                                            : t('lists.importFromList.noLists', 'Inga andra listor tillgängliga')}
                                    </p>
                                ) : (
                                    filteredLists.map((list) => (
                                        <button
                                            key={list.id}
                                            onClick={() => handleSelectList(list)}
                                            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50/50 dark:bg-gray-800/40 dark:hover:bg-blue-900/10 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-all text-left"
                                        >
                                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                <Folder size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {list.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {list.items.length} {t('lists.itemsCount', 'objekt')}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Item Checklist & Settings */
                        <div className="space-y-5">
                            {/* Selected source info */}
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                    <Folder size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                                        {t('lists.importFromList.selectList', 'Källista')}
                                    </span>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {selectedList.name}
                                    </p>
                                </div>
                            </div>

                            {/* Section settings */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3 border border-gray-100 dark:border-gray-700">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={createSection}
                                        onChange={(e) => setCreateSection(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t(
                                            'lists.importFromList.createSection',
                                            'Skapa ny sektion för dessa objekt'
                                        )}
                                    </span>
                                </label>

                                {createSection && (
                                    <div className="space-y-1 animate-in fade-in duration-200">
                                        <label
                                            htmlFor="section-name"
                                            className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            {t('lists.importFromList.sectionNameLabel', 'Sektionsnamn')}
                                        </label>
                                        <input
                                            id="section-name"
                                            type="text"
                                            value={sectionName}
                                            onChange={(e) => setSectionName(e.target.value)}
                                            placeholder={selectedList.name}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Items Select controls */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span>{t('lists.importFromList.itemsToImport', 'Välj objekt')}</span>
                                    {hasItems && (
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {t('lists.importFromList.selectAll', 'Markera alla')}
                                            </button>
                                            <span>|</span>
                                            <button
                                                type="button"
                                                onClick={handleSelectNone}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {t('lists.importFromList.selectNone', 'Avmarkera alla')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                                    {!hasItems ? (
                                        <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 italic">
                                            {t('lists.emptyList', 'Listan är tom')}
                                        </p>
                                    ) : (
                                        selectedList.items.map((item) => {
                                            const isChecked = selectedItemIds.has(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleToggleItem(item.id)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                                                        isChecked
                                                            ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                                    }`}
                                                >
                                                    <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                        {isChecked ? (
                                                            <CheckSquare size={18} className="fill-blue-50 dark:fill-blue-950" />
                                                        ) : (
                                                            <Square size={18} />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                                        {item.text}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/40">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('common.cancel', 'Avbryt')}
                    </button>
                    {selectedList && (
                        <button
                            onClick={handleImportSubmit}
                            disabled={selectedItemIds.size === 0 || isImporting}
                            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                                selectedItemIds.size === 0 || isImporting
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {isImporting ? (
                                <span>{t('import.importing', 'Importerar...')}</span>
                            ) : (
                                <span>
                                    {t('lists.importFromList.importButton', {
                                        count: selectedItemIds.size,
                                        defaultValue: `Importera ${selectedItemIds.size} objekt`,
                                    })}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
