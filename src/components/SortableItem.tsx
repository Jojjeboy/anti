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
        isDragging,
    } = useSortable({ id: item.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Swipe to delete logic
    const [offsetX, setOffsetX] = React.useState(0);
    const [isSwiping, setIsSwiping] = React.useState(false);
    const startX = React.useRef<number | null>(null);
    const currentX = React.useRef<number | null>(null);
    const SWIPE_THRESHOLD = -100; // Pixel distance to trigger delete or full reveal
    const MAX_SWIPE = -150; // Max distance to swipe left

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (disabled || isDragging) return;
        // Don't start swipe if clicking on the checkbox or edit input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        startX.current = clientX;
        currentX.current = clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isSwiping || startX.current === null) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        currentX.current = clientX;
        const diff = currentX.current - startX.current;

        // Only allow swiping left (negative diff)
        if (diff < 0) {
            // Add some resistance
            const newOffset = Math.max(diff, MAX_SWIPE);
            setOffsetX(newOffset);
        }
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;

        if (offsetX < SWIPE_THRESHOLD) {
            // Swiped far enough - trigger delete
            // For now, let's just reset and call delete. 
            // Ideally we might want a confirmation or "swiped state" but user asked for swipe to delete.
            onDelete(item.id);
            setOffsetX(0);
        } else {
            // Snap back
            setOffsetX(0);
        }

        setIsSwiping(false);
        startX.current = null;
        currentX.current = null;
    };

    // Mouse events for desktop testing/usage
    const handleMouseDown = (e: React.MouseEvent) => handleTouchStart(e);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isSwiping) {
            handleTouchMove(e);
        }
    };
    const handleMouseUp = () => handleTouchEnd();
    const handleMouseLeave = () => {
        if (isSwiping) handleTouchEnd();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group touch-pan-y" // touch-pan-y allows vertical scroll but we capture horizontal
        >
            {/* Background layer for swipe action */}
            <div
                className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-6 text-white transition-opacity duration-200"
                style={{ opacity: offsetX < 0 ? 1 : 0 }}
            >
                <Trash2 size={24} />
            </div>

            {/* Foreground content */}
            <div
                className="relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
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
        </div>
    );
};
