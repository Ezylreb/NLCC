'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Trash2, Plus, Upload, Music, Image as ImageIcon, 
    ChevronDown, ChevronUp, Save, Loader
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface MediaFile {
    id?: string;
    fileName?: string;
    fileType: 'image' | 'audio';
    url: string;
}

interface Option {
    id?: string;
    option_text: string;
    is_correct: boolean;
    option_order: number;
    image_url?: string;
    audio_url?: string;
}

interface Question {
    id?: string;
    question_text: string;
    question_type: string;
    question_order: number;
    instructions?: string;
    correct_answer?: string;
    image_url?: string;
    audio_url?: string;
    options?: Option[];
}

interface Assessment {
    id: string;
    title: string;
    type: string;
    instructions?: string;
    reward: number;
}

interface EditAssessmentV2FormProps {
    assessmentId: string;
    onClose: () => void;
    onSuccess?: () => void;
    userId: string;
}

export const EditAssessmentV2Form: React.FC<EditAssessmentV2FormProps> = ({
    assessmentId,
    onClose,
    onSuccess,
    userId
}) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string>('');

    // Load assessment data
    useEffect(() => {
        const loadAssessment = async () => {
            try {
                const response = await apiClient.assessment.fetchById(Number(assessmentId));
                if (response.success && response.data) {
                    setAssessment(response.data);
                    setQuestions(response.data.questions || []);
                } else {
                    throw new Error(response.error || 'Failed to load assessment');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load assessment');
            } finally {
                setLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId]);

    const handleAssessmentChange = (field: string, value: any) => {
        setAssessment(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleQuestionChange = (qIndex: number, field: string, value: any) => {
        const newQuestions = [...questions];
        newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => {
        const newQuestions = [...questions];
        if (!newQuestions[qIndex].options) newQuestions[qIndex].options = [];
        newQuestions[qIndex].options![oIndex] = {
            ...newQuestions[qIndex].options![oIndex],
            [field]: value
        };
        setQuestions(newQuestions);
    };

    const handleMediaUpload = async (
        file: File,
        fileType: 'image' | 'audio',
        qIndex: number,
        oIndex?: number
    ) => {
        try {
            const result = await apiClient.upload.uploadFile(file, fileType);

            if (result.success) {
                const uploadedUrl = result.data?.url || result.data?.path || result.data?.file_url;
                if (oIndex !== undefined) {
                    // Update option media
                    handleOptionChange(qIndex, oIndex, 
                        fileType === 'image' ? 'image_url' : 'audio_url', 
                        uploadedUrl
                    );
                } else {
                    // Update question media
                    handleQuestionChange(qIndex, 
                        fileType === 'image' ? 'image_url' : 'audio_url', 
                        uploadedUrl
                    );
                }
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            question_text: '',
            question_type: 'multiple-choice',
            question_order: questions.length,
            options: [
                { option_text: '', is_correct: false, option_order: 0 },
            ]
        };
        setQuestions([...questions, newQuestion]);
        setExpandedQuestions(new Set([...expandedQuestions, questions.length]));
    };

    const deleteQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        const reordered = newQuestions.map((q, i) => ({ ...q, question_order: i }));
        setQuestions(reordered);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        if (!newQuestions[qIndex].options) newQuestions[qIndex].options = [];
        newQuestions[qIndex].options!.push({
            option_text: '',
            is_correct: false,
            option_order: (newQuestions[qIndex].options?.length || 0)
        });
        setQuestions(newQuestions);
    };

    const deleteOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options?.filter((_, i) => i !== oIndex) || [];
        const reordered = newQuestions[qIndex].options!.map((o, i) => ({ ...o, option_order: i }));
        newQuestions[qIndex].options = reordered;
        setQuestions(newQuestions);
    };

    const toggleQuestion = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    const handleSave = async () => {
        if (!assessment) return;
        setSaving(true);
        try {
            const response = await apiClient.assessment.update(Number(assessmentId), {
                title: assessment.title,
                description: assessment.instructions,
                total_questions: questions.length,
                questions
            });

            if (!response.success) throw new Error(response.error || 'Save failed');
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
                <div className="bg-white rounded-lg p-8 flex items-center gap-3">
                    <Loader className="animate-spin" />
                    <span>Loading assessment...</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Edit Assessment</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Assessment Details */}
                    {assessment && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-lg">Assessment Details</h3>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={assessment.title}
                                    onChange={e => handleAssessmentChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Type</label>
                                    <select
                                        value={assessment.type}
                                        onChange={e => handleAssessmentChange('type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="multiple-choice">Multiple Choice</option>
                                        <option value="short-answer">Short Answer</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="media-audio">Audio</option>
                                        <option value="scramble">Scramble</option>
                                        <option value="matching">Matching</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Reward (XP)</label>
                                    <input
                                        type="number"
                                        value={assessment.reward}
                                        onChange={e => handleAssessmentChange('reward', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Instructions</label>
                                <textarea
                                    value={assessment.instructions || ''}
                                    onChange={e => handleAssessmentChange('instructions', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="Instructions for students..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Questions ({questions.length})</h3>
                            <button
                                onClick={addQuestion}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                <Plus size={18} />
                                Add Question
                            </button>
                        </div>

                        <AnimatePresence>
                            {questions.map((question, qIndex) => (
                                <motion.div
                                    key={qIndex}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="border border-gray-300 rounded-lg overflow-hidden"
                                >
                                    {/* Question Header */}
                                    <button
                                        onClick={() => toggleQuestion(qIndex)}
                                        className="w-full p-4 bg-blue-50 hover:bg-blue-100 flex justify-between items-center transition"
                                    >
                                        <span className="font-medium text-left">
                                            Question {qIndex + 1}: {question.question_text.substring(0, 50)}...
                                        </span>
                                        {expandedQuestions.has(qIndex) ? (
                                            <ChevronUp size={20} />
                                        ) : (
                                            <ChevronDown size={20} />
                                        )}
                                    </button>

                                    {/* Question Details */}
                                    {expandedQuestions.has(qIndex) && (
                                        <div className="p-4 space-y-4 bg-white border-t border-gray-300">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Question Text *</label>
                                                <textarea
                                                    value={question.question_text}
                                                    onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Question Type</label>
                                                    <select
                                                        value={question.question_type}
                                                        onChange={e => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="multiple-choice">Multiple Choice</option>
                                                        <option value="short-answer">Short Answer</option>
                                                        <option value="checkbox">Checkbox</option>
                                                        <option value="media-audio">Audio</option>
                                                        <option value="scramble">Scramble</option>
                                                        <option value="matching">Matching</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Correct Answer</label>
                                                    <input
                                                        type="text"
                                                        value={question.correct_answer || ''}
                                                        onChange={e => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="For short-answer questions"
                                                    />
                                                </div>
                                            </div>

                                            {/* Question Media */}
                                            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                        <ImageIcon size={16} /> Question Image
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => {
                                                                    if (e.target.files?.[0]) {
                                                                        handleMediaUpload(e.target.files[0], 'image', qIndex);
                                                                    }
                                                                }}
                                                                className="hidden"
                                                            />
                                                            <span className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
                                                                <Upload size={16} /> Upload
                                                            </span>
                                                        </label>
                                                        {question.image_url && (
                                                            <span className="text-sm text-green-600">✓ Image added</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                        <Music size={16} /> Question Audio
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="audio/*"
                                                                onChange={e => {
                                                                    if (e.target.files?.[0]) {
                                                                        handleMediaUpload(e.target.files[0], 'audio', qIndex);
                                                                    }
                                                                }}
                                                                className="hidden"
                                                            />
                                                            <span className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
                                                                <Upload size={16} /> Upload
                                                            </span>
                                                        </label>
                                                        {question.audio_url && (
                                                            <span className="text-sm text-green-600">✓ Audio added</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options for Multiple Choice */}
                                            {['multiple-choice', 'checkbox'].includes(question.question_type) && (
                                                <div className="space-y-3 pt-4 border-t border-gray-300">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium">Answer Options</h4>
                                                        <button
                                                            onClick={() => addOption(qIndex)}
                                                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition flex items-center gap-1"
                                                        >
                                                            <Plus size={14} /> Add Option
                                                        </button>
                                                    </div>

                                                    {question.options?.map((option, oIndex) => (
                                                        <motion.div
                                                            key={oIndex}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            className="p-3 bg-gray-50 rounded-lg space-y-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        checked={option.is_correct}
                                                                        onChange={() => {
                                                                            const newOptions = question.options!.map((o, i) => ({
                                                                                ...o,
                                                                                is_correct: i === oIndex
                                                                            }));
                                                                            handleQuestionChange(qIndex, 'options', newOptions);
                                                                        }}
                                                                        className="w-4 h-4"
                                                                    />
                                                                    <span className="text-sm font-medium">Correct Answer</span>
                                                                </label>
                                                                <button
                                                                    onClick={() => deleteOption(qIndex, oIndex)}
                                                                    className="ml-auto text-red-600 hover:text-red-700 transition"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>

                                                            <textarea
                                                                value={option.option_text}
                                                                onChange={e => handleOptionChange(qIndex, oIndex, 'option_text', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Option text"
                                                            />

                                                            {/* Option Media */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <label className="flex items-center gap-2 cursor-pointer text-sm bg-blue-50 p-2 rounded hover:bg-blue-100 transition">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={e => {
                                                                            if (e.target.files?.[0]) {
                                                                                handleMediaUpload(e.target.files[0], 'image', qIndex, oIndex);
                                                                            }
                                                                        }}
                                                                        className="hidden"
                                                                    />
                                                                    <ImageIcon size={14} />
                                                                    {option.image_url ? 'Change Image' : 'Add Image'}
                                                                </label>

                                                                <label className="flex items-center gap-2 cursor-pointer text-sm bg-blue-50 p-2 rounded hover:bg-blue-100 transition">
                                                                    <input
                                                                        type="file"
                                                                        accept="audio/*"
                                                                        onChange={e => {
                                                                            if (e.target.files?.[0]) {
                                                                                handleMediaUpload(e.target.files[0], 'audio', qIndex, oIndex);
                                                                            }
                                                                        }}
                                                                        className="hidden"
                                                                    />
                                                                    <Music size={14} />
                                                                    {option.audio_url ? 'Change Audio' : 'Add Audio'}
                                                                </label>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Delete Question */}
                                            <button
                                                onClick={() => deleteQuestion(qIndex)}
                                                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={18} />
                                                Delete Question
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
