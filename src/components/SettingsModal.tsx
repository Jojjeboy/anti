import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const { categories, lists, notes, theme, importData } = useApp();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleExport = () => {
        const data = {
            categories,
            lists,
            notes,
            theme,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anti-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(t('toasts.dataImported'), 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.categories && !data.lists && !data.notes) {
                    throw new Error('Invalid backup file format');
                }

                if (confirm(t('settings.importConfirm'))) {
                    importData(data);
                    onClose();
                }
            } catch (error) {
                console.error('Import error:', error);
                showToast(t('toasts.importFailed'), 'error');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.language')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => i18n.changeLanguage('en')}
                                className={`p-3 rounded-xl border transition-all ${i18n.language === 'en'
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => i18n.changeLanguage('sv')}
                                className={`p-3 rounded-xl border transition-all ${i18n.language === 'sv'
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                Svenska
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.dataManagement')}</h3>

                        <div className="grid gap-3">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                                    <Download size={20} />
                                </div>
                                <div>
                                    <div className="font-medium">{t('settings.exportData')}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('settings.exportDataDesc')}</div>
                                </div>
                            </button>

                            <button
                                onClick={handleImportClick}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                            >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <div className="font-medium">{t('settings.importData')}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('settings.importDataDesc')}</div>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings.system', 'System')}</h3>
                        <button
                            onClick={() => {
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                                        for (const registration of registrations) {
                                            registration.unregister();
                                        }
                                        window.location.reload();
                                    });
                                } else {
                                    window.location.reload();
                                }
                            }}
                            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group w-full"
                        >
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg group-hover:scale-110 transition-transform">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <div className="font-medium">{t('settings.reloadUpdate', 'Reload & Update')}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('settings.reloadUpdateDesc', 'Clear cache and reload to get the latest version')}</div>
                            </div>
                        </button>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/50 flex gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0" size={20} />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <p className="font-medium mb-1">{t('settings.note')}</p>
                            <p>{t('settings.importWarning')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
