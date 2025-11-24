import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Folder, FileText } from 'lucide-react';

export const SearchResults: React.FC = () => {
    const { lists, categories, searchQuery, setSearchQuery } = useApp();

    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.items.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!searchQuery) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Search Results for "{searchQuery}"</h2>

            {filteredCategories.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Categories</h3>
                    <div className="grid gap-3">
                        {filteredCategories.map(category => (
                            <Link
                                key={category.id}
                                to={`/category/${category.id}`}
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                            >
                                <Folder className="text-blue-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-200">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {filteredLists.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Lists</h3>
                    <div className="grid gap-3">
                        {filteredLists.map(list => (
                            <Link
                                key={list.id}
                                to={`/list/${list.id}`}
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                            >
                                <FileText className="text-purple-500" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-200 block">{list.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        In {categories.find(c => c.id === list.categoryId)?.name || 'Unknown'} • {list.items.length} items
                                    </span>
                                    {list.items.length > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                                <div
                                                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${(list.items.filter(i => i.completed).length / list.items.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {Math.round((list.items.filter(i => i.completed).length / list.items.length) * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {filteredCategories.length === 0 && filteredLists.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500">No results found.</p>
                </div>
            )}
        </div>
    );
};
