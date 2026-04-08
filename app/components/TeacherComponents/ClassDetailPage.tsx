'use client';

import React, { useState } from 'react';

interface ClassDetailPageProps {
    classId: string;
    className: string;
    onBack: () => void;
    onCreateBahagi: () => void;
    onCreateLesson?: () => void;
    onCreateYunit?: (bahagiId: number) => void;
    onCreateAssessment?: (lessonId: string) => void;
    onEditLesson?: (lessonId: string) => void;
    onEditYunit?: (lessonId: string, yunitId: string) => void;
    onEditAssessment?: (lessonId: string, assessmentId: string) => void;
    onDeleteYunit?: (lessonId: string, yunitId: string) => void;
    onDeleteAssessment?: (lessonId: string, assessmentId: string) => void;
    bahagi?: any[];
    lessons?: any[];
    onDeleteLesson?: (lessonId: string) => void;
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({
    classId,
    className,
    onBack,
    onCreateBahagi,
    onCreateLesson,
    onCreateYunit,
    onCreateAssessment,
    onEditLesson,
    onEditYunit,
    onEditAssessment,
    onDeleteYunit,
    onDeleteAssessment,
    bahagi = [],
    lessons = [],
    onDeleteLesson
}) => {
    const [expandedBahagiId, setExpandedBahagiId] = useState<number | null>(null);

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl transition-all border border-slate-700 hover:border-brand-purple/30"
                    title="Back to classes"
                >
                    ← 
                </button>
                <div>
                    <h2 className="text-4xl font-black text-white">{className}</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Class Management</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={onCreateBahagi}
                    className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                    <span>📚</span> Add Bahagi
                </button>
                {onCreateLesson && (
                    <button
                        onClick={onCreateLesson}
                        className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                    >
                        <span>📖</span> Create Lesson
                    </button>
                )}
                <button
                    disabled
                    className="bg-brand-sky/30 text-brand-sky px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                    title="Coming soon"
                >
                    <span>⭐</span> Add Rewards
                </button>
            </div>

            {/* Bahagi Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white">📚 Bahagi (Lesson Sections)</h3>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                        {bahagi.length} Bahagi{bahagi.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {bahagi.length > 0 ? (
                    <div className="space-y-4">
                        {bahagi.map((b) => (
                            <div
                                key={b.id}
                                className="bg-slate-900/50 border border-slate-800/50 rounded-4xl overflow-hidden group hover:border-brand-purple/30 transition-all"
                            >
                                {/* Bahagi Header */}
                                <button
                                    onClick={() => setExpandedBahagiId(expandedBahagiId === b.id ? null : b.id)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4 text-left flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700 group-hover:border-brand-purple/30 transition-all">
                                            📕
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-white group-hover:text-brand-purple transition-colors">
                                                {b.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 font-bold mt-1">Yunit: {b.yunit || 'Yunit 1'}</p>
                                            <div className="flex gap-4 mt-3">
                                                <span className="text-[10px] font-black text-brand-sky uppercase tracking-wider">
                                                    Click to expand
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-2xl transition-transform" style={{
                                        transform: expandedBahagiId === b.id ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}>
                                        ▼
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {expandedBahagiId === b.id && (
                                    <div className="border-t border-slate-800/50 bg-slate-950/50 p-6 space-y-4">
                                        <p className="text-sm text-slate-400 italic">
                                            Bahagi ID: {b.id} | Teacher: {b.teacher_id}
                                        </p>
                                        <button
                                            onClick={() => onCreateYunit?.(b.id)}
                                            className="w-full text-center text-xs font-black text-brand-sky hover:text-white uppercase tracking-widest px-4 py-2 rounded-lg border border-brand-sky/30 hover:bg-brand-sky/10 transition-all"
                                        >
                                            + Add Yunit to this Bahagi
                                        </button>
                                        <p className="text-xs text-slate-600 text-center italic">
                                            Yunits and Assessments for this Bahagi will appear here after being created.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-slate-400 font-bold mb-6">No Bahagi yet</p>
                        <p className="text-sm text-slate-500 mb-6">Click the "Add Bahagi" button above to create the first lesson section for this class.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
