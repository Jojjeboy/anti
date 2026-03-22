import React, { useState, useEffect } from 'react';
import { X, Folder, Loader2, Wand2 } from 'lucide-react';
import { Category, Item } from '../types';
import { generateListContent, GeneratedList } from '../services/aiService';
import geminiIconUrl from '../assets/gemini.svg';

interface AIListGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, items: Item[], categoryId: string) => Promise<void>;
    categories: Category[];
    onAddCategory?: (name: string) => Promise<string>;
}

export const AIListGeneratorModal: React.FC<AIListGeneratorModalProps> = ({ isOpen, onClose, onSave, categories, onAddCategory }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedList, setGeneratedList] = useState<GeneratedList | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (isOpen && categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [isOpen, categories, selectedCategoryId]);

    if (!isOpen) return null;

    const handleClose = () => {
        setPrompt('');
        setError('');
        setGeneratedList(null);
        setIsLoading(false);
        setIsCreatingCategory(false);
        setNewCategoryName('');
        onClose();
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Vänligen beskriv vad du vill ha för lista först.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedList(null);

        try {
            const result = await generateListContent(prompt);
            setGeneratedList(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ett oväntat fel uppstod vid generering.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!generatedList) return;
        
        let targetCategoryId = selectedCategoryId;

        if (isCreatingCategory) {
            if (!newCategoryName.trim()) {
                setError('Vänligen ange ett namn för den nya kategorin.');
                return;
            }
            if (!onAddCategory) {
                setError('Det går tyvärr inte att skapa en kategori just nu.');
                return;
            }
        } else if (!selectedCategoryId) {
            setError('Vänligen välj en kategori.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            if (isCreatingCategory && onAddCategory) {
                targetCategoryId = await onAddCategory(newCategoryName);
            }

            const formattedItems: Item[] = generatedList.items.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed: false
            }));

            await onSave(generatedList.title, formattedItems, targetCategoryId);
            handleClose();
        } catch {
            setError('Kunde inte spara listan. Vänligen försök igen.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden transform transition-all">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <img src={geminiIconUrl} alt="Gemini" className="w-5 h-5 drop-shadow-sm" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Skapa lista med AI
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            {!generatedList && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Beskriv vilken typ av lista du vill skapa, till exempel &quot;Packlista för weekend i Sthlm&quot; eller &quot;Ingredienser för lasagne&quot;.
                                </p>
                            )}

                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Ex: Packlista för en snowboardresa i fjällen..."
                                    className={`w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all placeholder:text-gray-400 disabled:opacity-60 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed ${generatedList ? 'h-20' : 'h-32'}`}
                                    disabled={isLoading || isSaving}
                                />
                            </div>

                            {error && !generatedList && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                                    <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {!generatedList && (
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading || !prompt.trim()}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Skapar förslag...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={16} />
                                                Generera list-förslag
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                        {generatedList && (
                            <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
                                {/* Preview result header with re-generate option */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Förslag</span>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading || !prompt.trim()}
                                        className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                                        {isLoading ? 'Uppdaterar...' : 'Generera om'}
                                    </button>
                                </div>
                                {/* Preview result */}
                                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-xl p-5 mb-5">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-3 border-b border-purple-200 dark:border-purple-800">
                                        {generatedList.title}
                                    </h4>
                                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {generatedList.items.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-purple-500 mt-1 flex-shrink-0">•</span>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Spara listan i kategori
                                    </label>
                                    
                                    {!isCreatingCategory ? (
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                    <Folder size={16} />
                                                </div>
                                                <select
                                                    value={selectedCategoryId}
                                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                                                    disabled={isSaving}
                                                >
                                                    {categories.length === 0 && <option value="">Inga kategorier</option>}
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {onAddCategory && (
                                                <button 
                                                    onClick={() => setIsCreatingCategory(true)}
                                                    className="px-3 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 rounded-lg transition-colors whitespace-nowrap"
                                                    disabled={isSaving}
                                                >
                                                    Ny kategori
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Ny kategori..."
                                                className="w-full flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                disabled={isSaving}
                                                autoFocus
                                            />
                                            <button 
                                                onClick={() => {
                                                    setIsCreatingCategory(false);
                                                    setNewCategoryName('');
                                                }}
                                                className="p-2.5 text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                disabled={isSaving}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex gap-2">
                                        <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
                                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setGeneratedList(null)}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Kasta
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Sparar...
                                            </>
                                        ) : (
                                            'Spara i mina listor'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
