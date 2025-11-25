import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Moon, Sun, Search, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SearchResults } from './SearchResults';
import { SettingsModal } from './SettingsModal';
import commitsData from '../commits.json';
import { Commit } from '../types';

import { OfflineIndicator } from './OfflineIndicator';

const commits = commitsData as Commit[];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { theme, toggleTheme, searchQuery, setSearchQuery } = useApp();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const latestCommit = commits[0];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 flex flex-col">
            <OfflineIndicator />
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm p-4 flex flex-col gap-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Anti
                            </h1>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            aria-label={t('app.settings')}
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            aria-label={t('app.toggleTheme')}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('app.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </header>
            <main className="flex-1 p-4 max-w-3xl mx-auto w-full overflow-hidden">
                {searchQuery ? <SearchResults /> : children}
            </main>
            <footer className="p-6 text-center border-t border-gray-200 dark:border-gray-700 mt-auto flex flex-col items-center gap-2">
                <Link to="/notes" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('app.notes')}
                </Link>
                {latestCommit && (
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {(() => {
                                const commitDate = new Date(latestCommit.date);
                                const now = new Date();
                                const isCurrentYear = commitDate.getFullYear() === now.getFullYear();
                                const day = commitDate.getDate().toString().padStart(2, '0');
                                const month = commitDate.toLocaleString('sv-SE', { month: 'short' });
                                const year = isCurrentYear ? '' : ` ${commitDate.getFullYear()}`;
                                return `${day}/${month}${year}`;
                            })()}
                            <Link to="/activity" className="ml-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                {latestCommit.message.length > 30 ? `${latestCommit.message.substring(0, 30)}....` : latestCommit.message}
                            </Link>
                        </p>
                    </div>
                )}
            </footer>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};
