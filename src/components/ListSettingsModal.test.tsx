import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ListSettingsModal } from './ListSettingsModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { List } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: string | { defaultValue?: string; [k: string]: unknown }) => {
            if (typeof options === 'string') return options;
            if (options && typeof options === 'object' && typeof options.defaultValue === 'string') {
                return options.defaultValue;
            }
            return key;
        },
    }),
}));

vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
    return {
        ...actual,
        DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useSensors: () => [],
        useSensor: () => ({}),
    };
});

vi.mock('@dnd-kit/sortable', async () => {
    const actual = await vi.importActual<typeof import('@dnd-kit/sortable')>('@dnd-kit/sortable');
    return {
        ...actual,
        SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useSortable: () => ({
            attributes: {},
            listeners: {},
            setNodeRef: vi.fn(),
            transform: null,
            transition: undefined,
            isDragging: false,
        }),
    };
});

vi.mock('../assets/gemini.svg', () => ({ default: 'gemini.svg' }));

const mockList: List = {
    id: 'list-1',
    name: 'My Test List',
    categoryId: 'cat-1',
    items: [
        { id: 'i-1', text: 'Item 1', completed: false },
        { id: 'i-2', text: 'Item 2', completed: true },
    ],
    settings: {
        threeStageMode: false,
        isResettable: true,
        pinned: false,
        hideCompleted: false,
    },
};

describe('ListSettingsModal', () => {
    const baseProps = {
        list: mockList,
        sortBy: 'manual' as const,
        setSortBy: vi.fn(),
        onUpdateSettings: vi.fn().mockResolvedValue(undefined),
        onAddSection: vi.fn().mockResolvedValue(undefined),
        onUpdateSection: vi.fn().mockResolvedValue(undefined),
        onDeleteSection: vi.fn().mockResolvedValue(undefined),
        onSectionDragEnd: vi.fn().mockResolvedValue(undefined),
        onArchiveList: vi.fn().mockResolvedValue(undefined),
        onDeleteList: vi.fn(),
        onOpenExport: vi.fn(),
        onOpenReset: vi.fn(),
        sensors: [] as ReturnType<typeof import('@dnd-kit/core').useSensors>,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders setting toggles', () => {
        render(<ListSettingsModal {...baseProps} />);
        expect(screen.getByText('lists.settings.threeStage.title')).toBeDefined();
        expect(screen.getByText('Reset Suggestion')).toBeDefined();
        expect(screen.getByText('Fäst lista')).toBeDefined();
        expect(screen.getByText('lists.settings.hideCompleted.title')).toBeDefined();
    });

    it('calls onUpdateSettings when toggling three-stage mode', async () => {
        render(<ListSettingsModal {...baseProps} />);
        const toggleBtn = screen.getByLabelText('lists.settings.threeStage.title');
        await act(async () => { fireEvent.click(toggleBtn); });
        expect(baseProps.onUpdateSettings).toHaveBeenCalledWith({ threeStageMode: true });
    });

    it('calls onDeleteList when delete button clicked', async () => {
        render(<ListSettingsModal {...baseProps} />);
        const deleteBtn = screen.getByRole('button', { name: /lists.deleteTitle/i });
        act(() => { fireEvent.click(deleteBtn); });
        expect(baseProps.onDeleteList).toHaveBeenCalled();
    });

    it('calls onOpenExport when export button clicked', async () => {
        render(<ListSettingsModal {...baseProps} />);
        const exportBtn = screen.getByRole('button', { name: /exportera lista/i });
        act(() => { fireEvent.click(exportBtn); });
        expect(baseProps.onOpenExport).toHaveBeenCalled();
    });

    it('calls onOpenReset when reset button clicked', async () => {
        render(<ListSettingsModal {...baseProps} />);
        const resetBtn = screen.getByRole('button', { name: /lists.reset/i });
        act(() => { fireEvent.click(resetBtn); });
        expect(baseProps.onOpenReset).toHaveBeenCalled();
    });

    it('renders sorting options and calls setSortBy', async () => {
        render(<ListSettingsModal {...baseProps} />);
        const alphaBtn = screen.getByRole('button', { name: /lists.sort.alphabetical/i });
        await act(async () => { fireEvent.click(alphaBtn); });
        expect(baseProps.setSortBy).toHaveBeenCalledWith('alphabetical');
        expect(baseProps.onUpdateSettings).toHaveBeenCalledWith({ defaultSort: 'alphabetical' });
    });

    it('shows AI generated banner when isAIGenerated flag is set', () => {
        const aiList = {
            ...mockList,
            settings: { ...mockList.settings, isAIGenerated: true, aiPrompt: 'Test prompt' },
        };
        render(<ListSettingsModal {...baseProps} list={aiList} />);
        expect(screen.getByText('Skapad med Gemini AI')).toBeDefined();
        expect(screen.getByText(/Test prompt/)).toBeDefined();
    });
});
