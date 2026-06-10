import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../types';
import { Trash2, GripVertical, Circle, CheckCircle2, PlayCircle } from 'lucide-react';
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
    onToggle?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, text: string) => void;
    disabled?: boolean;
    threeStageMode?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({ item, onToggle, onDelete, onEdit, disabled, threeStageMode }) => {
    const [localText, setLocalText] = React.useState(item.text);

    React.useEffect(() => {
        setLocalText(item.text);
    }, [item.text]);

    const handleBlur = () => {
        if (onEdit && localText !== item.text) {
            onEdit(item.id, localText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

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
                onClick={() => onDelete && onDelete(item.id)}
            >
                <div className="flex items-center justify-end px-4 bg-red-500 text-white h-full rounded-r-lg">
                    <Trash2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    const isReadOnly = !onToggle && !onEdit;
    const isInteractionDisabled = isReadOnly;

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
                    <div className="w-full flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggle) onToggle(item.id);
                            }}
                            className={`flex-shrink-0 mt-0.5 transition-colors ${isInteractionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            {/* Render different icons based on state */}
                            {(() => {
                                if (threeStageMode && item.state === 'ongoing') {
                                    return (
                                        <div className="text-yellow-500 hover:text-yellow-600">
                                            <PlayCircle size={24} />
                                        </div>
                                    );
                                }
                                if (item.completed) {
                                    return (
                                        <div className="text-blue-500 hover:text-blue-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    );
                                }
                                return (
                                    <div className="text-gray-300 hover:text-gray-400">
                                        <Circle size={24} />
                                    </div>
                                );
                            })()}
                        </button>

                        <textarea
                            value={localText}
                            onChange={(e) => {
                                setLocalText(e.target.value);
                                // Auto-grow
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            disabled={isReadOnly}
                            rows={1}
                            aria-label="Edit item text"
                            className={`flex-1 min-w-0 bg-transparent outline-none p-1 resize-none overflow-hidden leading-snug ${(() => {
                                if (item.completed) return 'line-through text-gray-400';
                                if (threeStageMode && item.state === 'ongoing') return 'text-gray-800 dark:text-gray-100';
                                return 'text-gray-700 dark:text-gray-200';
                            })()} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                            style={{ height: 'auto' }}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            // Stop propagation to prevent swipe start when interacting with textarea
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        />

                        {!disabled && (
                            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 touch-none mt-0.5 flex-shrink-0" aria-label="Drag to reorder item">
                                <GripVertical size={24} strokeWidth={2.5} />
                            </div>
                        )}

                        {onDelete && (
                            <button
                                onClick={() => onDelete(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 flex-shrink-0 mt-0.5"
                                aria-label="Delete item"
                                // Stop propagation to prevent swipe start when clicking button
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </SwipeableListItem>
            </SwipeableList>
        </div>
    );
};
