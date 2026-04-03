import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Folder, ChevronRight, Plus, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { SessionPicker } from './SessionPicker';
import geminiIconUrl from '../assets/gemini.svg';

import { CombinationCard } from './CombinationCard';
import { CombinationEditor } from './CombinationEditor';
import { ListCombination, Item } from '../types';
import { CategorySection } from './CategorySection';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { ImportListModal } from './ImportListModal';
import { AIListGeneratorModal } from './AIListGeneratorModal';

/**
 * Main overview page that displays categories and their associated lists.
 * Provides entry points for managing categories, importing lists, 
 * and using list combinations (templates).
 */
export const CategoryView: React.FC = React.memo(() => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { categories, lists, addCategory, deleteCategory, updateCategoryName, addList, updateListSettings, deleteList, copyList, moveList, updateListItems, reorderLists, addSession, combinations, addCombination, updateCombination, deleteCombination, reorderCategories } = useApp();
    const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'archived'>('home');
    const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
    const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

    // We don't need combinationsOpen state anymore as it's a dedicated tab

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string | null }>({
        isOpen: false,
        categoryId: null,
    });
    const [editorState, setEditorState] = useState<{ isOpen: boolean; combination?: ListCombination }>({
        isOpen: false,
    });
    const [deleteCombinationModal, setDeleteCombinationModal] = useState<{ isOpen: boolean; combinationId: string | null }>({
        isOpen: false,
        combinationId: null,
    });
    const [deleteListModal, setDeleteListModal] = useState<{ isOpen: boolean; listId: string | null }>({
        isOpen: false,
        listId: null,
    });
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);

    // Categories sorted by their order property for consistent display
    const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Get recently accessed lists - excluding archived ones
    const recentLists = React.useMemo(() => {
        return [...lists]
            .filter(l => l.lastAccessedAt && !l.archived)
            .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())
            .slice(0, 3);
    }, [lists]);

    // Get all archived lists
    const archivedLists = React.useMemo(() => {
        return [...lists]
            .filter(l => l.archived)
            .sort((a, b) => (b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0) - (a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0));
    }, [lists]);

    useEffect(() => {
        document.title = 'LoopList';
    }, []);

    /**
     * Confirms and executes category deletion
     */
    const confirmDelete = () => {
        if (deleteModal.categoryId) {
            deleteCategory(deleteModal.categoryId);
            setDeleteModal({ isOpen: false, categoryId: null });
        }
    };

    const handleCreateSession = async (name: string, listIds: string[]) => {
        const sessionId = await addSession(name, listIds);
        navigate(`/session/${sessionId}`);
    };

    const handleSaveCombination = async (name: string, listIds: string[]) => {
        if (editorState.combination) {
            await updateCombination(editorState.combination.id, { name, listIds });
        } else {
            await addCombination(name, listIds);
        }
    };

    const handleStartFromCombination = async (listIds: string[]) => {
        // Find combination name for the session or use a default
        const combination = combinations.find(c => JSON.stringify(c.listIds) === JSON.stringify(listIds)); // Simple lookup
        const name = combination ? combination.name : t('sessions.newSession', 'Ny Session');

        const sessionId = await addSession(name, listIds);
        navigate(`/session/${sessionId}`);
    };

    const confirmDeleteCombination = async () => {
        if (deleteCombinationModal.combinationId) {
            await deleteCombination(deleteCombinationModal.combinationId);
            setDeleteCombinationModal({ isOpen: false, combinationId: null });
        }
    };

    const confirmDeleteList = async () => {
        if (deleteListModal.listId) {
            await deleteList(deleteListModal.listId);
            setDeleteListModal({ isOpen: false, listId: null });
        }
    };


    /**
     * Handles the import of a list from JSON data.
     */
    const handleImportList = async (name: string, items: Item[], categoryId: string, aiPrompt?: string) => {
        const newListId = await addList(name, categoryId);
        await updateListItems(newListId, items);

        if (aiPrompt) {
            await updateListSettings(newListId, {
                threeStageMode: false,
                defaultSort: 'manual',
                isAIGenerated: true,
                aiPrompt
            });
        }

        navigate(`/list/${newListId}`);
    };

    return (
        <div className="space-y-8 pb-8">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('categories.title')}</h2>
                <button
                    onClick={() => setAiModalOpen(true)}
                    className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all group shrink-0"
                    title="Skapa med AI"
                >
                    <img src={geminiIconUrl} alt="Gemini" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </button>
            </div>

            {/* Categories Section - Always Visible */}
            <div className="grid grid-cols-1 gap-6 w-full min-w-0">
                {sortedCategories.map((category) => (
                    <CategorySection
                        key={category.id}
                        category={category}
                        lists={lists}
                        categories={categories}
                        onDelete={(categoryId: string) => setDeleteModal({ isOpen: true, categoryId })}
                        onUpdateName={updateCategoryName}
                        onAddList={async (name, categoryId) => {
                            const id = await addList(name, categoryId);
                            navigate(`/list/${id}`);
                        }}
                        onCopyList={copyList}
                        onMoveList={moveList}
                        onDeleteList={(listId: string) => setDeleteListModal({ isOpen: true, listId })}
                        onClearCompleted={(listId) => {
                            const list = lists.find(l => l.id === listId);
                            if (list) {
                                const activeItems = list.items.filter(i => !i.completed);
                                updateListItems(listId, activeItems);
                            }
                        }}
                        onReorderLists={reorderLists}
                    />
                ))}
                {sortedCategories.length === 0 && (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <Folder size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500">{t('categories.empty')}</p>
                        <p className="text-sm text-gray-400">{t('categories.emptyHint')}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={() => setManageCategoriesOpen(true)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                    {t('categories.manage', 'Hantera kategorier')}
                </button>
                <div className="hidden sm:block"> {/* Spacer */} </div>
                <button
                    onClick={() => setImportModalOpen(true)}
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline transition-colors flex items-center gap-1"
                >
                    <span>{t('categories.importJSON', 'Import JSON')}</span>
                </button>
            </div>

            {/* Inline Tabs Section */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
                {/* Tabs Header */}
                <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'home'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {t('categories.recent', 'Senaste')}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'templates'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {t('combinations.title')}
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'archived'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {t('categories.archived')}
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'home' && (
                    <div className="animate-in slide-in-from-left-2 fade-in duration-300">
                        {recentLists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {recentLists.map((list, index) => {
                                    const activeCount = (list.items || []).filter(i => !i.completed).length;
                                    const listName = list.name || '';
                                    const truncatedName = listName.length > 30 ? listName.substring(0, 30) + '...' : listName;
                                    return (
                                        <button
                                            key={`${list.id}-${index}`}
                                            onClick={() => navigate(`/list/${list.id}`)}
                                            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group w-full min-w-0 overflow-hidden text-left block"
                                        >
                                            <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate min-w-0 flex-1" title={list.name}>{truncatedName}</span>
                                                <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`w-2 h-2 rounded-full ${activeCount === 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                {activeCount === 0
                                                    ? t('categories.allDone', 'Klart')
                                                    : t('categories.itemsLeft', { count: activeCount, defaultValue: `${activeCount} kvar` })}

                                                {list.lastAccessedAt && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            {(() => {
                                                                const date = new Date(list.lastAccessedAt);
                                                                const now = new Date();
                                                                const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

                                                                if (diffInSeconds < 60) return t('time.justNow', 'Just nu');

                                                                const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });

                                                                if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
                                                                if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
                                                                return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
                                                            })()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                                {t('categories.noRecent', 'Inga nyligen använda listor')}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="animate-in slide-in-from-right-2 fade-in duration-300">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setEditorState({ isOpen: true })}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                {t('combinations.createRaw', 'Skapa ny mall')}
                            </button>
                        </div>

                        {combinations.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <Layers size={48} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">
                                    {t('combinations.empty', 'Du har inga sparade mallar än.')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {combinations.map(combo => (
                                    <CombinationCard
                                        key={combo.id}
                                        combination={combo}
                                        lists={lists}
                                        onStart={handleStartFromCombination}
                                        onEdit={(id) => setEditorState({ isOpen: true, combination: combinations.find(c => c.id === id) })}
                                        onDelete={(id) => setDeleteCombinationModal({ isOpen: true, combinationId: id })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'archived' && (
                    <div className="animate-in slide-in-from-right-2 fade-in duration-300">
                        {archivedLists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {archivedLists.map(list => {
                                    const listName = list.name || '';
                                    const truncatedName = listName.length > 30 ? listName.substring(0, 30) + '...' : listName;
                                    return (
                                        <button
                                            key={list.id}
                                            onClick={() => navigate(`/list/${list.id}`)}
                                            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group w-full min-w-0 overflow-hidden opacity-75 grayscale-[0.5] text-left block"
                                        >
                                            <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate min-w-0 flex-1" title={list.name}>{truncatedName}</span>
                                                <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {t('lists.archivedBadge')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {list.items?.length || 0} {t('lists.itemsCount')}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
                                {t('lists.empty', 'Inga arkiverade listor')}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, categoryId: null })}
                onConfirm={confirmDelete}
                title={t('categories.deleteTitle')}
                message={t('categories.deleteMessage')}
                confirmText={t('categories.deleteConfirm')}
                isDestructive
            />

            <Modal
                isOpen={deleteCombinationModal.isOpen}
                onClose={() => setDeleteCombinationModal({ isOpen: false, combinationId: null })}
                onConfirm={confirmDeleteCombination}
                title={t('combinations.deleteTitle', 'Radera mall')}
                message={t('combinations.deleteMessage', 'Är du säker på att du vill radera denna mall? Listorna kommer inte att raderas.')}
                confirmText={t('common.delete', 'Radera')}
                isDestructive
            />

            <Modal
                isOpen={deleteListModal.isOpen}
                onClose={() => setDeleteListModal({ isOpen: false, listId: null })}
                onConfirm={confirmDeleteList}
                title={t('lists.deleteTitle')}
                message={t('lists.deleteMessage')}
                confirmText={t('lists.deleteConfirm')}
                isDestructive
            />

            <ManageCategoriesModal
                isOpen={manageCategoriesOpen}
                onClose={() => setManageCategoriesOpen(false)}
                categories={sortedCategories}
                onReorder={reorderCategories}
                onAdd={async (name) => { await addCategory(name); }}
                onDelete={deleteCategory}
            />

            <SessionPicker
                isOpen={sessionPickerOpen}
                onClose={() => setSessionPickerOpen(false)}
                onCreateSession={handleCreateSession}
                lists={lists}
                categories={categories}
                onSaveCombination={async (name, listIds) => { await addCombination(name, listIds); }}
            />

            <CombinationEditor
                isOpen={editorState.isOpen}
                onClose={() => setEditorState({ isOpen: false })}
                onSave={handleSaveCombination}
                lists={lists}
                categories={categories}
                combination={editorState.combination}
            />

            <ImportListModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleImportList}
                categories={sortedCategories}
            />

            <AIListGeneratorModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onSave={handleImportList}
                categories={sortedCategories}
                onAddCategory={addCategory}
            />
        </div>
    );
});

CategoryView.displayName = 'CategoryView';


