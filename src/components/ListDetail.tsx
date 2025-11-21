import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Plus, ChevronLeft, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from './Modal';

export const ListDetail: React.FC = () => {
    const { listId } = useParams<{ listId: string }>();
    const { lists, updateListItems } = useApp();
    const [newItemText, setNewItemText] = useState('');
    const [uncheckModalOpen, setUncheckModalOpen] = useState(false);

    const list = lists.find((l) => l.id === listId);

    React.useEffect(() => {
        if (list) {
            document.title = `Anti - ${list.name}`;
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

    if (!list) return <div className="text-center py-10">List not found.</div>;

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            const newItem = { id: uuidv4(), text: newItemText.trim(), completed: false };
            updateListItems(list.id, [...list.items, newItem]);
            setNewItemText('');
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
        const newItems = list.items.filter(item => item.id !== itemId);
        updateListItems(list.id, newItems);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to={`/category/${list.categoryId}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ChevronLeft />
                    </Link>
                    <h2 className="text-xl font-semibold">{list.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors outline-none cursor-pointer"
                    >
                        <option value="manual">Manual</option>
                        <option value="alphabetical">A-Z</option>
                        <option value="completed">Unchecked First</option>
                    </select>
                    <button
                        onClick={() => setUncheckModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                </div>
            </div>

            <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add item..."
                    className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
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
                                <p className="text-center text-gray-500 mt-8">List is empty.</p>
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
                        <p className="text-center text-gray-500 mt-8">List is empty.</p>
                    )}
                </div>
            )}

            <Modal
                isOpen={uncheckModalOpen}
                onClose={() => setUncheckModalOpen(false)}
                onConfirm={confirmUncheckAll}
                title="Reset List"
                message="Are you sure you want to uncheck all items?"
                confirmText="Reset"
            />
        </div>
    );
};
