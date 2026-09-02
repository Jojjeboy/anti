import { Item } from '../types';

export type SortMode = 'manual' | 'alphabetical' | 'completed';

/**
 * Cycles an item through its possible completion states.
 * - In normal mode: unresolved <-> completed
 * - In three-stage mode: unresolved -> ongoing -> completed -> unresolved
 */
export function cycleItemState(item: Item, threeStageMode: boolean): Item {
    let newState: 'unresolved' | 'ongoing' | 'completed';
    let newCompleted: boolean;

    if (threeStageMode) {
        if (item.completed) {
            newState = 'unresolved';
            newCompleted = false;
        } else if (item.state === 'ongoing') {
            newState = 'completed';
            newCompleted = true;
        } else {
            newState = 'ongoing';
            newCompleted = false;
        }
    } else {
        newCompleted = !item.completed;
        newState = newCompleted ? 'completed' : 'unresolved';
    }

    return {
        ...item,
        completed: newCompleted,
        state: newState,
    };
}

/**
 * Sorts and separates items according to the given sort mode and hideCompleted setting.
 */
export function sortAndFilterItems(
    items: Item[],
    sortBy: SortMode,
    threeStageMode: boolean,
    hideCompleted?: boolean
): { activeItems: Item[]; completedItems: Item[] } {
    const listItems = [...items];

    if (sortBy === 'alphabetical') {
        listItems.sort((a, b) => (a?.text || '').localeCompare(b?.text || ''));
    } else if (sortBy === 'completed') {
        listItems.sort((a, b) => {
            // Sort order: Prepared (ongoing) -> Unchecked -> Completed
            // Weights: Prepared = 0, Unchecked = 1, Completed = 2
            const getWeight = (item: Item) => {
                if (item.completed) return 2;
                if (threeStageMode && item.state === 'ongoing') return 0;
                return 1;
            };
            const weightA = getWeight(a);
            const weightB = getWeight(b);
            if (weightA !== weightB) return weightA - weightB;
            return (a?.text || '').localeCompare(b?.text || '');
        });
    }

    if (hideCompleted) {
        return {
            activeItems: listItems.filter((item) => !item.completed),
            completedItems: listItems.filter((item) => item.completed),
        };
    }

    return {
        activeItems: listItems,
        completedItems: [],
    };
}

/**
 * Groups items by their section ID.
 */
export function groupItemsBySection(
    items: Item[],
    sections?: { id: string; name: string; order?: number }[]
): Map<string | undefined, Item[]> {
    const grouped = new Map<string | undefined, Item[]>();

    // Add unsectioned items
    grouped.set(undefined, items.filter((item) => !item.sectionId));

    // Add items for each section in sorted order
    const sortedSections = [...(sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedSections.forEach((section) => {
        grouped.set(section.id, items.filter((item) => item.sectionId === section.id));
    });

    return grouped;
}
