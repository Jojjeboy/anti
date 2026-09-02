import { render, screen, fireEvent } from '@testing-library/react';
import { SortableItem } from './SortableItem';
import { describe, it, expect, vi } from 'vitest';
import { Item } from '../types';

// Mock dnd-kit sortable
vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

// Mock react-swipeable-list
vi.mock('react-swipeable-list', () => ({
    SwipeableList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SwipeableListItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SwipeAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <div onClick={onClick}>{children}</div>
    ),
    TrailingActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Type: { IOS: 'ios' },
}));

describe('SortableItem', () => {
    const mockItem: Item = {
        id: 'item-1',
        text: 'Köp kaffe',
        completed: false,
        state: 'unresolved',
    };

    it('renders the item text', () => {
        render(<SortableItem item={mockItem} />);
        expect(screen.getByDisplayValue('Köp kaffe')).toBeDefined();
    });

    it('triggers onToggle when toggle button is clicked', () => {
        const onToggle = vi.fn();
        render(<SortableItem item={mockItem} onToggle={onToggle} />);

        const toggleBtn = screen.getByRole('button', { name: /mark as complete/i });
        fireEvent.click(toggleBtn);

        expect(onToggle).toHaveBeenCalledWith('item-1');
    });

    it('triggers onEdit on textarea blur if text was changed', () => {
        const onEdit = vi.fn();
        render(<SortableItem item={mockItem} onEdit={onEdit} />);

        const textarea = screen.getByDisplayValue('Köp kaffe');
        fireEvent.change(textarea, { target: { value: 'Köp te istället' } });
        fireEvent.blur(textarea);

        expect(onEdit).toHaveBeenCalledWith('item-1', 'Köp te istället');
    });

    it('renders ongoing state icon correctly in threeStageMode', () => {
        const ongoingItem: Item = {
            id: 'item-2',
            text: 'Förbered frukost',
            completed: false,
            state: 'ongoing',
        };
        render(<SortableItem item={ongoingItem} threeStageMode={true} />);
        expect(screen.getByDisplayValue('Förbered frukost')).toBeDefined();
    });

    it('disables interactions when readOnly', () => {
        render(<SortableItem item={mockItem} disabled={true} />);
        const textarea = screen.getByDisplayValue('Köp kaffe');
        expect(textarea).toHaveProperty('disabled', true);
    });
});
