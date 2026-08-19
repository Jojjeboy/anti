import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatisticsView } from './StatisticsView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AppContext from '../context/AppContext';
import { List, Category, Todo, ExecutionSession } from '../types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Recharts uses ResizeObserver / SVG — mock the entire library to avoid DOM issues in jsdom
vi.mock('recharts', () => {
    const Placeholder = ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="recharts-placeholder">{children}</div>
    );
    return {
        ResponsiveContainer: Placeholder,
        AreaChart: Placeholder,
        BarChart: Placeholder,
        PieChart: Placeholder,
        Pie: Placeholder,
        Bar: Placeholder,
        Area: Placeholder,
        Cell: Placeholder,
        XAxis: Placeholder,
        YAxis: Placeholder,
        CartesianGrid: Placeholder,
        Tooltip: Placeholder,
        Legend: Placeholder,
        LabelList: Placeholder,
    };
});

vi.mock('lucide-react', () => ({
    TrendingUp: () => <div />,
    List: () => <div />,
    CheckCircle2: () => <div />,
    PlayCircle: () => <div />,
    PieChart: () => <div />,
    BarChart3: () => <div />,
    ListTodo: () => <div />,
}));

const mockLists: List[] = [
    {
        id: 'l1',
        name: 'Shopping',
        categoryId: 'cat1',
        items: [
            { id: 'i1', text: 'Milk', completed: true },
            { id: 'i2', text: 'Eggs', completed: false },
        ],
    },
    {
        id: 'l2',
        name: 'Gym bag',
        categoryId: 'cat2',
        items: [{ id: 'i3', text: 'Towel', completed: false }],
    },
];

const mockCategories: Category[] = [
    { id: 'cat1', name: 'Food', order: 0 },
    { id: 'cat2', name: 'Sports', order: 1 },
];

const mockTodos: Todo[] = [
    { id: 't1', title: 'Buy milk', content: '', priority: 'high', completed: false, createdAt: '2024-01-01' },
    { id: 't2', title: 'Call dentist', content: '', priority: 'medium', completed: false, createdAt: '2024-01-02' },
    { id: 't3', title: 'Low task', content: '', priority: 'low', completed: true, createdAt: '2024-01-03' },
];

const mockSessions: ExecutionSession[] = [
    { id: 's1', name: 'Morning run', listIds: ['l1', 'l2'], createdAt: new Date().toISOString() },
    { id: 's2', name: 'Evening', listIds: ['l1'], createdAt: new Date().toISOString() },
    { id: 's3', name: 'Night', listIds: ['l2'], createdAt: new Date().toISOString() },
    { id: 's4', name: 'Weekend', listIds: ['l1'], createdAt: new Date().toISOString() },
];

const setupMock = (overrides?: Partial<ReturnType<typeof AppContext.useApp>>) => {
    vi.spyOn(AppContext, 'useApp').mockReturnValue({
        lists: mockLists,
        categories: mockCategories,
        todos: mockTodos,
        sessions: mockSessions,
        theme: 'light',
        addCategory: vi.fn(), updateCategoryName: vi.fn(), deleteCategory: vi.fn(),
        reorderCategories: vi.fn(), addList: vi.fn(), updateListName: vi.fn(),
        updateListSettings: vi.fn(), deleteList: vi.fn(), copyList: vi.fn(),
        moveList: vi.fn(), reorderLists: vi.fn(), updateListItems: vi.fn(),
        deleteItem: vi.fn(), toggleTheme: vi.fn(), addTodo: vi.fn(),
        updateTodo: vi.fn(), toggleTodo: vi.fn(), deleteTodo: vi.fn(),
        searchQuery: '', setSearchQuery: vi.fn(), loading: false,
        addSession: vi.fn(), completeSession: vi.fn(), deleteSession: vi.fn(),
        combinations: [], addCombination: vi.fn(), updateCombination: vi.fn(),
        deleteCombination: vi.fn(), updateListAccess: vi.fn(), archiveList: vi.fn(),
        addSection: vi.fn(), updateSection: vi.fn(), deleteSection: vi.fn(),
        importItemsFromList: vi.fn(),
        ...overrides,
    } as ReturnType<typeof AppContext.useApp>);
};

describe('StatisticsView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupMock();
    });

    it('renders without crashing', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.title')).toBeDefined();
    });

    it('shows total lists metric correctly', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.metrics.totalLists')).toBeDefined();
        // value = 2 lists
        expect(screen.getByText('2')).toBeDefined();
    });

    it('shows completed items metric correctly', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.metrics.completedItems')).toBeDefined();
        // value = 1 completed item (Milk)
        expect(screen.getByText('1')).toBeDefined();
    });

    it('shows total todos metric', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.metrics.totalTodos')).toBeDefined();
        // 3 todos
        expect(screen.getByText('3')).toBeDefined();
    });

    it('shows total sessions metric', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.metrics.totalSessions')).toBeDefined();
        // 4 sessions
        expect(screen.getByText('4')).toBeDefined();
    });

    it('renders chart section labels', () => {
        render(<StatisticsView />);
        expect(screen.getByText('stats.activityTrend')).toBeDefined();
        expect(screen.getByText('stats.topLists')).toBeDefined();
        expect(screen.getByText('stats.categoryDist')).toBeDefined();
        expect(screen.getByText('stats.todosPriority')).toBeDefined();
    });

    it('shows "no data" placeholder when there are no sessions for top-lists', () => {
        setupMock({ sessions: [] });
        render(<StatisticsView />);
        expect(screen.getByText('sessions.noLists')).toBeDefined();
    });

    it('renders without errors when all data is empty', () => {
        setupMock({ lists: [], categories: [], todos: [], sessions: [] });
        render(<StatisticsView />);
        expect(screen.getByText('stats.title')).toBeDefined();
    });
});
