'use client';

import React, { useState } from 'react';

interface CreateLessonFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    classId: string;
    isLoading?: boolean;
}

export const CreateLessonForm: React.FC<CreateLessonFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    classId,
    isLoading = false
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Language');
    const [icon, setIcon] = useState('📚');
    const [color, setColor] = useState('bg-brand-purple');
    const [objectives, setObjectives] = useState('');

    const iconOptions = ['📚', '📖', '✏️', '🎯', '🧠', '💡', '🎓', '📝', '🔍', '📌'];
    const categoryOptions = ['Language', 'Mathematics', 'Science', 'Social Studies', 'Arts', 'Physical Education', 'Technology'];
    const colorOptions = [
        { name: 'Purple', value: 'bg-brand-purple' },
        { name: 'Sky Blue', value: 'bg-brand-sky' },
        { name: 'Emerald', value: 'bg-emerald-600' },
        { name: 'Orange', value: 'bg-orange-500' },
        { name: 'Pink', value: 'bg-pink-500' },
        { name: 'Indigo', value: 'bg-indigo-600' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !category.trim()) {
            alert('Please enter a lesson title and select a category');
            return;
        }

        const data = {
            title,
            description,
            category,
            icon,
            color,
            objectives,
            classId
        };

        onSubmit(data);
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('Language');
        setIcon('📚');
        setColor('bg-brand-purple');
        setObjectives('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create New Lesson</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">📚 Lesson/Bahagi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Lesson Title */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Lesson Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., 'Pangalan at Wika' or 'Introduction to Numbers'"
                            className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                        />
                        <p className="text-[9px] text-slate-600 ml-1">Give your lesson a clear, descriptive title</p>
                    </div>

                    {/* Icon Selection */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Lesson Icon
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {iconOptions.map((ico) => (
                                <button
                                    key={ico}
                                    type="button"
                                    onClick={() => setIcon(ico)}
                                    className={`w-full py-4 rounded-xl text-2xl font-black border-2 transition-all ${
                                        icon === ico
                                            ? 'border-brand-purple bg-brand-purple/20'
                                            : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                                    }`}
                                >
                                    {ico}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category & Color Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Category (Subject)
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all cursor-pointer"
                            >
                                {categoryOptions.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[9px] text-slate-600 ml-1">Select the subject category for this lesson</p>
                        </div>

                        {/* Color Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Lesson Color
                            </label>
                            <div className="flex gap-2">
                                {colorOptions.map((col) => (
                                    <button
                                        key={col.value}
                                        type="button"
                                        onClick={() => setColor(col.value)}
                                        title={col.name}
                                        className={`w-12 h-12 rounded-lg border-2 transition-all ${col.value} ${
                                            color === col.value
                                                ? 'border-white scale-105'
                                                : 'border-slate-600 hover:border-slate-400'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-600 ml-1">Choose a color theme for the lesson card</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Lesson Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what students will learn in this lesson..."
                            className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-medium focus:border-brand-purple outline-none transition-all resize-none placeholder:text-slate-700 leading-relaxed"
                        />
                    </div>

                    {/* Learning Objectives */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Learning Objectives (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={objectives}
                            onChange={(e) => setObjectives(e.target.value)}
                            placeholder="List what students should be able to do after this lesson:
• Understand...
• Apply...
• Identify..."
                            className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-medium focus:border-brand-purple outline-none transition-all resize-none placeholder:text-slate-700 leading-relaxed"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-4">
                        <p className="text-xs text-slate-300">
                            <span className="font-black">💡 Tip:</span> After creating this lesson, you can add <strong>Yunits</strong> (discussion & learning materials) and <strong>Assessments/Misyon</strong> (quizzes & tasks) to build your complete curriculum.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 border-t border-slate-800 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Create Lesson
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
