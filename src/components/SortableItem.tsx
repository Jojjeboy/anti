import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../types';
import { Trash2, GripVertical } from 'lucide-react';

interface SortableItemProps {
    item: Item;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
    disabled?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({ item, onToggle, onDelete, onEdit, disabled }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
            {!disabled && (
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 -ml-1">
                    <GripVertical size={24} />
                </div>
            )}

            <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />

            <input
                type="text"
                value={item.text}
                onChange={(e) => onEdit(item.id, e.target.value)}
                className={`flex-1 bg-transparent outline-none p-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
            />

            <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
