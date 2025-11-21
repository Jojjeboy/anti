import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Folder } from 'lucide-react';
import { Modal } from './Modal';

export const CategoryView: React.FC = () => {
    const { categories, addCategory, deleteCategory } = useApp();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string | null }>({
        isOpen: false,
        categoryId: null,
    });

    useEffect(() => {
        document.title = 'Anti';
    }, []);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    const confirmDelete = () => {
        if (deleteModal.categoryId) {
            deleteCategory(deleteModal.categoryId);
            setDeleteModal({ isOpen: false, categoryId: null });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Categories</h2>
            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category..."
                    className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                >
                    <Plus />
                </button>
            </form>

            <div className="grid gap-3">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                        <Link
                            to={`/category/${category.id}`}
                            className="flex items-center gap-3 flex-1 text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                        >
                            <Folder className="text-blue-500" />
                            {category.name}
                        </Link>
                        <button
                            onClick={() => setDeleteModal({ isOpen: true, categoryId: category.id })}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Delete category"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                {categories.length === 0 && (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <Folder size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500">No categories yet.</p>
                        <p className="text-sm text-gray-400">Add one to get started!</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, categoryId: null })}
                onConfirm={confirmDelete}
                title="Delete Category"
                message="Are you sure? All lists in this category will be deleted. This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
};
