'use client';

import React, { useState } from 'react';

interface Assessment {
    id: string;
    title: string;
    type: 'multiple-choice' | 'short-answer' | 'checkbox' | 'media-audio' | 'scramble' | 'matching';
    instructions: string;
    reward: number;
    questions: any[];
}

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessment: Assessment | null;
    onSubmit: (answers: any) => void;
    isLoading?: boolean;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
    isOpen,
    onClose,
    assessment,
    onSubmit,
    isLoading = false
}) => {
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});

    if (!isOpen || !assessment) return null;

    const currentQuestion = assessment.questions?.[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === (assessment.questions?.length || 1) - 1;

    const handleAnswer = (answer: any) => {
        setAnswers({
            ...answers,
            [currentQuestionIdx]: answer
        });
    };

    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(currentQuestionIdx - 1);
        }
    };

    const handleSubmit = () => {
        onSubmit({
            assessmentId: assessment.id,
            answers,
            type: assessment.type
        });
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white">{assessment.title}</h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">
                            {assessment.reward} ⭐ Stars | Type: {assessment.type.replace('-', ' ')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-2xl text-slate-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Instructions */}
                {assessment.instructions && (
                    <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-4 mb-8">
                        <p className="text-sm text-white">{assessment.instructions}</p>
                    </div>
                )}

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Question {currentQuestionIdx + 1} of {assessment.questions?.length || 1}
                        </p>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-purple to-brand-sky transition-all duration-300"
                            style={{ width: `${((currentQuestionIdx + 1) / (assessment.questions?.length || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="mb-8 space-y-6">
                    <div>
                        <h3 className="text-xl font-black text-white mb-6">{currentQuestion?.question || 'Take this assessment'}</h3>

                        {/* Multiple Choice */}
                        {assessment.type === 'multiple-choice' && currentQuestion?.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all ${
                                            answers[currentQuestionIdx] === idx
                                                ? 'bg-brand-purple/20 border-brand-purple text-white'
                                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                        <span className="mr-3">{String.fromCharCode(65 + idx)}.</span>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Short Answer */}
                        {assessment.type === 'short-answer' && (
                            <textarea
                                value={answers[currentQuestionIdx] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-purple outline-none resize-none"
                            />
                        )}

                        {/* Checkbox */}
                        {assessment.type === 'checkbox' && currentQuestion?.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option: string, idx: number) => (
                                    <label key={idx} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={(answers[currentQuestionIdx] || []).includes(idx)}
                                            onChange={(e) => {
                                                const current = answers[currentQuestionIdx] || [];
                                                if (e.target.checked) {
                                                    handleAnswer([...current, idx]);
                                                } else {
                                                    handleAnswer(current.filter((i: number) => i !== idx));
                                                }
                                            }}
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                        <span className="text-white font-bold flex-1">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Audio/Media */}
                        {assessment.type === 'media-audio' && (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                                <p className="text-slate-400 mb-4">📱 Audio recording feature would go here</p>
                                <button className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg font-bold">
                                    🎤 Start Recording
                                </button>
                            </div>
                        )}

                        {/* Scramble Word */}
                        {assessment.type === 'scramble' && (
                            <div className="space-y-4">
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                                    <p className="text-slate-400 text-sm mb-3">Unscramble this word:</p>
                                    <div className="text-3xl font-black text-brand-sky tracking-widest letter-spacing">
                                        {(currentQuestion?.scrambled || 'EXAMPLE').split('').join(' ')}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={answers[currentQuestionIdx] || ''}
                                    onChange={(e) => handleAnswer(e.target.value.toUpperCase())}
                                    placeholder="Type your answer..."
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-purple outline-none font-bold text-lg"
                                />
                            </div>
                        )}

                        {/* Matching */}
                        {assessment.type === 'matching' && currentQuestion?.pairs && (
                            <div className="space-y-3">
                                {currentQuestion.pairs.map((pair: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                                            <p className="text-white font-bold text-center">{pair.left}</p>
                                        </div>
                                        <div className="text-center text-slate-500">↔️</div>
                                        <select
                                            value={answers[currentQuestionIdx]?.[idx] || ''}
                                            onChange={(e) => {
                                                const current = answers[currentQuestionIdx] || [];
                                                current[idx] = e.target.value;
                                                handleAnswer([...current]);
                                            }}
                                            className="bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-lg focus:border-brand-purple outline-none font-bold"
                                        >
                                            <option value="">Select...</option>
                                            {pair.rightOptions?.map((option: string, optIdx: number) => (
                                                <option key={optIdx} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-6 border-t border-slate-800">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIdx === 0}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-70 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : isLastQuestion ? (
                            <>
                                <span>✅</span> Submit Assessment
                            </>
                        ) : (
                            <>
                                Next <span>→</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
