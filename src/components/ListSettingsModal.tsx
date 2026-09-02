import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pin, EyeOff, RotateCcw, Download, Trash2, ChevronDown, Check, Copy, GripVertical, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { List, ListSettings } from '../types';
import { Modal } from './Modal';
import geminiIconUrl from '../assets/gemini.svg';
import type { SortMode } from '../utils/itemUtils';

interface ListSettingsModalProps {
    list: List;
    sortBy: SortMode;
    setSortBy: (mode: SortMode) => void;
    onUpdateSettings: (newSettings: Partial<ListSettings>) => Promise<void>;
    onAddSection: (e: React.FormEvent) => Promise<void>;
    onUpdateSection: (sectionId: string) => Promise<void>;
    onDeleteSection: (sectionId: string) => Promise<void>;
    onSectionDragEnd: (event: DragEndEvent) => Promise<void>;
    onArchiveList: (archived: boolean) => Promise<void>;
    onDeleteList: () => void;
    onOpenExport: () => void;
    onOpenReset: () => void;
    sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;
}

// ---------------------------------------------------------------------------
// Internal: SortableSectionItem inside the settings modal
// ---------------------------------------------------------------------------
interface SortableSectionItemProps {
    section: { id: string; name: string; order?: number };
    editingSectionId: string | null;
    editedSectionName: string;
    setEditedSectionName: (name: string) => void;
    setEditingSectionId: (id: string | null) => void;
    handleUpdateSection: (id: string) => void;
    setDeleteSectionId: (id: string) => void;
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
    section,
    editingSectionId,
    editedSectionName,
    setEditedSectionName,
    setEditingSectionId,
    handleUpdateSection,
    setDeleteSectionId,
}) => {
    const isEditing = editingSectionId === section.id;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: section.id, disabled: isEditing });

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${isDragging ? 'z-50 opacity-50 shadow-md ring-2 ring-blue-500/50' : ''}`}
        >
            {isEditing ? (
                <>
                    <input
                        type="text"
                        value={editedSectionName}
                        onChange={(e) => setEditedSectionName(e.target.value)}
                        className="flex-1 p-1 rounded border border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSection(section.id);
                            if (e.key === 'Escape') {
                                setEditingSectionId(null);
                                setEditedSectionName('');
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => handleUpdateSection(section.id)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Save"
                        aria-label="Save section name"
                    >
                        ✓
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEditingSectionId(null);
                            setEditedSectionName('');
                        }}
                        className="p-1 text-gray-600 hover:text-gray-700"
                        title="Cancel"
                        aria-label="Cancel editing section"
                    >
                        ✕
                    </button>
                </>
            ) : (
                <>
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none flex-shrink-0 p-0.5"
                        aria-label="Drag to reorder section"
                    >
                        <GripVertical size={16} />
                    </div>
                    <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                        {section.name}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingSectionId(section.id);
                                setEditedSectionName(section.name);
                            }}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Edit"
                            aria-label="Edit section"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeleteSectionId(section.id)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                            aria-label="Delete section"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const ListSettingsModal: React.FC<ListSettingsModalProps> = ({
    list,
    sortBy,
    setSortBy,
    onUpdateSettings,
    onAddSection,
    onUpdateSection,
    onDeleteSection,
    onSectionDragEnd,
    onArchiveList,
    onDeleteList,
    onOpenExport,
    onOpenReset,
    sensors,
}) => {
    const { t } = useTranslation();
    const [newSectionName, setNewSectionName] = useState('');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editedSectionName, setEditedSectionName] = useState('');
    const [deletingSectionId, setDeleteSectionId] = useState<string | null>(null);
    const [promptCopied, setPromptCopied] = useState(false);
    const [calendarAccordionOpen, setCalendarAccordionOpen] = useState(false);
    const [calendarEventTitle, setCalendarEventTitle] = React.useState(list.name);
    const [calendarStartTime, setCalendarStartTime] = useState('');
    const [calendarEndTime, setCalendarEndTime] = useState('');

    const threeStageMode = list.settings?.threeStageMode ?? false;

    const handleDeleteSection = async (sectionId: string) => {
        await onDeleteSection(sectionId);
        setDeleteSectionId(null);
    };

    return (
        <div className="space-y-1 pt-2">
            {/* AI Generation Info */}
            {list.settings?.isAIGenerated && (
                <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10 border border-purple-200/60 dark:border-purple-700/40 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                        <img src={geminiIconUrl} alt="Gemini" className="w-5 h-5 drop-shadow-sm" />
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            {t('lists.settings.ai.generatedBy', 'Skapad med Gemini AI')}
                        </span>
                    </div>
                    {list.settings.aiPrompt && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 dark:text-purple-500/70">
                                {t('lists.settings.ai.promptUsed', 'Prompt som användes')}
                            </span>
                            <div className="relative">
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-white/70 dark:bg-gray-900/50 p-3 pr-10 rounded-xl border border-purple-100 dark:border-purple-800/30 leading-relaxed">
                                    &quot;{list.settings.aiPrompt}&quot;
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(list.settings!.aiPrompt!);
                                        setPromptCopied(true);
                                        setTimeout(() => setPromptCopied(false), 2000);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-all"
                                    title={promptCopied ? 'Kopierat!' : 'Kopiera prompt'}
                                >
                                    {promptCopied
                                        ? <Check size={14} className="text-green-500" />
                                        : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle rows */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                {/* Three Stage Mode */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-800/60">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.threeStage.title')}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('lists.settings.threeStage.description')}</span>
                    </div>
                    <button
                        onClick={() => onUpdateSettings({ threeStageMode: !threeStageMode })}
                        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${threeStageMode ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                        aria-label={t('lists.settings.threeStage.title')}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${threeStageMode ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Resettable */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-800/60">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <RotateCcw size={13} className={(list.settings?.isResettable ?? true) ? 'text-blue-500' : 'text-gray-400'} />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.resettable.title', 'Reset Suggestion')}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('lists.settings.resettable.description', 'Ask to reset when all items are done')}</span>
                    </div>
                    <button
                        onClick={() => onUpdateSettings({ isResettable: !(list.settings?.isResettable ?? true) })}
                        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${(list.settings?.isResettable ?? true) ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                        aria-label={t('lists.settings.resettable.title', 'Reset Suggestion')}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${(list.settings?.isResettable ?? true) ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Pinned */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-800/60">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <Pin size={13} className={list.settings?.pinned ? 'text-blue-500' : 'text-gray-400'} />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.pinned.title', 'Fäst lista')}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('lists.settings.pinned.description', 'Öppna denna lista automatiskt när appen startar')}</span>
                    </div>
                    <button
                        onClick={() => onUpdateSettings({ pinned: !list.settings?.pinned })}
                        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${list.settings?.pinned ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                        aria-label={t('lists.settings.pinned.title', 'Fäst lista')}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${list.settings?.pinned ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Hide Completed */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-800/60">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <EyeOff size={13} className={list.settings?.hideCompleted ? 'text-blue-500' : 'text-gray-400'} />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.hideCompleted.title')}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('lists.settings.hideCompleted.description')}</span>
                    </div>
                    <button
                        onClick={() => onUpdateSettings({ hideCompleted: !list.settings?.hideCompleted })}
                        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${list.settings?.hideCompleted ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                        aria-label={t('lists.settings.hideCompleted.title')}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${list.settings?.hideCompleted ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Sorting Options */}
            <div className="space-y-2 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                    {t('lists.settings.sort')}
                </label>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                    {(['manual', 'alphabetical', 'completed'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => {
                                setSortBy(mode);
                                onUpdateSettings({ defaultSort: mode });
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                                sortBy === mode
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            <span className="text-sm font-medium capitalize">{t(`lists.sort.${mode}`)}</span>
                            {sortBy === mode && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section Management */}
            {!list.archived && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('lists.sections.title')}
                    </label>

                    {/* Add Section Form */}
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (newSectionName.trim()) {
                                await onAddSection(e);
                                setNewSectionName('');
                            }
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            placeholder={t('lists.sections.addPlaceholder')}
                            className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            {t('lists.sections.add')}
                        </button>
                    </form>

                    {/* Sections List */}
                    <div className="space-y-2">
                        {(() => {
                            const sortedSections = [...(list.sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                            if (sortedSections.length === 0) {
                                return (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                        {t('lists.sections.empty')}
                                    </p>
                                );
                            }
                            return (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={onSectionDragEnd}
                                >
                                    <SortableContext
                                        items={sortedSections.map((s) => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {sortedSections.map((section) => (
                                                <SortableSectionItem
                                                    key={section.id}
                                                    section={section}
                                                    editingSectionId={editingSectionId}
                                                    editedSectionName={editedSectionName}
                                                    setEditedSectionName={setEditedSectionName}
                                                    setEditingSectionId={setEditingSectionId}
                                                    handleUpdateSection={onUpdateSection}
                                                    setDeleteSectionId={setDeleteSectionId}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Archive Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.archive.title')}</span>
                    <span className="text-sm text-gray-500">{t('lists.settings.archive.description')}</span>
                </div>
                <button
                    onClick={() => onArchiveList(!list.archived)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${list.archived ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    aria-label={t('lists.settings.archive.title')}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${list.archived ? 'translate-x-6' : ''}`} />
                </button>
            </div>

            {/* Calendar Accordion - Hidden if archived */}
            {!list.archived && (
                <div className="space-y-2">
                    <button
                        onClick={() => setCalendarAccordionOpen(!calendarAccordionOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{t('lists.settings.calendar.title')}</span>
                            <span className="text-sm text-gray-500">{t('lists.settings.calendar.description')}</span>
                        </div>
                        <ChevronDown
                            size={20}
                            className={`transition-transform ${calendarAccordionOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {calendarAccordionOpen && (
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('lists.settings.calendar.eventTitle')}
                                </label>
                                <input
                                    type="text"
                                    value={calendarEventTitle}
                                    onChange={(e) => setCalendarEventTitle(e.target.value)}
                                    placeholder={list.name}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('lists.settings.calendar.startTime')}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={calendarStartTime}
                                    onChange={(e) => setCalendarStartTime(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('lists.settings.calendar.endTime')}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={calendarEndTime}
                                    onChange={(e) => setCalendarEndTime(e.target.value)}
                                    min={calendarStartTime}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Export List Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={onOpenExport}
                    className="w-full flex items-center justify-center gap-2 p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium border border-blue-100 dark:border-blue-900/30"
                >
                    <Download size={18} />
                    {t('export.buttonTitle', 'Exportera lista (JSON)')}
                </button>
            </div>

            {/* Reset List Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={onOpenReset}
                    className="w-full flex items-center justify-center gap-2 p-3 text-orange-600 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                    <RotateCcw size={18} />
                    {t('lists.reset')}
                </button>
            </div>

            {/* Delete List Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={onDeleteList}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                >
                    <Trash2 size={18} />
                    {t('lists.deleteTitle')}
                </button>
            </div>

            {/* Delete Section Confirm Modal */}
            <Modal
                isOpen={deletingSectionId !== null}
                onClose={() => setDeleteSectionId(null)}
                onConfirm={() => deletingSectionId && handleDeleteSection(deletingSectionId)}
                title={t('lists.sections.deleteTitle')}
                message={t('lists.sections.deleteMessage')}
                confirmText={t('lists.sections.deleteConfirm')}
            />
        </div>
    );
};
