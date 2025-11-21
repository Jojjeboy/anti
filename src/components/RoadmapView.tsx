import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Modal } from './Modal';

export const RoadmapView: React.FC = () => {
    const { notes, addNote, updateNote, deleteNote } = useApp();
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedNoteId(expandedNoteId === id ? null : id);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim() && newContent.trim()) {
            addNote(newTitle.trim(), newContent.trim());
            setNewTitle('');
            setNewContent('');
            setIsAdding(false);
        }
    };

    const startEditing = (note: { id: string; title: string; content: string }) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const handleUpdate = (id: string) => {
        if (editTitle.trim() && editContent.trim()) {
            updateNote(id, editTitle.trim(), editContent.trim());
            setEditingNoteId(null);
        }
    };

    const confirmDelete = (id: string) => {
        setNoteToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (noteToDelete) {
            deleteNote(noteToDelete);
            setDeleteModalOpen(false);
            setNoteToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Roadmap & Notes</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add Note'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        autoFocus
                    />
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Content..."
                        rows={4}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newTitle.trim() || !newContent.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {notes.length === 0 && !isAdding && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">No notes yet. Add one to get started!</p>
                )}

                {notes.map((note) => (
                    <div key={note.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
                        {editingNoteId === note.id ? (
                            <div className="p-6 space-y-4">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingNoteId(null)}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(note.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Save size={18} /> Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div
                                    onClick={() => toggleExpand(note.id)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                >
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{note.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                        {expandedNoteId === note.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                    </div>
                                </div>

                                {expandedNoteId === note.id && (
                                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">
                                            {note.content}
                                        </p>
                                        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditing(note); }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} /> Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(note.id); }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Note"
                message="Are you sure you want to delete this note? This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
};
