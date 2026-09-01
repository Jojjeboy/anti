import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Copy, Check, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Item, Section, List } from '../types';

interface ImportJsonToListModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentList: List;
    onReplace: (items: Item[], sections?: Section[]) => Promise<void>;
    onAppend: (items: Item[], sections?: Section[]) => Promise<void>;
}

interface ParsedImportData {
    name: string;
    items: Item[];
    sections?: Section[];
}

interface ValidationResult {
    isValid: boolean;
    error?: string;
    data?: ParsedImportData;
    /** Section names in import that already exist in the current list */
    duplicateSectionNames?: string[];
}

export const ImportJsonToListModal: React.FC<ImportJsonToListModalProps> = ({
    isOpen,
    onClose,
    currentList,
    onReplace,
    onAppend,
}) => {
    const { t } = useTranslation();
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'input' | 'confirm'>('input');
    const [validatedData, setValidatedData] = useState<ParsedImportData | null>(null);
    const [duplicateSectionNames, setDuplicateSectionNames] = useState<string[]>([]);
    const [showExample, setShowExample] = useState(false);
    const [copiedExample, setCopiedExample] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const exampleJson = `{
  "name": "Min lista",
  "sections": [
    {
      "name": "Sektion 1",
      "items": ["Punkt A", "Punkt B"]
    }
  ],
  "items": ["Punkt utan sektion"]
}`;

    const copyExample = async () => {
        try {
            await navigator.clipboard.writeText(exampleJson);
            setCopiedExample(true);
            setTimeout(() => setCopiedExample(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const validateAndParseJSON = (jsonString: string): ValidationResult => {
        if (!jsonString.trim()) {
            return { isValid: false, error: t('importJson.errorPaste', 'Klistra in JSON-data för att importera.') };
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonString);
        } catch {
            return { isValid: false, error: t('importJson.errorInvalid', 'Ogiltigt JSON-format. Kontrollera syntaxfel.') };
        }

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return { isValid: false, error: t('importJson.errorObject', 'JSON måste vara ett objekt med fälten "name" samt "items" eller "sections".') };
        }

        const data = parsed as Record<string, unknown>;

        if (!('name' in data) || typeof data.name !== 'string' || data.name.trim() === '') {
            return { isValid: false, error: t('importJson.errorName', 'Fältet "name" saknas eller är tomt.') };
        }

        const hasItems = 'items' in data;
        const hasSections = 'sections' in data;

        if (!hasItems && !hasSections) {
            return { isValid: false, error: t('importJson.errorItemsOrSections', 'JSON måste innehålla fältet "items" eller "sections".') };
        }

        const items: Item[] = [];
        const sections: Section[] = [];
        const existingSectionNames = new Set(
            (currentList.sections || []).map(s => s.name.toLowerCase())
        );
        const duplicates: string[] = [];

        // Parse sections
        if (hasSections) {
            if (!Array.isArray(data.sections)) {
                return { isValid: false, error: t('importJson.errorSectionsArray', 'Fältet "sections" måste vara en lista (array).') };
            }

            for (let sIndex = 0; sIndex < data.sections.length; sIndex++) {
                const sec = data.sections[sIndex];
                if (typeof sec !== 'object' || sec === null || Array.isArray(sec)) {
                    return { isValid: false, error: t('importJson.errorSectionFormat', { index: sIndex + 1, defaultValue: `Sektion på position ${sIndex + 1} har ogiltigt format.` }) };
                }

                const secObj = sec as Record<string, unknown>;
                if (!('name' in secObj) || typeof secObj.name !== 'string' || secObj.name.trim() === '') {
                    return { isValid: false, error: t('importJson.errorSectionName', { index: sIndex + 1, defaultValue: `Sektion på position ${sIndex + 1} saknar namn.` }) };
                }

                const sectionName = secObj.name.trim();
                if (existingSectionNames.has(sectionName.toLowerCase())) {
                    duplicates.push(sectionName);
                }

                const sectionId = crypto.randomUUID();
                sections.push({ id: sectionId, name: sectionName, order: sIndex });

                if ('items' in secObj) {
                    if (!Array.isArray(secObj.items)) {
                        return { isValid: false, error: t('importJson.errorSectionItemsArray', { index: sIndex + 1, defaultValue: `Fältet "items" i sektion ${sIndex + 1} måste vara en lista.` }) };
                    }
                    for (let i = 0; i < secObj.items.length; i++) {
                        const item = secObj.items[i];
                        if (typeof item === 'string') {
                            items.push({ id: crypto.randomUUID(), text: item, completed: false, sectionId });
                        } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                            const itemObj = item as Record<string, unknown>;
                            if (!('text' in itemObj) || typeof itemObj.text !== 'string') {
                                return { isValid: false, error: t('importJson.errorItemFormat', { index: i + 1, defaultValue: `Objekt på position ${i + 1} har ogiltigt format.` }) };
                            }
                            items.push({
                                id: crypto.randomUUID(),
                                text: itemObj.text,
                                completed: typeof itemObj.completed === 'boolean' ? itemObj.completed : false,
                                sectionId,
                            });
                        } else {
                            return { isValid: false, error: t('importJson.errorItemFormat', { index: i + 1, defaultValue: `Objekt på position ${i + 1} har ogiltigt format.` }) };
                        }
                    }
                }
            }
        }

        // Parse top-level items
        if (hasItems) {
            if (!Array.isArray(data.items)) {
                return { isValid: false, error: t('importJson.errorItemsArray', 'Fältet "items" måste vara en lista (array).') };
            }
            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                if (typeof item === 'string') {
                    items.push({ id: crypto.randomUUID(), text: item, completed: false });
                } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const itemObj = item as Record<string, unknown>;
                    if (!('text' in itemObj) || typeof itemObj.text !== 'string') {
                        return { isValid: false, error: t('importJson.errorItemFormat', { index: i + 1, defaultValue: `Objekt på position ${i + 1} har ogiltigt format.` }) };
                    }
                    items.push({
                        id: crypto.randomUUID(),
                        text: itemObj.text,
                        completed: typeof itemObj.completed === 'boolean' ? itemObj.completed : false,
                    });
                } else {
                    return { isValid: false, error: t('importJson.errorItemFormat', { index: i + 1, defaultValue: `Objekt på position ${i + 1} har ogiltigt format.` }) };
                }
            }
        }

        if (items.length === 0 && sections.length === 0) {
            return { isValid: false, error: t('importJson.errorEmpty', 'Listan är tom. Lägg till minst ett objekt.') };
        }

        return {
            isValid: true,
            data: {
                name: data.name as string,
                items,
                sections: sections.length > 0 ? sections : undefined,
            },
            duplicateSectionNames: duplicates,
        };
    };

    const handleValidate = () => {
        setError('');
        const result = validateAndParseJSON(jsonInput);
        if (!result.isValid) {
            setError(result.error!);
            return;
        }
        setValidatedData(result.data!);
        setDuplicateSectionNames(result.duplicateSectionNames ?? []);
        setStep('confirm');
    };

    const handleReplace = async () => {
        if (!validatedData) return;
        setIsProcessing(true);
        try {
            await onReplace(validatedData.items, validatedData.sections);
            handleClose();
        } catch {
            setError(t('importJson.errorFailed', 'Importen misslyckades. Försök igen.'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAppend = async () => {
        if (!validatedData) return;
        setIsProcessing(true);
        try {
            await onAppend(validatedData.items, validatedData.sections);
            handleClose();
        } catch {
            setError(t('importJson.errorFailed', 'Importen misslyckades. Försök igen.'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setJsonInput('');
        setError('');
        setStep('input');
        setValidatedData(null);
        setDuplicateSectionNames([]);
        setShowExample(false);
        onClose();
    };

    if (!isOpen) return null;

    const totalItems = validatedData ? validatedData.items.length : 0;
    const totalSections = validatedData?.sections?.length ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden transform transition-all">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t('importJson.title', 'Importera lista (JSON)')}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('importJson.description', 'Klistra in JSON-data för att importera till den här listan. Formatet ska innehålla "name" samt "items" eller "sections".')}
                            </p>

                            {/* Show example toggle */}
                            <button
                                onClick={() => setShowExample(!showExample)}
                                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {showExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showExample
                                    ? t('importJson.hideExample', 'Dölj exempelformat')
                                    : t('importJson.showExample', 'Visa exempelformat')}
                            </button>

                            {showExample && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {t('importJson.exampleLabel', 'Exempelformat:')}
                                        </p>
                                        <button
                                            onClick={copyExample}
                                            className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            {copiedExample ? <Check size={10} /> : <Copy size={10} />}
                                            {copiedExample ? t('import.copied', 'Kopierat!') : t('import.copy', 'Kopiera')}
                                        </button>
                                    </div>
                                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                        {exampleJson}
                                    </pre>
                                </div>
                            )}

                            {/* JSON Input */}
                            <textarea
                                value={jsonInput}
                                onChange={(e) => {
                                    setJsonInput(e.target.value);
                                    setError('');
                                }}
                                placeholder={t('importJson.placeholder', 'Klistra in JSON här...')}
                                className="w-full h-44 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                                    <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t('common.cancel', 'Avbryt')}
                                </button>
                                <button
                                    onClick={handleValidate}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                >
                                    {t('importJson.validate', 'Validera JSON')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && validatedData && (
                        <div className="space-y-4">
                            {/* Validation success summary */}
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                    ✅ {t('importJson.validSuccess', 'JSON validerat!')}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {totalSections > 0
                                        ? t('importJson.summaryWithSections', {
                                            items: totalItems,
                                            sections: totalSections,
                                            defaultValue: `${totalItems} objekt i ${totalSections} sektion(er) hittades.`,
                                        })
                                        : t('importJson.summary', {
                                            items: totalItems,
                                            defaultValue: `${totalItems} objekt hittades.`,
                                        })}
                                </p>
                            </div>

                            {/* Duplicate section warning */}
                            {duplicateSectionNames.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                            {t('importJson.duplicateSectionsTitle', 'Sektioner finns redan')}
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            {t('importJson.duplicateSectionsDesc', {
                                                sections: duplicateSectionNames.join('", "'),
                                                defaultValue: `Sektionerna "${duplicateSectionNames.join('", "')}" finns redan i listan. Vid "Lägg till" läggs punkterna till i de befintliga sektionerna.`,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('importJson.chooseAction', 'Välj hur du vill importera till listan "{{name}}":', { name: currentList.name })}
                            </p>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                {/* Append */}
                                <button
                                    onClick={handleAppend}
                                    disabled={isProcessing}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <Plus size={18} className="flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {t('importJson.appendAction', 'Lägg till i listan')}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {t('importJson.appendDesc', 'Befintliga punkter behålls och de importerade läggs till.')}
                                        </p>
                                    </div>
                                </button>

                                {/* Replace */}
                                <button
                                    onClick={handleReplace}
                                    disabled={isProcessing}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <RefreshCw size={18} className="flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {t('importJson.replaceAction', 'Ersätt hela listan')}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {t('importJson.replaceDesc', 'Alla befintliga punkter och sektioner tas bort och ersätts med importen.')}
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                                    <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-1">
                                <button
                                    onClick={() => { setStep('input'); setError(''); }}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    ← {t('importJson.backToEdit', 'Ändra JSON')}
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t('common.cancel', 'Avbryt')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
