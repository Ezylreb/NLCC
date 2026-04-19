'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Edit2, Archive, Trash2, ChevronDown, ChevronUp, Plus, Globe, GlobeLock
} from 'lucide-react';
import { BahagiIconSelector } from './BahagiIconSelector';

interface EnhancedBahagiCardProps {
    id: number;
    title: string;
    yunit?: string;
    iconPath?: string;
    iconType?: string;
    description?: string;
    quarter?: string | null;
    week_number?: number | null;
    module_number?: string | null;
    isOpen?: boolean;
    isArchived?: boolean;
    isPublished?: boolean;
    lessonCount?: number;
    assessmentCount?: number;
    totalXP?: number;
    onEdit?: () => void;
    onAddYunit?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
    onTogglePublish?: () => void;
    onAddAssessment?: () => void;
    onIconChange?: (iconPath: string, iconType: string) => void;
    userId: string;
    expanded?: boolean;
    onToggleExpand?: (id: number) => void;
    isDraggable?: boolean;
}

export const EnhancedBahagiCardV2: React.FC<EnhancedBahagiCardProps> = ({
    id,
    title,
    yunit,
    iconPath,
    iconType = 'default',
    description,
    quarter,
    week_number,
    module_number,
    isOpen = true,
    isArchived = false,
    isPublished = false,
    lessonCount = 0,
    assessmentCount = 0,
    totalXP = 0,
    onEdit,
    onAddYunit,
    onArchive,
    onDelete,
    onTogglePublish,
    onAddAssessment,
    onIconChange,
    userId,
    expanded = false,
    onToggleExpand
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    // Default icon if none provided
    const defaultIcon = '/Character/NLLCTeachHalf1.png';
    const displayIcon = iconPath || defaultIcon;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden border border-slate-700"
            >
                {/* Card Header with Icon */}
                <div className="p-4 bg-slate-800/50">
                    <button
                        onClick={() => onToggleExpand?.(id)}
                        className="w-full flex items-center gap-4 hover:gap-5 transition"
                    >
                        {/* Icon Display */}
                        <div className="relative flex-shrink-0">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-purple-500/30 bg-slate-700 shadow-md hover:shadow-lg transition">
                                <img
                                    src={displayIcon}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = defaultIcon;
                                    }}
                                />
                            </div>
                        {/* Icon Customization Badge */}
                            {/* Removed - now in edit dialog */}
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-lg text-white line-clamp-1">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-sm text-slate-400 line-clamp-1">
                                    {description}
                                </p>
                            )}
                            {(quarter || week_number || module_number) && (
                                <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-black uppercase tracking-wide">
                                    {quarter && (
                                        <span className="bg-indigo-900/30 text-indigo-400 px-2 py-1 rounded">
                                            {quarter}
                                        </span>
                                    )}
                                    {week_number && (
                                        <span className="bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded">
                                            Week {week_number}
                                        </span>
                                    )}
                                    {module_number && (
                                        <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                                            {module_number}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                {isPublished ? (
                                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                                        <Globe size={12} /> Published
                                    </span>
                                ) : (
                                    <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                                        <GlobeLock size={12} /> Draft
                                    </span>
                                )}
                                {isArchived && (
                                    <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded">
                                        📂 Archived
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Expand Icon */}
                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown size={20} className="text-slate-400" />
                        </motion.div>
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                        <p className="text-xs text-slate-500">Yunits</p>
                        <p className="font-semibold text-white">{lessonCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Assessments</p>
                        <p className="font-semibold text-white">{assessmentCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Total XP</p>
                        <p className="font-semibold text-purple-400">+{totalXP}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-700 p-3 bg-slate-900 space-y-2"
                    >
                        {/* Secondary actions row */}
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={onTogglePublish}
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition font-semibold text-xs ${
                                    isPublished
                                        ? 'bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30'
                                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/40 hover:bg-slate-700'
                                }`}
                                title={isPublished ? 'Unpublish (hide from students)' : 'Publish (show to students)'}
                            >
                                {isPublished ? <Globe size={16} /> : <GlobeLock size={16} />}
                                {isPublished ? 'Published' : 'Publish'}
                            </button>
                            <button
                                onClick={onEdit}
                                className="flex flex-col items-center justify-center gap-1 bg-slate-700/50 text-slate-300 border border-slate-600/40 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-xs"
                            >
                                <Edit2 size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => setShowArchiveConfirm(true)}
                                className="flex flex-col items-center justify-center gap-1 bg-slate-700/50 text-yellow-400 border border-slate-600/40 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-xs"
                            >
                                <Archive size={16} />
                                Archive
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex flex-col items-center justify-center gap-1 bg-slate-700/50 text-red-400 border border-slate-600/40 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-xs"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>

                        {/* Add content actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onAddYunit}
                                className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-bold text-sm"
                            >
                                <Plus size={16} />
                                Add Yunit
                            </button>
                            <button
                                onClick={onAddAssessment}
                                className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-bold text-sm"
                            >
                                <Plus size={16} />
                                Add Assessment
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-slate-900 rounded-[2rem] p-8 max-w-sm shadow-2xl border border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-3">Delete Bahagi?</h3>
                        <p className="text-slate-300 mb-8">
                            This action cannot be undone. All Yunits and Assessments will also be deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onDelete?.();
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={() => setShowArchiveConfirm(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-slate-900 rounded-[2rem] p-8 max-w-sm shadow-2xl border border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-black text-white mb-3">Archive Bahagi?</h3>
                        <p className="text-slate-300 mb-8">
                            {isArchived
                                ? 'This Bahagi will be restored to active status.'
                                : 'This Bahagi and all its content will be archived and hidden from students.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowArchiveConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onArchive?.();
                                    setShowArchiveConfirm(false);
                                }}
                                className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition"
                            >
                                {isArchived ? 'Restore' : 'Archive'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};
