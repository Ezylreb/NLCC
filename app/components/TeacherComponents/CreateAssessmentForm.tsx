'use client';

import React, { useState } from 'react';

interface CreateAssessmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    classId: string;
    lessonId: string;
    isLoading?: boolean;
}

export const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    classId,
    lessonId,
    isLoading = false
}) => {
    const [assessmentType, setAssessmentType] = useState<'multiple-choice' | 'short-answer' | 'checkbox' | 'media-audio' | 'scramble' | 'matching'>('multiple-choice');
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [reward, setReward] = useState('10');
    const [questions, setQuestions] = useState<any[]>([
        { question: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter an assessment title');
            return;
        }

        const data = {
            title,
            type: assessmentType,
            instructions,
            reward: parseInt(reward),
            classId,
            lessonId,
            questions
        };

        onSubmit(data);
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

                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Assessment</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Add a new assessment/misyon to this lesson</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white">Assessment Details</h3>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assessment Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Reading Comprehension Quiz"
                                className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assessment Type</label>
                                <select
                                    value={assessmentType}
                                    onChange={(e) => setAssessmentType(e.target.value as any)}
                                    className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all cursor-pointer"
                                >
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="short-answer">Short Answer</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="media-audio">Media Input (Audio)</option>
                                    <option value="scramble">Scramble Word</option>
                                    <option value="matching">Matching Type</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reward (Stars)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instructions</label>
                            <textarea
                                rows={3}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Explain what students need to do..."
                                className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all resize-none placeholder:text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Assessment Type Specific Fields */}
                    {(assessmentType === 'multiple-choice' || assessmentType === 'checkbox') && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-white">Questions</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
                                    }}
                                    className="text-xs font-black text-brand-sky px-4 py-2 rounded-lg border border-brand-sky/30 hover:bg-brand-sky/10 transition-all uppercase tracking-widest"
                                >
                                    + Add Question
                                </button>
                            </div>

                            {questions.map((q, qIdx) => (
                                <div key={qIdx} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Question {qIdx + 1}</label>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                                                className="text-rose-500 hover:text-rose-600 text-sm"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        value={q.question}
                                        onChange={(e) => {
                                            const updated = [...questions];
                                            updated[qIdx].question = e.target.value;
                                            setQuestions(updated);
                                        }}
                                        placeholder="Enter question text..."
                                        className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:border-brand-purple outline-none"
                                    />

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Options</label>
                                        {q.options.map((option: string, oIdx: number) => (
                                            <input
                                                key={oIdx}
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const updated = [...questions];
                                                    updated[qIdx].options[oIdx] = e.target.value;
                                                    setQuestions(updated);
                                                }}
                                                placeholder={`Option ${oIdx + 1}`}
                                                className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                            />
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Correct Answer</label>
                                        <select
                                            value={q.correctAnswer}
                                            onChange={(e) => {
                                                const updated = [...questions];
                                                updated[qIdx].correctAnswer = parseInt(e.target.value);
                                                setQuestions(updated);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg text-xs focus:border-brand-purple outline-none cursor-pointer"
                                        >
                                            {q.options.map((_: string, oIdx: number) => (
                                                <option key={oIdx} value={oIdx}>Option {oIdx + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {assessmentType === 'short-answer' && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <h3 className="text-lg font-black text-white">Question</h3>
                            <input
                                type="text"
                                value={questions[0]?.question || ''}
                                onChange={(e) => {
                                    const updated = [...questions];
                                    updated[0] = { ...updated[0], question: e.target.value };
                                    setQuestions(updated);
                                }}
                                placeholder="Enter the question..."
                                className="w-full bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none"
                            />
                            <p className="text-xs text-slate-500 italic">Students will provide their own text answer</p>
                        </div>
                    )}

                    {assessmentType === 'media-audio' && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <h3 className="text-lg font-black text-white">Audio Recording Task</h3>
                            <textarea
                                rows={3}
                                placeholder="Describe what students should record..."
                                className="w-full bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none resize-none"
                            />
                            <p className="text-xs text-slate-500 italic">Students will record and upload audio responses</p>
                        </div>
                    )}

                    {assessmentType === 'scramble' && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <h3 className="text-lg font-black text-white">Scramble Word Task</h3>
                            <input
                                type="text"
                                placeholder="Enter the word to be scrambled..."
                                className="w-full bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none"
                            />
                            <p className="text-xs text-slate-500 italic">Students will unscramble the word</p>
                        </div>
                    )}

                    {assessmentType === 'matching' && (
                        <div className="space-y-4 border-t border-slate-800 pt-6">
                            <h3 className="text-lg font-black text-white">Matching Pairs</h3>
                            <p className="text-xs text-slate-500 mb-4">Set up matching pairs for students to connect</p>
                            <div className="space-y-3">
                                {[0, 1, 2].map((idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder={`Left item ${idx + 1}`}
                                            className="bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg text-sm focus:border-brand-purple outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Right item ${idx + 1}`}
                                            className="bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg text-sm focus:border-brand-purple outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70"
                        >
                            {isLoading ? 'Creating...' : '✓ Create Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
