import React, { useState } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { Category, List } from '../types';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableListCard } from './SortableListCard';

interface CategorySectionProps {
    category: Category;
    lists: List[];
    categories: Category[];
    onDelete: (categoryId: string) => void;
    onUpdateName: (categoryId: string, name: string) => Promise<void>;
    onAddList: (name: string, categoryId: string) => Promise<void>;
    onCopyList: (listId: string) => Promise<void>;
    onMoveList: (listId: string, newCategoryId: string) => Promise<void>;
    onDeleteList: (listId: string) => void;
    onArchiveList?: (listId: string) => void;
    onClearCompleted: (listId: string) => void;
    onReorderLists: (lists: List[]) => Promise<void>;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    lists,
    categories,
    onDelete,
    onUpdateName,
    onAddList,
    onCopyList,
    onMoveList,
    onDeleteList,
    onArchiveList,
    onClearCompleted,
    onReorderLists,
}) => {
    const { t } = useTranslation();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(category.name);
    const [newListName, setNewListName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [movingListId, setMovingListId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const categoryLists = lists
        .filter((l) => l.categoryId === category.id && !l.archived)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const isDuplicateName = React.useMemo(() => {
        const trimmed = (newListName || '').trim().toLowerCase();
        if (!trimmed) return false;
        return (lists || []).some((l) => (l?.name || '').trim().toLowerCase() === trimmed);
    }, [newListName, lists]);

    const isDuplicateCategoryName = React.useMemo(() => {
        const trimmed = (editedTitle || '').trim().toLowerCase();
        if (!trimmed) return false;
        return (categories || []).some(
            (c) => c.id !== category.id && (c?.name || '').trim().toLowerCase() === trimmed
        );
    }, [editedTitle, categories, category.id]);

    const handleSaveTitle = async () => {
        const trimmed = editedTitle.trim();
        if (trimmed && !isDuplicateCategoryName && trimmed !== category.name) {
            await onUpdateName(category.id, trimmed);
        } else {
            setEditedTitle(category.name);
        }
        setIsEditingTitle(false);
    };

    const handleAddList = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newListName.trim();
        if (trimmed && !isDuplicateName) {
            await onAddList(trimmed, category.id);
            setNewListName('');
            setIsAddingList(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = categoryLists.findIndex((list) => list.id === active.id);
            const newIndex = categoryLists.findIndex((list) => list.id === over?.id);
            const reorderedLists = arrayMove(categoryLists, oldIndex, newIndex);
            await onReorderLists(reorderedLists);
        }
    };

    const handleMoveToCategory = async (listId: string, newCategoryId: string) => {
        await onMoveList(listId, newCategoryId);
        setMovingListId(null);
    };


    return (
        <div
            className={`space-y-3 w-full min-w-0`}
        >
            {/* Category Header */}
            <div className="flex items-center gap-2 group mb-3">
                {isEditingTitle ? (
                    <div className="flex-1 space-y-1 min-w-0">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className={`text-xl font-bold bg-transparent border-b-2 ${isDuplicateCategoryName ? 'border-red-500 focus:border-red-500' : 'border-blue-500'} focus:outline-none w-full`}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isDuplicateCategoryName) handleSaveTitle();
                                if (e.key === 'Escape') {
                                    setEditedTitle(category.name);
                                    setIsEditingTitle(false);
                                }
                            }}
                            onBlur={handleSaveTitle}
                        />
                        {isDuplicateCategoryName && (
                            <p className="text-xs text-red-500 dark:text-red-400 font-medium animate-in fade-in duration-200">
                                {t('categories.duplicateNameError', 'En kategori med detta namn finns redan')}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <h3
                            className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer flex-1 outline-none focus:text-blue-600 dark:focus:text-blue-400 truncate min-w-0"
                            onClick={() => setIsEditingTitle(true)}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    setIsEditingTitle(true);
                                }
                            }}
                        >
                            {category.name}
                        </h3>
                        <button
                            onClick={() => setIsEditingTitle(true)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title={t('categories.editTitle', 'Redigera kategori')}
                            aria-label={t('categories.editTitle', 'Redigera kategori')}
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => onDelete(category.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={t('categories.deleteTitle')}
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={() => setIsAddingList(!isAddingList)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
                        >
                            {t('lists.addLink', '+ Lägg till lista')}
                        </button>
                    </>
                )}
            </div>

            {/* Add List Form */}
            {isAddingList && (
                <form onSubmit={handleAddList} className="space-y-1 mb-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder={t('lists.newPlaceholder')}
                            autoFocus
                            className={`flex-1 p-3 rounded-xl border ${isDuplicateName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'} bg-white dark:bg-gray-800 shadow-sm focus:ring-2 outline-none transition-all`}
                        />
                        <button
                            type="submit"
                            disabled={!newListName.trim() || isDuplicateName}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Plus />
                        </button>
                    </div>
                    {isDuplicateName && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1 animate-in fade-in duration-200">
                            {t('lists.duplicateNameError', 'En lista med detta namn finns redan')}
                        </p>
                    )}
                </form>
            )}


            {/* Lists */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categoryLists.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 w-full min-w-0">
                        {categoryLists.map((list) => (
                            <SortableListCard
                                key={list.id}
                                list={list}
                                onCopy={onCopyList}
                                onMove={(listId) => setMovingListId(movingListId === listId ? null : listId)}
                                onDelete={onDeleteList}
                                onArchive={onArchiveList}
                                onClearCompleted={onClearCompleted}
                                isMoving={movingListId === list.id}
                                categories={categories}
                                currentCategoryId={category.id}
                                onMoveToCategory={handleMoveToCategory}
                                showHandle={categoryLists.length > 1}
                            />
                        ))}
                        {categoryLists.length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-4">{t('lists.empty')}</p>
                        )}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};
