import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Copy, ArrowRight, ChevronLeft, Pin, LayoutTemplate } from 'lucide-react';
import { Modal } from './Modal';
import { templates } from '../data/templates';

export const CategoryDetail: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const { categories, lists, addList, deleteList, copyList, moveList, togglePin, addListFromTemplate, updateCategoryName } = useApp();
    const [newListName, setNewListName] = useState('');
    const [movingListId, setMovingListId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; listId: string | null }>({
        isOpen: false,
        listId: null,
    });
    const [showTemplates, setShowTemplates] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const category = categories.find((c) => c.id === categoryId);
    const categoryLists = lists
        .filter((l) => l.categoryId === categoryId)
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    React.useEffect(() => {
        if (category) {
            document.title = `Anti - ${category.name}`;
            setEditedTitle(category.name);
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

    const handleSaveTitle = () => {
        if (editedTitle.trim()) {
            updateCategoryName(category.id, editedTitle.trim());
            setIsEditingTitle(false);
        }
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
                            title="Edit Title"
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
                <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
                    title="Use Template"
                >
                    <LayoutTemplate size={24} />
                </button>
            </div>

            {showTemplates && (
                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    {templates.map(template => (
                        <button
                            key={template.id}
                            onClick={() => {
                                addListFromTemplate(template.id, categoryId!);
                                setShowTemplates(false);
                            }}
                            className="p-3 text-left bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        >
                            <span className="font-medium block">{template.name}</span>
                            <span className="text-xs text-gray-400">{template.items.length} items</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="grid gap-3">
                {categoryLists.map((list) => (
                    <div
                        key={list.id}
                        className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                        <div className="flex items-center justify-between p-4 gap-2">
                            <Link
                                to={`/list/${list.id}`}
                                className="flex-1 text-lg font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0 truncate"
                            >
                                {list.name}
                                <span className="text-sm text-gray-400 ml-2 whitespace-nowrap">({list.items.length} items)</span>
                            </Link>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => togglePin(list.id)}
                                    className={`p-2 transition-colors ${list.isPinned ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                                    title={list.isPinned ? "Unpin List" : "Pin List"}
                                >
                                    <Pin size={18} fill={list.isPinned ? "currentColor" : "none"} />
                                </button>
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

                        {list.items.length > 0 && (
                            <div className="px-4 pb-4">
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((list.items.filter(i => i.completed).length / list.items.length) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${(list.items.filter(i => i.completed).length / list.items.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

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
