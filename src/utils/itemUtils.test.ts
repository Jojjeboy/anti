import { describe, it, expect } from 'vitest';
import { cycleItemState, sortAndFilterItems, groupItemsBySection } from './itemUtils';
import { Item } from '../types';

describe('itemUtils', () => {
    describe('cycleItemState', () => {
        it('toggles normally between completed and unresolved when threeStageMode is false', () => {
            const item: Item = { id: '1', text: 'Task 1', completed: false, state: 'unresolved' };
            const toggled1 = cycleItemState(item, false);
            expect(toggled1.completed).toBe(true);
            expect(toggled1.state).toBe('completed');

            const toggled2 = cycleItemState(toggled1, false);
            expect(toggled2.completed).toBe(false);
            expect(toggled2.state).toBe('unresolved');
        });

        it('cycles unresolved -> ongoing -> completed -> unresolved when threeStageMode is true', () => {
            const item: Item = { id: '1', text: 'Task 1', completed: false, state: 'unresolved' };
            
            // 1. unresolved -> ongoing
            const stage1 = cycleItemState(item, true);
            expect(stage1.completed).toBe(false);
            expect(stage1.state).toBe('ongoing');

            // 2. ongoing -> completed
            const stage2 = cycleItemState(stage1, true);
            expect(stage2.completed).toBe(true);
            expect(stage2.state).toBe('completed');

            // 3. completed -> unresolved
            const stage3 = cycleItemState(stage2, true);
            expect(stage3.completed).toBe(false);
            expect(stage3.state).toBe('unresolved');
        });
    });

    describe('sortAndFilterItems', () => {
        const items: Item[] = [
            { id: '1', text: 'Banana', completed: true },
            { id: '2', text: 'Apple', completed: false, state: 'ongoing' },
            { id: '3', text: 'Cherry', completed: false, state: 'unresolved' },
        ];

        it('returns items in manual order when sortBy is manual', () => {
            const result = sortAndFilterItems(items, 'manual', false);
            expect(result.activeItems.map(i => i.text)).toEqual(['Banana', 'Apple', 'Cherry']);
            expect(result.completedItems).toEqual([]);
        });

        it('sorts alphabetically when sortBy is alphabetical', () => {
            const result = sortAndFilterItems(items, 'alphabetical', false);
            expect(result.activeItems.map(i => i.text)).toEqual(['Apple', 'Banana', 'Cherry']);
        });

        it('sorts by state/completion when sortBy is completed with threeStageMode', () => {
            const result = sortAndFilterItems(items, 'completed', true);
            // Expected order: Ongoing ('Apple') -> Unresolved ('Cherry') -> Completed ('Banana')
            expect(result.activeItems.map(i => i.text)).toEqual(['Apple', 'Cherry', 'Banana']);
        });

        it('separates completed items when hideCompleted is true', () => {
            const result = sortAndFilterItems(items, 'manual', false, true);
            expect(result.activeItems.map(i => i.text)).toEqual(['Apple', 'Cherry']);
            expect(result.completedItems.map(i => i.text)).toEqual(['Banana']);
        });
    });

    describe('groupItemsBySection', () => {
        it('groups items into unsectioned and section buckets', () => {
            const items: Item[] = [
                { id: '1', text: 'Item 1', completed: false, sectionId: undefined },
                { id: '2', text: 'Item 2', completed: false, sectionId: 'sec-1' },
                { id: '3', text: 'Item 3', completed: false, sectionId: 'sec-2' },
                { id: '4', text: 'Item 4', completed: false, sectionId: 'sec-1' },
            ];

            const sections = [
                { id: 'sec-2', name: 'Section 2', order: 1 },
                { id: 'sec-1', name: 'Section 1', order: 0 },
            ];

            const grouped = groupItemsBySection(items, sections);

            expect(grouped.get(undefined)?.map(i => i.id)).toEqual(['1']);
            expect(grouped.get('sec-1')?.map(i => i.id)).toEqual(['2', '4']);
            expect(grouped.get('sec-2')?.map(i => i.id)).toEqual(['3']);
        });
    });
});
