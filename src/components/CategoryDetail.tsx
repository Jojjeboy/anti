import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Copy, ArrowRight, ChevronLeft } from 'lucide-react';
import { Modal } from './Modal';

export const CategoryDetail: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const { categories, lists, addList, deleteList, copyList, moveList } = useApp();
    const [newListName, setNewListName] = useState('');
    const [movingListId, setMovingListId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; listId: string | null }>({
        isOpen: false,
        listId: null,
    });

    const category = categories.find((c) => c.id === categoryId);
    const categoryLists = lists.filter((l) => l.categoryId === categoryId);

    React.useEffect(() => {
        if (category) {
            document.title = `Anti - ${category.name}`;
        }
    }, [category]);

    if (!category) {
        return (
            <div className="text-center py-10">
                <p>Category not found.</p>
                <Link to="/" className="text-blue-500 hover:underline">Go back</Link>
            </div>
        );
    }

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            addList(newListName.trim(), categoryId!);
            setNewListName('');
        }
    };

    const confirmDelete = () => {
        if (deleteModal.listId) {
            deleteList(deleteModal.listId);
            setDeleteModal({ isOpen: false, listId: null });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <ChevronLeft />
                </Link>
                <h2 className="text-xl font-semibold">{category.name}</h2>
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New List..."
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
                {categoryLists.map((list) => (
                    <div
                        key={list.id}
                        className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center justify-between p-4">
                            <Link
                                to={`/list/${list.id}`}
                                className="flex-1 text-lg font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {list.name}
                                <span className="text-sm text-gray-400 ml-2">({list.items.length} items)</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => copyList(list.id)}
                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                    title="Copy List"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={() => setMovingListId(movingListId === list.id ? null : list.id)}
                                    className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                                    title="Move List"
                                >
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: true, listId: list.id })}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete List"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {movingListId === list.id && (
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <p className="text-sm text-gray-500 mb-2">Move to category:</p>
                                <div className="flex flex-wrap gap-2">
                                    {categories.filter(c => c.id !== categoryId).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                moveList(list.id, c.id);
                                                setMovingListId(null);
                                            }}
                                            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:border-blue-500 hover:text-blue-500 transition-colors"
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                    {categories.length <= 1 && <span className="text-sm text-gray-400">No other categories</span>}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {categoryLists.length === 0 && (
                    <p className="text-center text-gray-500 mt-8">No lists in this category.</p>
                )}
            </div>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, listId: null })}
                onConfirm={confirmDelete}
                title="Delete List"
                message="Are you sure you want to delete this list? This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
};
