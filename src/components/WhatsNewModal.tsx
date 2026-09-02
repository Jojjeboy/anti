import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useChangelog } from '../hooks/useChangelog';

/**
 * Strips conventional commit prefixes (feat:, fix:, chore:, etc.) from a
 * commit message and returns just the human-readable description.
 */
function formatMessage(message: string): string {
    return message
        .replace(/^(feat|fix|chore|refactor|perf|test|docs|style|ci|build|revert)(\([^)]*\))?:\s*/i, '')
        .trim();
}

/**
 * Formats an ISO-like date string from commits.json into a short locale date.
 * commits.json dates look like: "2026-09-02 06:20:36 +0200"
 */
function formatDate(dateStr: string, language: string): string {
    try {
        const date = new Date(dateStr.replace(' ', 'T'));
        return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * "What's New" modal that shows commits unseen since the user's last visit.
 * Uses useChangelog to determine which commits to show and when to display.
 */
export const WhatsNewModal: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { unseenCommits, isOpen, dismiss } = useChangelog(user?.uid);

    // Handle keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismiss();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, dismiss]);

    // Scroll lock
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="whats-new-title"
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40">
                            <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                        </span>
                        <h2
                            id="whats-new-title"
                            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            {t('whatsNew.title')}
                        </h2>
                    </div>
                    <button
                        onClick={dismiss}
                        aria-label={t('common.close')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Subtitle */}
                <p className="px-6 pt-4 pb-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {t('whatsNew.subtitle')}
                </p>

                {/* Commit list */}
                <div className="px-6 pb-2 overflow-y-auto custom-scrollbar flex-1">
                    <ul className="space-y-3 py-2">
                        {unseenCommits.map((commit) => (
                            <li
                                key={commit.hash}
                                className="flex gap-3 items-start group"
                            >
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0 group-first:bg-green-500 dark:group-first:bg-green-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                        {formatMessage(commit.message)}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {formatDate(commit.date, i18n.language)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <button
                        id="whats-new-dismiss"
                        onClick={dismiss}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl transition-colors shadow-sm"
                    >
                        {t('whatsNew.dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};
