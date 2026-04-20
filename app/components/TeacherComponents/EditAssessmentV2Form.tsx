'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface MediaPreview {
    name: string;
    type: string;
    preview: string;
    size?: number;
    isExisting?: boolean;
}

interface EditorOption {
    text: string;
    media: MediaPreview | null;
    match?: string;
    matchMedia?: MediaPreview | null;
}

interface EditorQuestion {
    type: string;
    question: string;
    questionMedia: MediaPreview | null;
    options: EditorOption[];
    correctAnswer: any;
    xp: string;
    coins: string;
    scrambleWords?: Array<string | { text: string; media: MediaPreview | null }>;
}

interface EditAssessmentV2FormProps {
    assessmentId: string;
    onClose: () => void;
    onSuccess?: () => void;
    userId: string;
    initialAssessment?: any;
}

const QUESTION_TYPES = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'checkbox', label: 'Checkbox (Multiple answers)' },
    { value: 'media-audio', label: 'Audio Recording' },
    { value: 'scramble', label: 'Scramble Word' },
    { value: 'matching', label: 'Matching Pairs' }
];

const defaultOption = (): EditorOption => ({ text: '', media: null });

const defaultQuestion = (): EditorQuestion => ({
    type: 'multiple-choice',
    question: '',
    questionMedia: null,
    options: [defaultOption(), defaultOption(), defaultOption(), defaultOption()],
    correctAnswer: 0,
    xp: '10',
    coins: '5'
});

const mapStoredTypeToEditor = (type?: string) => {
    if (type === 'audio') return 'media-audio';
    if (type === 'scramble-word') return 'scramble';
    return type || 'multiple-choice';
};

const toMediaPreview = (value: any, fallbackName: string): MediaPreview | null => {
    if (!value) return null;

    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        const type = lower.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/)
            ? 'image/existing'
            : 'audio/existing';
        return {
            name: fallbackName,
            type,
            preview: value,
            isExisting: true,
        };
    }

    if (typeof value === 'object' && typeof value.preview === 'string') {
        return {
            name: value.name || fallbackName,
            type: value.type || 'application/octet-stream',
            preview: value.preview,
            size: value.size,
            isExisting: value.isExisting,
        };
    }

    return null;
};

const normalizeOptions = (question: any): EditorOption[] => {
    const options = Array.isArray(question?.options) ? question.options : [];

    if (options.length === 0 && ['multiple-choice', 'checkbox'].includes(mapStoredTypeToEditor(question?.type || question?.question_type))) {
        return [defaultOption(), defaultOption(), defaultOption(), defaultOption()];
    }

    return options.map((option: any) => ({
        text: option?.text ?? option?.option_text ?? '',
        media: toMediaPreview(option?.media ?? option?.image_url ?? option?.audio_url, 'Existing option media'),
        match: option?.match ?? '',
        matchMedia: toMediaPreview(option?.matchMedia, 'Existing match media'),
    }));
};

const normalizeCorrectAnswer = (question: any, options: EditorOption[]) => {
    const type = mapStoredTypeToEditor(question?.type || question?.question_type);

    if (type === 'checkbox') {
        if (Array.isArray(question?.correctAnswer)) return question.correctAnswer;
        if (Array.isArray(question?.correct_answer)) return question.correct_answer;
        return Array.isArray(question?.options)
            ? question.options
                .map((option: any, index: number) => option?.is_correct ? index : -1)
                .filter((index: number) => index >= 0)
            : [];
    }

    if (type === 'multiple-choice') {
        if (typeof question?.correctAnswer === 'number') return question.correctAnswer;

        const correctText = question?.correct_answer;
        if (typeof correctText === 'string' && correctText.trim()) {
            const index = options.findIndex((option) => option.text === correctText);
            if (index >= 0) return index;
        }

        if (Array.isArray(question?.options)) {
            const index = question.options.findIndex((option: any) => option?.is_correct);
            if (index >= 0) return index;
        }

        return 0;
    }

    if (typeof question?.correctAnswer !== 'undefined') return question.correctAnswer;
    if (typeof question?.correct_answer !== 'undefined') return question.correct_answer;
    return '';
};

const normalizeQuestion = (question: any, assessmentPoints?: number): EditorQuestion => {
    const type = mapStoredTypeToEditor(question?.type || question?.question_type);
    const options = normalizeOptions(question);
    return {
        type,
        question: question?.question ?? question?.question_text ?? '',
        questionMedia: toMediaPreview(question?.questionMedia ?? question?.image_url ?? question?.audio_url, 'Existing question media'),
        options,
        correctAnswer: normalizeCorrectAnswer(question, options),
        xp: String(question?.xp ?? assessmentPoints ?? 10),
        coins: String(question?.coins ?? 5),
        scrambleWords: Array.isArray(question?.scrambleWords) ? question.scrambleWords : [],
    };
};

const readFileAsPreview = (file: File, callback: (preview: MediaPreview) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        callback({
            name: file.name,
            type: file.type,
            size: file.size,
            preview: event.target?.result as string,
        });
    };
    reader.readAsDataURL(file);
};

const serializeMediaPreview = (media: MediaPreview | null) => {
    if (!media) return null;

    return {
        name: media.name,
        type: media.type,
        preview: media.preview,
        isExisting: media.isExisting,
    };
};

const serializeQuestionForSave = (question: EditorQuestion) => {
    const baseQuestion: any = {
        type: question.type,
        question: question.question,
        questionMedia: serializeMediaPreview(question.questionMedia),
        correctAnswer: question.type === 'short-answer' && typeof question.correctAnswer === 'string'
            ? question.correctAnswer.trim()
            : question.correctAnswer,
        xp: parseInt(question.xp, 10) || 0,
        coins: parseInt(question.coins, 10) || 0,
    };

    if (question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'matching') {
        baseQuestion.options = question.options.map((option) => ({
            text: option.text,
            media: serializeMediaPreview(option.media),
            match: option.match,
            matchMedia: serializeMediaPreview(option.matchMedia || null),
        }));
    }

    if (question.type === 'scramble' || question.type === 'scramble-word') {
        baseQuestion.scrambleWords = Array.isArray(question.scrambleWords) ? question.scrambleWords : [];
        if (baseQuestion.scrambleWords.length) {
            baseQuestion.correctAnswer = baseQuestion.scrambleWords
                .map((word: any) => (typeof word === 'string' ? word : word.text || '').trim())
                .filter((word: string) => word.length > 0);
        }
    }

    if (question.type === 'media-audio') {
        baseQuestion.correctAnswer = question.correctAnswer;
    }

    return baseQuestion;
};

export const EditAssessmentV2Form: React.FC<EditAssessmentV2FormProps> = ({
    assessmentId,
    onClose,
    onSuccess,
    userId,
    initialAssessment,
}) => {
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [questions, setQuestions] = useState<EditorQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const applyAssessmentToForm = (assessment: any) => {
        setTitle(assessment?.title || '');
        setInstructions(assessment?.instructions || assessment?.description || '');
        setQuestions(
            Array.isArray(assessment?.questions) && assessment.questions.length > 0
                ? assessment.questions.map((question: any) => normalizeQuestion(question, assessment.points))
                : [defaultQuestion()]
        );
    };

    useEffect(() => {
        const loadAssessment = async () => {
            if (initialAssessment) {
                applyAssessmentToForm(initialAssessment);
                setLoading(false);
            }

            try {
                const response = await apiClient.assessment.fetchById(Number(assessmentId));
                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Failed to load assessment');
                }

                applyAssessmentToForm(response.data);
                setError('');
            } catch (err) {
                if (!initialAssessment) {
                    setError(err instanceof Error ? err.message : 'Failed to load assessment');
                } else {
                    console.error('Error refreshing assessment details:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId, userId, initialAssessment]);

    const handleAddQuestion = () => {
        setQuestions((prev) => [...prev, defaultQuestion()]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
    };

    const handleUpdateQuestion = (index: number, field: keyof EditorQuestion, value: any) => {
        setQuestions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleUpdateOption = (qIndex: number, oIndex: number, field: keyof EditorOption, value: any) => {
        setQuestions((prev) => {
            const updated = [...prev];
            const nextOptions = [...updated[qIndex].options];
            nextOptions[oIndex] = { ...nextOptions[oIndex], [field]: value };
            updated[qIndex] = { ...updated[qIndex], options: nextOptions };
            return updated;
        });
    };

    const handleRemoveQuestionMedia = (qIndex: number) => {
        handleUpdateQuestion(qIndex, 'questionMedia', null);
    };

    const handleRemoveOptionMedia = (qIndex: number, oIndex: number) => {
        handleUpdateOption(qIndex, oIndex, 'media', null);
    };

    const handleRemoveAudioReference = (qIndex: number) => {
        handleUpdateQuestion(qIndex, 'correctAnswer', null);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim()) {
            setError('Please enter an assessment title');
            return;
        }

        if (questions.length === 0) {
            setError('Please add at least one question');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const normalizedQuestions = questions.map(serializeQuestionForSave);
            const totalPoints = normalizedQuestions.reduce((sum, question) => sum + (Number(question.xp) || 0), 0);

            const response = await apiClient.assessment.update(Number(assessmentId), {
                title,
                description: instructions,
                instructions,
                type: normalizedQuestions[0]?.type || 'multiple-choice',
                points: totalPoints,
                total_questions: normalizedQuestions.length,
                questions: normalizedQuestions,
            }, {
                minimalResponse: true,
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to save assessment');
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save assessment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Edit Assessment</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Update this assessment using the same builder used for creation</p>

                <form onSubmit={handleSave} className="space-y-8">
                    {error && (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                            {error}
                        </div>
                    )}

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

                    <div className="space-y-4 border-t border-slate-800 pt-6 relative">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-white">Questions</h3>
                        </div>

                        {questions.map((question, qIdx) => (
                            <div key={qIdx} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Question {qIdx + 1}</label>
                                        <select
                                            value={question.type}
                                            onChange={(e) => handleUpdateQuestion(qIdx, 'type', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg text-sm font-bold focus:border-brand-purple outline-none cursor-pointer"
                                        >
                                            {QUESTION_TYPES.map((type) => (
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

                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Question Media (Image/Audio)</label>
                                    <input
                                        type="file"
                                        accept="image/*,audio/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                readFileAsPreview(file, (preview) => handleUpdateQuestion(qIdx, 'questionMedia', preview));
                                            }
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple/80"
                                    />
                                    {question.questionMedia && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs text-slate-200 font-semibold">Preview:</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveQuestionMedia(qIdx)}
                                                    className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                                                >
                                                    {question.questionMedia.isExisting ? 'Remove Existing Media' : 'Remove Media'}
                                                </button>
                                            </div>
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

                                {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Options</label>
                                        {question.options.map((option, oIdx) => (
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
                                                            readFileAsPreview(file, (preview) => handleUpdateOption(qIdx, oIdx, 'media', preview));
                                                        }
                                                    }}
                                                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-brand-sky/70 file:text-white"
                                                />
                                                {option.media && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-[8px] text-slate-300 font-semibold">Preview:</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOptionMedia(qIdx, oIdx)}
                                                                className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                                                            >
                                                                {option.media.isExisting ? 'Remove Existing Media' : 'Remove Media'}
                                                            </button>
                                                        </div>
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

                                {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Correct Answer</label>
                                        {question.type === 'checkbox' ? (
                                            <div className="space-y-2">
                                                {question.options.map((option, oIdx) => (
                                                    <label key={oIdx} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(oIdx) : false}
                                                            onChange={(e) => {
                                                                const current = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                                                const updated = e.target.checked
                                                                    ? [...current, oIdx]
                                                                    : current.filter((index: number) => index !== oIdx);
                                                                handleUpdateQuestion(qIdx, 'correctAnswer', updated);
                                                            }}
                                                            className="w-4 h-4 accent-brand-purple"
                                                        />
                                                        <span className="text-[8px] text-slate-400">{option.text || `Option ${oIdx + 1}`}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <select
                                                value={question.correctAnswer}
                                                onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', parseInt(e.target.value, 10))}
                                                className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg text-xs focus:border-brand-purple outline-none cursor-pointer"
                                            >
                                                {question.options.map((_, oIdx) => (
                                                    <option key={oIdx} value={oIdx}>Option {oIdx + 1}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {question.type === 'short-answer' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Reference Media (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*,audio/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    readFileAsPreview(file, (preview) => handleUpdateQuestion(qIdx, 'questionMedia', preview));
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white"
                                        />
                                        <div className="flex flex-col gap-2 pt-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Correct Answer</label>
                                            <input
                                                type="text"
                                                value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                                onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                                                placeholder="Enter the model/correct answer..."
                                                className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg text-xs focus:border-brand-purple outline-none"
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-500 italic">Students will type their answer.</p>
                                    </div>
                                )}

                                {question.type === 'media-audio' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Reference Answer</label>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    readFileAsPreview(file, (preview) => handleUpdateQuestion(qIdx, 'correctAnswer', preview));
                                                }
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white"
                                        />
                                        {typeof question.correctAnswer === 'object' && question.correctAnswer?.preview && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-[8px] text-slate-300 font-semibold">Preview:</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAudioReference(qIdx)}
                                                        className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                                                    >
                                                        {question.correctAnswer.isExisting ? 'Remove Existing Audio' : 'Remove Audio'}
                                                    </button>
                                                </div>
                                                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2 w-fit">
                                                    <audio controls className="h-8 w-64">
                                                        <source src={question.correctAnswer.preview} type={question.correctAnswer.type} />
                                                    </audio>
                                                    <p className="text-[8px] text-slate-400 font-semibold">{question.correctAnswer.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {question.type === 'scramble' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Words to Unscramble</label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {(question.scrambleWords || []).map((word: any, wIdx: number) => {
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
                                                                words[wIdx] = { ...wordObj, text: e.target.value };
                                                                handleUpdateQuestion(qIdx, 'scrambleWords', words);
                                                            }}
                                                            placeholder="Enter word to scramble"
                                                            className="w-full bg-slate-700 border border-slate-600 text-white px-2 py-1 rounded text-[10px] focus:border-brand-purple outline-none"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateQuestion(qIdx, 'scrambleWords', [...(question.scrambleWords || []), { text: '', media: null }])}
                                            className="text-[9px] font-black text-brand-sky px-3 py-2 rounded border border-brand-sky/30 hover:bg-brand-sky/10"
                                        >
                                            + Add Word
                                        </button>
                                    </div>
                                )}

                                {question.type === 'matching' && (
                                    <div className="space-y-3 pt-3 border-t border-slate-700">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Matching Pairs</label>
                                        {(question.options || []).map((option, oIdx) => (
                                            <div key={oIdx} className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Pair {oIdx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => handleUpdateOption(qIdx, oIdx, 'text', e.target.value)}
                                                    placeholder="Text for left item"
                                                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={option.match || ''}
                                                    onChange={(e) => handleUpdateOption(qIdx, oIdx, 'match', e.target.value)}
                                                    placeholder="Text for right item"
                                                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:border-brand-purple outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t border-slate-700">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Rewards for this Question</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">XP Points</label>
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
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Coins</label>
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

                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="sticky bottom-0 right-4 mt-6 mb-4 text-xs font-black text-brand-sky px-4 py-3 rounded-lg border border-brand-sky/30 bg-slate-900 hover:bg-brand-sky/10 transition-all uppercase tracking-widest shadow-lg hover:shadow-2xl z-30 w-fit ml-auto block"
                        >
                            + Add Question
                        </button>
                    </div>

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
                            disabled={saving || loading}
                            className="flex-1 px-4 py-4 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70"
                        >
                            {saving ? 'Saving...' : '✓ Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};