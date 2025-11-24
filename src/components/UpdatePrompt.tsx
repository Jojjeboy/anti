import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export const UpdatePrompt: React.FC = () => {
    const { t } = useTranslation();
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: any) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error: any) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    if (!needRefresh) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('update.title', 'Update Available')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {t('update.message', 'A new version of the app is available. Click update to reload and get the latest features.')}
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={close}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {t('update.later', 'Later')}
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        {t('update.reload', 'Update & Reload')}
                    </button>
                </div>
            </div>
        </div>
    );
};
