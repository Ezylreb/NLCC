'use client';

import React, { useState } from 'react';

interface ClassDetailPageProps {
    classId: string;
    className: string;
    onBack: () => void;
    onCreateLesson: () => void;
    onCreateYunit: (lessonId: string) => void;
    onCreateAssessment: (lessonId: string) => void;
    onEditLesson?: (lessonId: string) => void;
    onEditYunit?: (lessonId: string, yunitId: string) => void;
    onEditAssessment?: (lessonId: string, assessmentId: string) => void;
    onDeleteYunit?: (lessonId: string, yunitId: string) => void;
    onDeleteAssessment?: (lessonId: string, assessmentId: string) => void;
    lessons: any[];
    onDeleteLesson: (lessonId: string) => void;
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({
    classId,
    className,
    onBack,
    onCreateLesson,
    onCreateYunit,
    onCreateAssessment,
    onEditLesson,
    onEditYunit,
    onEditAssessment,
    onDeleteYunit,
    onDeleteAssessment,
    lessons,
    onDeleteLesson
}) => {
    const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

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
                    onClick={onCreateLesson}
                    className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                    <span>📚</span> Create Lesson
                </button>
                <button
                    disabled
                    className="bg-brand-sky/30 text-brand-sky px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                    title="Coming soon"
                >
                    <span>⭐</span> Add Rewards
                </button>
            </div>

            {/* Lessons Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white">Lessons & Assessments</h3>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                        {lessons.length} Lesson{lessons.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {lessons.length > 0 ? (
                    <div className="space-y-4">
                        {lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="bg-slate-900/50 border border-slate-800/50 rounded-4xl overflow-hidden group hover:border-brand-purple/30 transition-all"
                            >
                                {/* Lesson Header */}
                                <button
                                    onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4 text-left flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700 group-hover:border-brand-purple/30 transition-all">
                                            {lesson.icon || '📚'}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-black text-white group-hover:text-brand-purple transition-colors">
                                                {lesson.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 font-bold mt-1">{lesson.description}</p>
                                            <div className="flex gap-4 mt-3">
                                                <span className="text-[10px] font-black text-brand-sky uppercase tracking-wider">
                                                    📌 {lesson.yunits?.length || 0} Yunits
                                                </span>
                                                <span className="text-[10px] font-black text-brand-purple uppercase tracking-wider">
                                                    🎯 {lesson.assessments?.length || 0} Assessments
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-2xl transition-transform" style={{
                                        transform: expandedLessonId === lesson.id ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}>
                                        ▼
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {expandedLessonId === lesson.id && (
                                    <div className="border-t border-slate-800/50 bg-slate-950/50 p-6 space-y-6">
                                        {/* Yunits Section */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-lg font-black text-white flex items-center gap-2">
                                                    <span>📌</span> Yunits
                                                </h5>
                                                <button
                                                    onClick={() => onCreateYunit(lesson.id)}
                                                    className="text-xs font-black text-brand-sky hover:text-white uppercase tracking-widest px-4 py-2 rounded-lg border border-brand-sky/30 hover:bg-brand-sky/10 transition-all"
                                                >
                                                    + Add Yunit
                                                </button>
                                            </div>
                                            {lesson.yunits && lesson.yunits.length > 0 ? (
                                                <div className="space-y-3">
                                                    {lesson.yunits.map((yunit: any, idx: number) => (
                                                        <div key={idx} className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-black text-white">{yunit.title}</p>
                                                                <p className="text-xs text-slate-500 mt-1">{yunit.content?.substring(0, 60)}...</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => onEditYunit?.(lesson.id, yunit.id || idx)}
                                                                    className="text-slate-500 hover:text-brand-sky transition-colors"
                                                                    title="Edit yunit"
                                                                >
                                                                    ✎
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Delete "${yunit.title}"?`)) {
                                                                            onDeleteYunit?.(lesson.id, yunit.id || idx);
                                                                        }
                                                                    }}
                                                                    className="text-slate-500 hover:text-rose-500 transition-colors"
                                                                    title="Delete yunit"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No yunits yet. Click "+ Add Yunit" to create one.</p>
                                            )}
                                        </div>

                                        {/* Assessments Section */}
                                        <div className="flex flex-col gap-4 border-t border-slate-800/50 pt-6">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-lg font-black text-white flex items-center gap-2">
                                                    <span>🎯</span> Assessments
                                                </h5>
                                                <button
                                                    onClick={() => onCreateAssessment(lesson.id)}
                                                    className="text-xs font-black text-brand-purple hover:text-white uppercase tracking-widest px-4 py-2 rounded-lg border border-brand-purple/30 hover:bg-brand-purple/10 transition-all"
                                                >
                                                    + Add Assessment
                                                </button>
                                            </div>
                                            {lesson.assessments && lesson.assessments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {lesson.assessments.map((assessment: any, idx: number) => (
                                                        <div key={idx} className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-black text-white">{assessment.title}</p>
                                                                    <span className="text-[9px] font-black text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                        {assessment.type}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">{assessment.instructions?.substring(0, 60) || 'No description'}...</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => onEditAssessment?.(lesson.id, assessment.id || idx)}
                                                                    className="text-slate-500 hover:text-brand-purple transition-colors"
                                                                    title="Edit assessment"
                                                                >
                                                                    ✎
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Delete "${assessment.title}"?`)) {
                                                                            onDeleteAssessment?.(lesson.id, assessment.id || idx);
                                                                        }
                                                                    }}
                                                                    className="text-slate-500 hover:text-rose-500 transition-colors"
                                                                    title="Delete assessment"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No assessments yet. Click "+ Add Assessment" to create one.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Edit/Delete Buttons */}
                                <div className="border-t border-slate-800/50 bg-slate-950/70 px-6 py-3 flex gap-2 justify-end">
                                    <button
                                        onClick={() => onEditLesson?.(lesson.id)}
                                        className="px-4 py-2 text-xs font-black text-slate-400 hover:text-brand-sky uppercase tracking-widest transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete "${lesson.title}"?`)) {
                                                onDeleteLesson(lesson.id);
                                            }
                                        }}
                                        className="px-4 py-2 text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                        <span className="text-5xl mb-4">📭</span>
                        <h4 className="text-xl font-black text-white">No Lessons Yet</h4>
                        <p className="text-slate-500 font-bold text-sm max-w-xs mt-2">Click "Create Lesson" to start building curriculum for this class!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
