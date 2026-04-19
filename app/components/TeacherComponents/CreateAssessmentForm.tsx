'use client';

import React, { useState } from 'react';

interface CreateAssessmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    bahagiId: number;
    bahagiTitle: string;
    isLoading?: boolean;
}

const QUESTION_TYPES = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'checkbox', label: 'Checkbox (Multiple answers)' },
    { value: 'media-audio', label: 'Audio Recording' },
    { value: 'scramble', label: 'Scramble Word' },
    { value: 'matching', label: 'Matching Pairs' }
];

export const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bahagiId,
    bahagiTitle,
    isLoading = false
}) => {
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [questions, setQuestions] = useState<any[]>([
        { 
            type: 'multiple-choice',
            question: '', 
            questionMedia: null,
            options: [
                { text: '', media: null },
                { text: '', media: null },
                { text: '', media: null },
                { text: '', media: null }
            ], 
            correctAnswer: 0,
            xp: '10',
            coins: '5'
        }
    ]);

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            type: 'multiple-choice',
            question: '',
            questionMedia: null,
            options: [
                { text: '', media: null },
                { text: '', media: null },
                { text: '', media: null },
                { text: '', media: null }
            ],
            correctAnswer: 0,
            xp: '10',
            coins: '5'
        }]);
    };

    const handleRemoveQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleUpdateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const handleUpdateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex][field] = value;
        setQuestions(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter an assessment title');
            return;
        }

        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        // Use the first question's type as the assessment type
        const assessmentType = questions[0].type;

        const data = {
            bahagiId,
            title,
            type: assessmentType,
            instructions,
            questions: questions.map(q => {
                const mapped: any = {
                    ...q,
                    xp: parseInt(q.xp),
                    coins: parseInt(q.coins)
                };
                // For scramble questions, store the correct word order as correctAnswer
                if (q.type === 'scramble' && q.scrambleWords?.length) {
                    mapped.correctAnswer = q.scrambleWords
                        .map((w: any) => (typeof w === 'string' ? w : w.text || '').trim())
                        .filter((t: string) => t.length > 0);
                }
                return mapped;
            })
        };

        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Assessment</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Add a new assessment/misyon to this lesson</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Assessment Details - Simplified */}
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

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instructions</label>
                            <textarea
                                rows={3}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Explain what students need to do in this assessment..."
                                className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all resize-none placeholder:text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Questions with Per-Question Settings */}
                    <div className="space-y-4 border-t border-slate-800 pt-6 relative">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-white">Questions</h3>
                        </div>

                        {questions.map((question, qIdx) => (
                            <div key={qIdx} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                {/* Question Header with Type and Delete */}
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Question {qIdx + 1}</label>
                                        <select
                                            value={question.type}
                                            onChange={(e) => handleUpdateQuestion(qIdx, 'type', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg text-sm font-bold focus:border-brand-purple outline-none cursor-pointer"
                                        >
                                            {QUESTION_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(qIdx)}
                                            className="text-rose-500 hover:text-rose-600 text-sm ml-4 mt-6"
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>

                                {/* Question Text */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Question Text</label>
                                    <input
                                        type="text"
                                        value={question.question}
                                        onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                                        placeholder="Enter your question..."
                                        className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:border-brand-purple outline-none"
                                    />
                                </div>

                                {/* Question Media */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">📎 Question Media (Image/Audio)</label>
                                    <input
                                        type="file"
                                        accept="image/*,audio/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    handleUpdateQuestion(qIdx, 'questionMedia', {
                                                        name: file.name,
                                                        type: file.type,
                                                        size: file.size,
                                                        preview: event.target?.result as string
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple/80"
                                    />
                                    {question.questionMedia && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-200 font-semibold">📦 Preview:</p>
                                            {question.questionMedia.type?.startsWith('image') ? (
                                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 w-fit">
                                                    <img src={question.questionMedia.preview} alt="Question preview" className="h-32 w-auto rounded object-cover" />
                                                    <p className="text-[8px] text-slate-400 mt-2 font-semibold">{question.questionMedia.name}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2 w-fit">
                                                    <audio controls className="h-8 w-64">
                                                        <source src={question.questionMedia.preview} type={question.questionMedia.type} />
                                                    </audio>
                                                    <p className="text-[8px] text-slate-400 font-semibold">{question.questionMedia.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Options for Multiple Choice, Checkbox */}
                                {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Options</label>
                                        {question.options.map((option: any, oIdx: number) => (
                                            <div key={oIdx} className="space-y-2 bg-slate-900/50 p-3 rounded-lg">
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Option {oIdx + 1}</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => handleUpdateOption(qIdx, oIdx, 'text', e.target.value)}
                                                    placeholder={`Option ${oIdx + 1} text`}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/*,audio/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                handleUpdateOption(qIdx, oIdx, 'media', {
                                                                    name: file.name,
                                                                    type: file.type,
                                                                    preview: event.target?.result as string
                                                                });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-brand-sky/70 file:text-white"
                                                />
                                                {option.media && (
                                                    <div className="space-y-2">
                                                        <p className="text-[8px] text-slate-300 font-semibold">📦 Preview:</p>
                                                        {option.media.type?.startsWith('image') ? (
                                                            <div className="bg-slate-700 border border-slate-600 rounded p-2 w-fit">
                                                                <img src={option.media.preview} alt="Option preview" className="h-20 w-auto rounded object-cover" />
                                                                <p className="text-[7px] text-slate-400 mt-1 font-semibold">{option.media.name}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-700 border border-slate-600 rounded p-2 space-y-1.5 w-fit">
                                                                <audio controls className="h-6 w-40 scale-75 origin-left">
                                                                    <source src={option.media.preview} type={option.media.type} />
                                                                </audio>
                                                                <p className="text-[7px] text-slate-400 font-semibold">{option.media.name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Correct Answer for Multiple Choice/Checkbox */}
                                {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">✓ Correct Answer</label>
                                        <select
                                            value={question.correctAnswer}
                                            onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', parseInt(e.target.value))}
                                            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg text-xs focus:border-brand-purple outline-none cursor-pointer"
                                        >
                                            {question.options.map((_: any, oIdx: number) => (
                                                <option key={oIdx} value={oIdx}>Option {oIdx + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Short Answer Media */}
                                {question.type === 'short-answer' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">📎 Reference Media (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*,audio/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        handleUpdateQuestion(qIdx, 'questionMedia', {
                                                            name: file.name,
                                                            type: file.type,
                                                            preview: event.target?.result as string
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white"
                                        />
                                        {question.questionMedia && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-200 font-semibold">📦 Preview:</p>
                                                {question.questionMedia.type?.startsWith('image') ? (
                                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 w-fit">
                                                        <img src={question.questionMedia.preview} alt="Reference preview" className="h-24 w-auto rounded object-cover" />
                                                        <p className="text-[8px] text-slate-400 mt-2 font-semibold">{question.questionMedia.name}</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2 w-fit">
                                                        <audio controls className="h-8 w-64">
                                                            <source src={question.questionMedia.preview} type={question.questionMedia.type} />
                                                        </audio>
                                                        <p className="text-[8px] text-slate-400 font-semibold">{question.questionMedia.name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 pt-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">✓ Correct Answer</label>
                                            <input
                                                type="text"
                                                value={question.correctAnswer || ''}
                                                onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                                                placeholder="Enter the model/correct answer..."
                                                className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg text-xs focus:border-brand-purple outline-none"
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-500 italic">Students will type their answer (can be manually graded)</p>
                                    </div>
                                )}

                                {question.type === 'media-audio' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">🎙️ Reference Answer</label>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        handleUpdateQuestion(qIdx, 'correctAnswer', {
                                                            name: file.name,
                                                            type: file.type,
                                                            isAudio: true,
                                                            preview: event.target?.result as string
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white"
                                        />
                                        {question.correctAnswer?.name && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-200 font-semibold">📦 Preview:</p>
                                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2 w-fit">
                                                    <audio controls className="h-8 w-64">
                                                        <source src={question.correctAnswer.preview} type={question.correctAnswer.type} />
                                                    </audio>
                                                    <p className="text-[8px] text-slate-400 font-semibold">{question.correctAnswer.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[8px] text-slate-500 italic">Upload reference audio (optional - for teachers to compare with student answers)</p>
                                    </div>
                                )}

                                {question.type === 'scramble' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">📎 Question Image (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        handleUpdateQuestion(qIdx, 'questionMedia', {
                                                            name: file.name,
                                                            type: file.type,
                                                            preview: event.target?.result as string
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white"
                                        />
                                        {question.questionMedia && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-200 font-semibold">📦 Preview:</p>
                                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 w-fit">
                                                    <img src={question.questionMedia.preview} alt="Scramble image" className="h-32 w-auto rounded object-cover" />
                                                    <p className="text-[8px] text-slate-400 mt-2 font-semibold">{question.questionMedia.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 pt-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">✓ Words to Unscramble</label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {(question.scrambleWords || []).map((word: any, wIdx: number) => {
                                                    // Handle both string (legacy) and object formats
                                                    const wordObj = typeof word === 'string' ? { text: word, media: null } : (word || { text: '', media: null });
                                                    return (
                                                    <div key={wIdx} className="bg-slate-800/50 p-3 rounded space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[7px] font-black text-slate-500 uppercase">Word {wIdx + 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const words = [...(question.scrambleWords || [])];
                                                                    words.splice(wIdx, 1);
                                                                    handleUpdateQuestion(qIdx, 'scrambleWords', words);
                                                                }}
                                                                className="text-[10px] text-rose-500 hover:text-rose-600"
                                                            >
                                                                ✕ Remove
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={wordObj.text || ''}
                                                            onChange={(e) => {
                                                                const words = [...(question.scrambleWords || [])];
                                                                if (typeof words[wIdx] === 'string') {
                                                                    words[wIdx] = { text: e.target.value, media: null };
                                                                } else {
                                                                    words[wIdx].text = e.target.value;
                                                                }
                                                                handleUpdateQuestion(qIdx, 'scrambleWords', words);
                                                            }}
                                                            placeholder="Enter word to scramble"
                                                            className="w-full bg-slate-700 border border-slate-600 text-white px-2 py-1 rounded text-[10px] focus:border-brand-purple outline-none"
                                                        />
                                                        <input
                                                            type="file"
                                                            accept="image/*,audio/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        const words = [...(question.scrambleWords || [])];
                                                                        if (typeof words[wIdx] === 'string') {
                                                                            words[wIdx] = { text: words[wIdx], media: null };
                                                                        }
                                                                        words[wIdx].media = {
                                                                            name: file.name,
                                                                            type: file.type,
                                                                            preview: event.target?.result as string
                                                                        };
                                                                        handleUpdateQuestion(qIdx, 'scrambleWords', words);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="w-full bg-slate-700 border border-slate-600 text-slate-400 px-2 py-1 rounded text-[9px] file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[8px] file:font-semibold file:bg-brand-sky/70 file:text-white"
                                                        />
                                                        {wordObj.media && (
                                                            <div className="space-y-1">
                                                                <p className="text-[7px] text-slate-400 font-semibold">📦 Preview:</p>
                                                                {wordObj.media.type?.startsWith('image') ? (
                                                                    <img src={wordObj.media.preview} alt="Word item" className="h-12 w-auto rounded object-cover" />
                                                                ) : (
                                                                    <audio controls className="h-5 w-32 scale-75 origin-left">
                                                                        <source src={wordObj.media.preview} type={wordObj.media.type} />
                                                                    </audio>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>);
                                                })}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const words = [...(question.scrambleWords || []), { text: '', media: null }];
                                                    handleUpdateQuestion(qIdx, 'scrambleWords', words);
                                                }}
                                                className="text-[9px] font-black text-brand-sky px-3 py-2 rounded border border-brand-sky/30 hover:bg-brand-sky/10"
                                            >
                                                + Add Word
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {question.type === 'matching' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">📋 Matching Pairs</label>
                                        {!question.options && setQuestions(questions.map((q, idx) => idx === qIdx ? { ...q, options: [{ text: '', media: null, match: '', matchMedia: null }, { text: '', media: null, match: '', matchMedia: null }, { text: '', media: null, match: '', matchMedia: null }] } : q))}
                                        {(question.options || []).map((option: any, oIdx: number) => (
                                            <div key={oIdx} className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Pair {oIdx + 1}</span>
                                                
                                                {/* Left Item */}
                                                <div className="bg-slate-800/50 p-3 rounded space-y-2">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase">Left Item (Match From)</p>
                                                    <input
                                                        type="text"
                                                        value={option.text}
                                                        onChange={(e) => handleUpdateOption(qIdx, oIdx, 'text', e.target.value)}
                                                        placeholder="Text for left item"
                                                        className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                                    />
                                                    <input
                                                        type="file"
                                                        accept="image/*,audio/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    handleUpdateOption(qIdx, oIdx, 'media', {
                                                                        name: file.name,
                                                                        type: file.type,
                                                                        preview: event.target?.result as string
                                                                    });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        className="w-full bg-slate-700 border border-slate-600 text-slate-400 px-3 py-2 rounded-lg text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-brand-sky/70 file:text-white"
                                                    />
                                                    {option.media && (
                                                        <div className="space-y-1">
                                                            <p className="text-[7px] text-slate-400 font-semibold">📦 Preview:</p>
                                                            {option.media.type?.startsWith('image') ? (
                                                                <img src={option.media.preview} alt="Left item" className="h-16 w-auto rounded object-cover" />
                                                            ) : (
                                                                <audio controls className="h-6 w-40 scale-75 origin-left">
                                                                    <source src={option.media.preview} type={option.media.type} />
                                                                </audio>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Item */}
                                                <div className="bg-slate-800/50 p-3 rounded space-y-2">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase">Right Item (Correct Match)</p>
                                                    <input
                                                        type="text"
                                                        value={option.match || ''}
                                                        onChange={(e) => handleUpdateOption(qIdx, oIdx, 'match', e.target.value)}
                                                        placeholder="Text for right item"
                                                        className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                                    />
                                                    <input
                                                        type="file"
                                                        accept="image/*,audio/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    handleUpdateOption(qIdx, oIdx, 'matchMedia', {
                                                                        name: file.name,
                                                                        type: file.type,
                                                                        preview: event.target?.result as string
                                                                    });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        className="w-full bg-slate-700 border border-slate-600 text-slate-400 px-3 py-2 rounded-lg text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-brand-sky/70 file:text-white"
                                                    />
                                                    {option.matchMedia && (
                                                        <div className="space-y-1">
                                                            <p className="text-[7px] text-slate-400 font-semibold">📦 Preview:</p>
                                                            {option.matchMedia.type?.startsWith('image') ? (
                                                                <img src={option.matchMedia.preview} alt="Right item" className="h-16 w-auto rounded object-cover" />
                                                            ) : (
                                                                <audio controls className="h-6 w-40 scale-75 origin-left">
                                                                    <source src={option.matchMedia.preview} type={option.matchMedia.type} />
                                                                </audio>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {question.type === 'checkbox' && (
                                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">✓ Correct Answers (Multiple)</label>
                                        <p className="text-[8px] text-slate-500 mb-2">Select all correct options below</p>
                                        <div className="space-y-2">
                                            {question.options?.map((option: any, oIdx: number) => (
                                                <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(oIdx) : false}
                                                        onChange={(e) => {
                                                            const current = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                                            const updated = e.target.checked
                                                                ? [...current, oIdx]
                                                                : current.filter((idx: number) => idx !== oIdx);
                                                            handleUpdateQuestion(qIdx, 'correctAnswer', updated);
                                                        }}
                                                        className="w-4 h-4 accent-brand-purple"
                                                    />
                                                    <span className="text-[8px] text-slate-400">{option.text || `Option ${oIdx + 1}`}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reward Section */}
                                <div className="space-y-3 pt-4 border-t border-slate-700">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">🎁 Rewards for this Question</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">⭐ XP Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={question.xp}
                                                onChange={(e) => handleUpdateQuestion(qIdx, 'xp', e.target.value)}
                                                className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-lg text-sm focus:border-brand-purple outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">🪙 Coins</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={question.coins}
                                                onChange={(e) => handleUpdateQuestion(qIdx, 'coins', e.target.value)}
                                                className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-lg text-sm focus:border-brand-purple outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Floating Add Question Button - Inside Dialog, Bottom */}
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="sticky bottom-0 right-4 mt-6 mb-4 text-xs font-black text-brand-sky px-4 py-3 rounded-lg border border-brand-sky/30 bg-slate-900 hover:bg-brand-sky/10 transition-all uppercase tracking-widest shadow-lg hover:shadow-2xl z-30 w-fit ml-auto block"
                        >
                            + Add Question
                        </button>
                    </div>

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
