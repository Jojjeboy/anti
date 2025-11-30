import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, ChevronLeft, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableListCard } from './SortableListCard';

import { templates } from '../data/templates';

export const CategoryDetail: React.FC = () => {
    const { t } = useTranslation();
    const { categoryId } = useParams<{ categoryId: string }>();
    const { categories, lists, addList, deleteList, copyList, moveList, updateCategoryName, updateListItems, reorderLists } = useApp();
    const [newListName, setNewListName] = useState('');
    const [movingListId, setMovingListId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; listId: string | null }>({
        isOpen: false,
        listId: null,
    });
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const category = categories.find((c) => c.id === categoryId);
    const categoryLists = lists
        .filter((l) => l.categoryId === categoryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    React.useEffect(() => {
        if (category) {
            document.title = `Anti - ${category.name}`;
            setEditedTitle(category.name);
        }
    }, [category]);

    if (!category) {
        return (
            <div className="text-center py-10">
                <p>{t('categories.notFound')}</p>
                <Link to="/" className="text-blue-500 hover:underline">{t('categories.goBack')}</Link>
            </div>
        );
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            await addList(newListName.trim(), categoryId!);
            setNewListName('');
        }
    };

    const confirmDelete = async () => {
        if (deleteModal.listId) {
            await deleteList(deleteModal.listId);
            setDeleteModal({ isOpen: false, listId: null });
        }
    };

    const handleSaveTitle = async () => {
        if (editedTitle.trim()) {
            await updateCategoryName(category.id, editedTitle.trim());
            setIsEditingTitle(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = categoryLists.findIndex((list) => list.id === active.id);
            const newIndex = categoryLists.findIndex((list) => list.id === over?.id);
            const reorderedLists = arrayMove(categoryLists, oldIndex, newIndex);
            await reorderLists(reorderedLists);
        }
    };

    const handleMoveToCategory = async (listId: string, newCategoryId: string) => {
        await moveList(listId, newCategoryId);
        setMovingListId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <ChevronLeft />
                </Link>
                {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-xl font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') {
                                    setEditedTitle(category.name);
                                    setIsEditingTitle(false);
                                }
                            }}
                            onBlur={handleSaveTitle}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h2 className="text-xl font-semibold">{category.name}</h2>
                        <button
                            onClick={() => setIsEditingTitle(true)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all"
                            title={t('lists.editTitle')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <form onSubmit={handleAdd} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder={t('lists.newPlaceholder')}
                        className="max-w-[200px] flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                    >
                        <Plus />
                    </button>
                </form>
                <div className="relative group">
                    <button
                        className="p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title={t('templates.create')}
                    >
                        <LayoutTemplate size={24} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2">
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
                                {t('templates.title')}
                            </div>
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={async () => {
                                        const newListId = await addList(t(template.nameKey), categoryId!);
                                        const newItems = template.items.map(itemKey => ({
                                            id: crypto.randomUUID(),
                                            text: t(itemKey),
                                            completed: false
                                        }));
                                        await updateListItems(newListId, newItems);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                    {t(template.nameKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categoryLists.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                        {categoryLists.map((list) => (
                            <SortableListCard
                                key={list.id}
                                list={list}
                                onCopy={copyList}
                                onMove={(listId) => setMovingListId(movingListId === listId ? null : listId)}
                                onDelete={(listId) => setDeleteModal({ isOpen: true, listId })}
                                isMoving={movingListId === list.id}
                                categories={categories}
                                currentCategoryId={categoryId!}
                                onMoveToCategory={handleMoveToCategory}
                            />
                        ))}
                        {categoryLists.length === 0 && (
                            <p className="text-center text-gray-500 mt-8">{t('lists.empty')}</p>
                        )}
                    </div>
                </SortableContext>
            </DndContext>


            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, listId: null })}
                onConfirm={confirmDelete}
                title={t('lists.deleteTitle')}
                message={t('lists.deleteMessage')}
                confirmText={t('lists.deleteConfirm')}
                isDestructive
            />
        </div>
    );
};
