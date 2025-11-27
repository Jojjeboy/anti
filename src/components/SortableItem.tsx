import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../types';
import { Trash2, GripVertical } from 'lucide-react';
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    Type as ListType,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

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
        isDragging,
    } = useSortable({ id: item.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                destructive={true}
                onClick={() => onDelete(item.id)}
            >
                <div className="flex items-center justify-end px-4 bg-red-500 text-white h-full rounded-r-lg">
                    <Trash2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${isDragging ? 'z-50' : ''}`}
        >
            <SwipeableList threshold={0.25} type={ListType.IOS}>
                <SwipeableListItem
                    trailingActions={trailingActions()}
                >
                    <div className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                        {!disabled && (
                            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 -ml-2 -my-1 touch-none">
                                <GripVertical size={28} strokeWidth={2.5} />
                            </div>
                        )}

                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggle(item.id)}
                            className={`w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${isDragging ? 'pointer-events-none' : ''}`}
                            // Stop propagation to prevent swipe start when clicking checkbox
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        />

                        <input
                            type="text"
                            value={item.text}
                            onChange={(e) => onEdit(item.id, e.target.value)}
                            className={`flex-1 bg-transparent outline-none p-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'} ${isDragging ? 'pointer-events-none' : ''}`}
                            // Stop propagation to prevent swipe start when interacting with input
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        />

                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            aria-label="Delete item"
                            // Stop propagation to prevent swipe start when clicking button
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </SwipeableListItem>
            </SwipeableList>
        </div>
    );
};
