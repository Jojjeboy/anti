import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { List } from '../types';

interface ExportListModalProps {
    isOpen: boolean;
    onClose: () => void;
    list: List;
}

export const ExportListModal: React.FC<ExportListModalProps> = ({ isOpen, onClose, list }) => {
    const { t } = useTranslation();
    const [format, setFormat] = useState<'simple' | 'detailed'>('simple');
    const [copied, setCopied] = useState(false);

    if (!isOpen || !list) return null;

    // Generate JSON structure based on selected format
    const generateJsonData = () => {
        if (format === 'simple') {
            return {
                name: list.name,
                items: (list.items || []).map((item) => item.text),
            };
        } else {
            return {
                name: list.name,
                items: (list.items || []).map((item) => ({
                    text: item.text,
                    completed: item.completed,
                })),
            };
        }
    };

    const jsonString = JSON.stringify(generateJsonData(), null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy JSON: ', err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const sanitizedFilename = (list.name || 'list').replace(/[/\\?%*:|"<>]/g, '_');
        link.href = url;
        link.download = `${sanitizedFilename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden transform transition-all">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('export.title', 'Exportera lista till JSON')}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('export.description', 'Exportera dina listobjekt i ett standardiserat JSON-format.')}
                        </p>

                        {/* Format selector tabs */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('export.formatLabel', 'JSON-format')}
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormat('simple')}
                                    className={`py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                                        format === 'simple'
                                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {t('export.simpleFormat', 'Enkelt format (endast text)')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormat('detailed')}
                                    className={`py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                                        format === 'detailed'
                                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {t('export.detailedFormat', 'Detaljerat format (med status)')}
                                </button>
                            </div>
                        </div>

                        {/* JSON Code Preview */}
                        <div className="relative">
                            <pre className="w-full h-52 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 text-gray-100 font-mono text-xs overflow-auto custom-scrollbar">
                                {jsonString}
                            </pre>
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {t('common.cancel', 'Avbryt')}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                {copied ? t('export.copied', 'Kopierat!') : t('export.copy', 'Kopiera JSON')}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-95"
                            >
                                <Download size={16} />
                                {t('export.download', 'Ladda ner JSON')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
