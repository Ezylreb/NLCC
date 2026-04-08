'use client';

import React, { useState } from 'react';

interface TeacherClassesPageProps {
    classes: any[];
    onOpenClass: (classId: string) => void;
    onCreateClass: (className: string) => void;
    onArchiveClass: (classId: string) => void;
}

export const TeacherClassesPage: React.FC<TeacherClassesPageProps> = ({
    classes,
    onOpenClass,
    onCreateClass,
    onArchiveClass
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateClass = async () => {
        if (!newClassName.trim()) {
            alert('Please enter a class name');
            return;
        }
        setIsCreating(true);
        try {
            onCreateClass(newClassName);
            setNewClassName('');
            setShowCreateModal(false);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-3xl font-black text-white">My Classes</h3>
                    <p className="text-slate-500 font-bold text-sm mt-2">Manage your classrooms and student groups</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-brand-purple hover:bg-brand-purple/80 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                >
                    + Add Class
                </button>
            </div>

            {/* Classes Grid */}
            {classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            className="bg-slate-900/50 border-t-4 border-slate-800 border-x border-b border-slate-800/50 rounded-[2rem] p-8 flex flex-col group hover:border-brand-purple/30 hover:bg-slate-900/80 transition-all relative overflow-hidden"
                        >
                            {/* Hover Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-purple/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            {/* Class Header */}
                            <div className="relative z-10 mb-6">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                                    {cls.is_archived ? '🔒 Archived' : '✓ Active'}
                                </span>
                                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-brand-purple transition-colors">
                                    {cls.name}
                                </h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wide">Class ID: {cls.id.slice(0, 8)}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col gap-3 mb-8 relative z-10">
                                <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Students Enrolled</span>
                                    <span className="text-lg font-black text-brand-sky">{cls.student_count || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Lessons</span>
                                    <span className="text-lg font-black text-brand-purple">{cls.lesson_count || 0}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-auto relative z-10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syllabus Completion</span>
                                    <span className="text-xs font-black text-brand-purple">{cls.progress || 0}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-purple to-brand-sky rounded-full transition-all duration-500"
                                        style={{ width: `${cls.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6 relative z-10">
                                <button
                                    onClick={() => onOpenClass(cls.id)}
                                    className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Open Class
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Archive "${cls.name}"?`)) {
                                            onArchiveClass(cls.id);
                                        }
                                    }}
                                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                    title="Archive this class"
                                >
                                    📦
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-6xl mb-4">📭</span>
                    <h4 className="text-2xl font-black text-white">No Classes Yet</h4>
                    <p className="text-slate-500 text-sm font-bold max-w-xs mt-3">Create your first class to start organizing your lessons and students!</p>
                </div>
            )}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create New Class</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Set up a classroom for your students</p>

                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Kinder 1, Grade 1A, etc."
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateClass}
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-70"
                                >
                                    {isCreating ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
