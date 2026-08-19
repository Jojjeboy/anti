import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, GripVertical, Edit2, Check } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from './Modal';
import { Category } from '../types';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onReorder: (categories: Category[]) => Promise<void>;
    onAdd: (name: string) => Promise<void>;
    onUpdateName?: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

// Internal sortable item component
const SortableCategoryItem = ({
    category,
    allCategories,
    onDelete,
    onUpdateName,
}: {
    category: Category;
    allCategories: Category[];
    onDelete: (id: string, name: string) => void;
    onUpdateName?: (id: string, name: string) => Promise<void>;
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(category.name);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id, disabled: isEditing });

    const isDuplicateEditName = React.useMemo(() => {
        const trimmed = (editedName || '').trim().toLowerCase();
        if (!trimmed) return false;
        return (allCategories || []).some(
            (c) => c.id !== category.id && (c?.name || '').trim().toLowerCase() === trimmed
        );
    }, [editedName, allCategories, category.id]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleSave = async () => {
        const trimmed = editedName.trim();
        if (trimmed && !isDuplicateEditName && trimmed !== category.name && onUpdateName) {
            await onUpdateName(category.id, trimmed);
        } else if (isDuplicateEditName) {
            return;
        } else {
            setEditedName(category.name);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedName(category.name);
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 ${isDragging ? 'z-50 opacity-50' : ''}`}
        >
            {isEditing ? (
                <div className="flex flex-col flex-1 min-w-0 mr-2 space-y-1">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            autoFocus
                            className={`flex-1 p-1.5 text-sm bg-gray-50 dark:bg-gray-700 border ${isDuplicateEditName ? 'border-red-500 focus:ring-red-500' : 'border-blue-500'} rounded-lg focus:outline-none text-gray-900 dark:text-gray-100`}
                        />
                        <button
                            onClick={handleSave}
                            disabled={!editedName.trim() || isDuplicateEditName}
                            className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Spara"
                            aria-label="Save category name"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Avbryt"
                            aria-label="Cancel editing"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {isDuplicateEditName && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1 animate-in fade-in duration-200">
                            {t('categories.duplicateNameError', 'En kategori med detta namn finns redan')}
                        </p>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none flex-shrink-0"
                        >
                            <GripVertical size={20} />
                        </div>
                        <span
                            className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title={category.name}
                            onClick={() => setIsEditing(true)}
                        >
                            {category.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Redigera kategori"
                            aria-label="Edit category name"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(category.id, category.name)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete category"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
    isOpen,
    onClose,
    categories,
    onReorder,
    onAdd,
    onUpdateName,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null; name: string }>({
        isOpen: false,
        id: null,
        name: '',
    });

    const isDuplicateCategory = React.useMemo(() => {
        const trimmed = (newCategoryName || '').trim().toLowerCase();
        if (!trimmed) return false;
        return (categories || []).some((c) => (c?.name || '').trim().toLowerCase() === trimmed);
    }, [newCategoryName, categories]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = categories.findIndex((c) => c.id === active.id);
            const newIndex = categories.findIndex((c) => c.id === over?.id);
            const reordered = arrayMove(categories, oldIndex, newIndex);
            await onReorder(reordered);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (trimmed && !isDuplicateCategory) {
            await onAdd(trimmed);
            setNewCategoryName('');
        }
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteConfirmation({ isOpen: true, id, name });
    };

    const confirmDelete = async () => {
        if (deleteConfirmation.id) {
            await onDelete(deleteConfirmation.id);
            setDeleteConfirmation({ isOpen: false, id: null, name: '' });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {t('categories.manage', 'Hantera kategorier')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content - Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                                    {categories.map((category) => (
                                        <SortableCategoryItem
                                            key={category.id}
                                            category={category}
                                            allCategories={categories}
                                            onDelete={handleDeleteClick}
                                            onUpdateName={onUpdateName}
                                        />
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="p-4 text-center text-gray-500 text-sm">
                                            {t('categories.empty', 'Inga kategorier')}
                                        </p>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Footer - Add Category */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-1">
                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('categories.newPlaceholder', 'Ny kategori')}
                                className={`flex-1 p-2.5 rounded-lg border ${isDuplicateCategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'} bg-white dark:bg-gray-800 shadow-sm focus:ring-2 outline-none transition-all text-sm`}
                            />
                            <button
                                type="submit"
                                disabled={!newCategoryName.trim() || isDuplicateCategory}
                                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Plus size={20} />
                            </button>
                        </form>
                        {isDuplicateCategory && (
                            <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1 animate-in fade-in duration-200">
                                {t('categories.duplicateNameError', 'En kategori med detta namn finns redan')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Nested Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null, name: '' })}
                onConfirm={confirmDelete}
                title={t('categories.deleteTitle')}
                message={t('categories.deleteMessage', { name: deleteConfirmation.name })}
                confirmText={t('categories.deleteConfirm')}
                isDestructive
            />
        </>
    );
};
