import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Plus, ChevronLeft, RotateCcw, Mic, MicOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from './Modal';

import { useVoiceInput } from '../hooks/useVoiceInput';
import { useTranslation } from 'react-i18next';

export const ListDetail: React.FC = () => {
    const { t } = useTranslation();
    const { listId } = useParams<{ listId: string }>();
    const { lists, updateListItems, deleteItem, updateListName } = useApp();
    const [newItemText, setNewItemText] = useState('');
    const [uncheckModalOpen, setUncheckModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useVoiceInput();

    // Update input text when transcript changes
    React.useEffect(() => {
        if (transcript) {
            setNewItemText(() => {
                // If we are appending, we might want a space, but for now let's just replace or append intelligently
                // Simple approach: if input is empty, set to transcript. If not, append.
                // Actually, for a simple "add item" flow, usually you speak the whole item.
                // But let's make it so it updates the current text.
                return transcript;
            });
        }
    }, [transcript]);

    const list = lists.find((l) => l.id === listId);

    React.useEffect(() => {
        if (list) {
            document.title = `Anti - ${list.name}`;
            setEditedTitle(list.name);
        }
    }, [list]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [sortBy, setSortBy] = useState<'manual' | 'alphabetical' | 'completed'>('manual');

    const sortedItems = React.useMemo(() => {
        if (!list) return [];
        let items = [...list.items];
        if (sortBy === 'alphabetical') {
            items.sort((a, b) => a.text.localeCompare(b.text));
        } else if (sortBy === 'completed') {
            items.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
        }
        return items;
    }, [list, sortBy]);

    if (!list) return <div className="text-center py-10">{t('lists.notFound')}</div>;

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            const newItem = { id: uuidv4(), text: newItemText.trim(), completed: false };
            updateListItems(list.id, [...list.items, newItem]);
            setNewItemText('');
            resetTranscript();
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = list.items.findIndex((item) => item.id === active.id);
            const newIndex = list.items.findIndex((item) => item.id === over?.id);
            updateListItems(list.id, arrayMove(list.items, oldIndex, newIndex));
        }
    };

    const handleToggle = (itemId: string) => {
        const newItems = list.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        updateListItems(list.id, newItems);
    };

    const handleDelete = (itemId: string) => {
        deleteItem(list.id, itemId);
    };

    const handleEdit = (itemId: string, text: string) => {
        const newItems = list.items.map(item =>
            item.id === itemId ? { ...item, text } : item
        );
        updateListItems(list.id, newItems);
    };

    const confirmUncheckAll = () => {
        const newItems = list.items.map(item => ({ ...item, completed: false }));
        updateListItems(list.id, newItems);
        setUncheckModalOpen(false);
    };

    const handleSaveTitle = () => {
        if (editedTitle.trim()) {
            updateListName(list.id, editedTitle.trim());
            setIsEditingTitle(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ... (header code) ... */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Link to={`/category/${list.categoryId}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
                        <ChevronLeft />
                    </Link>
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="text-xl font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full min-w-0"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') {
                                        setEditedTitle(list.name);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                onBlur={handleSaveTitle}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group min-w-0 flex-1">
                            <h2 className="text-xl font-semibold truncate">{list.name}</h2>
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all flex-shrink-0"
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
                <div className="flex items-center gap-2 w-full">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-[70%] px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors outline-none cursor-pointer"
                    >
                        <option value="manual">{t('lists.sort.manual')}</option>
                        <option value="alphabetical">{t('lists.sort.alphabetical')}</option>
                        <option value="completed">{t('lists.sort.completed')}</option>
                    </select>
                    <button
                        onClick={() => setUncheckModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw size={16} />
                        {t('lists.reset')}
                    </button>
                </div>
            </div>

            <form onSubmit={handleAddItem} className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder={t('lists.addItemPlaceholder')}
                        className="w-full p-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    {hasSupport && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                >
                    <Plus />
                </button>
            </form>

            {sortBy === 'manual' ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {sortedItems.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                            {sortedItems.length === 0 && (
                                <p className="text-center text-gray-500 mt-8">{t('lists.emptyList')}</p>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="space-y-2">
                    {sortedItems.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            disabled={true} // We need to update SortableItem to accept a disabled prop or just hide the drag handle
                        />
                    ))}
                    {sortedItems.length === 0 && (
                        <p className="text-center text-gray-500 mt-8">{t('lists.emptyList')}</p>
                    )}
                </div>
            )}

            <Modal
                isOpen={uncheckModalOpen}
                onClose={() => setUncheckModalOpen(false)}
                onConfirm={confirmUncheckAll}
                title={t('lists.resetTitle')}
                message={t('lists.resetMessage')}
                confirmText={t('lists.reset')}
            />
        </div>
    );
};
