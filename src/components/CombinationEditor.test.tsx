import { render, screen, fireEvent } from '@testing-library/react';
import { CombinationEditor } from './CombinationEditor';
import { describe, it, expect, vi } from 'vitest';
import { List, Category } from '../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockLists: List[] = [
    { id: '1', name: 'List 1', categoryId: 'cat1', items: [] },
    { id: '2', name: 'List 2', categoryId: 'cat1', items: [] },
    { id: '3', name: 'List 3', categoryId: 'cat2', items: [] },
];

const mockCategories: Category[] = [
    { id: 'cat1', name: 'Category 1', order: 0 },
    { id: 'cat2', name: 'Category 2', order: 1 },
];

describe('CombinationEditor', () => {
    it('renders correctly when open', () => {
        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={() => {}}
                lists={mockLists}
                categories={mockCategories}
            />
        );
        expect(screen.getByText('combinations.create')).toBeDefined();
    });

    it('does not render when closed', () => {
        const { container } = render(
            <CombinationEditor
                isOpen={false}
                onClose={() => {}}
                onSave={() => {}}
                lists={mockLists}
                categories={mockCategories}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('disables save button initially (no name, no lists)', () => {
        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={() => {}}
                lists={mockLists}
                categories={mockCategories}
            />
        );
        const saveButton = screen.getByText('common.save');
        expect(saveButton).toBeDisabled();
    });

    it('enables save button only when name and 2+ lists selected', () => {
        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={() => {}}
                lists={mockLists}
                categories={mockCategories}
            />
        );
        
        const input = screen.getByPlaceholderText('combinations.namePlaceholder');
        fireEvent.change(input, { target: { value: 'My Combo' } });
        
        // Select 1 list - should still be disabled
        fireEvent.click(screen.getByText('List 1'));
        expect(screen.getByText('common.save')).toBeDisabled();
        
        // Select 2nd list - should be enabled
        fireEvent.click(screen.getByText('List 2'));
        expect(screen.getByText('common.save')).not.toBeDisabled();
    });

    it('calls onSave with correct data', () => {
        const mockSave = vi.fn();
        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={mockSave}
                lists={mockLists}
                categories={mockCategories}
            />
        );
        
        fireEvent.change(screen.getByPlaceholderText('combinations.namePlaceholder'), { target: { value: 'My Combo' } });
        fireEvent.click(screen.getByText('List 1'));
        fireEvent.click(screen.getByText('List 2'));
        
        fireEvent.click(screen.getByText('common.save'));
        
        expect(mockSave).toHaveBeenCalledWith('My Combo', expect.arrayContaining(['1', '2']));
    });

    it('filters lists by search query', () => {
        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={() => {}}
                lists={mockLists}
                categories={mockCategories}
            />
        );

        const searchInput = screen.getByPlaceholderText('sessions.searchPlaceholder');
        fireEvent.change(searchInput, { target: { value: 'List 3' } });

        expect(screen.queryByText('List 1')).toBeNull();
        expect(screen.getByText('List 3')).toBeDefined();
    });

    it('does not crash when receiving malformed lists', () => {
        const malformedLists: List[] = [
            { id: '1', categoryId: 'cat1', items: [] } as unknown as List, // Missing name
            { id: '2', name: undefined, categoryId: 'cat1', items: [] } as unknown as List,
            null as unknown as List,
            undefined as unknown as List
        ];

        render(
            <CombinationEditor
                isOpen={true}
                onClose={() => {}}
                onSave={() => {}}
                lists={malformedLists}
                categories={mockCategories}
            />
        );
        
        // Should render without crashing
        expect(screen.getByText('combinations.create')).toBeDefined();
    });
});
