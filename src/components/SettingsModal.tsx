import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
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
        showToast('Data exported successfully', 'success');
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

                if (confirm('This will overwrite your current data. Are you sure?')) {
                    importData(data);
                    onClose();
                }
            } catch (error) {
                console.error('Import error:', error);
                showToast('Failed to import file. Invalid format.', 'error');
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
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Management</h3>

                        <div className="grid gap-3">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                                    <Download size={20} />
                                </div>
                                <div>
                                    <div className="font-medium">Export Data</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Download a backup of your lists and notes</div>
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
                                    <div className="font-medium">Import Data</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Restore from a backup file</div>
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

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/50 flex gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0" size={20} />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <p className="font-medium mb-1">Note</p>
                            <p>Importing data will overwrite your current lists and notes. Make sure to back up your current data first.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
