'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface Question {
  id?: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: any;
  questionMedia?: any;
  media?: any;
  pairs?: any[];
  scrambleWords?: any[];
}

interface Assessment {
  id: string | number;
  title: string;
  type: string;
  questions: Question[];
}

interface AssessmentScreenProps {
  studentId: string;
  yunitId: string | number;
  bahagiId: string | number;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  studentId,
  yunitId,
  bahagiId,
  onComplete,
  onBack
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.assessment.fetch({ yunit_id: Number(yunitId) });
        
        if (response.data?.assessments?.length > 0) {
          const assessmentData = response.data.assessments[0];
          setAssessment(assessmentData);
          setAnswers(new Array(assessmentData.questions?.length || 0).fill(null));
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [studentId, yunitId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">🎮</div>
          <p className="text-white">Preparing assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-white">No assessment available</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-brand-purple rounded-lg text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIdx];
  const totalQuestions = assessment.questions.length;

  const handleAnswerSelect = (answer: any) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null && selectedAnswer !== 0) {
      alert('Please select an answer');
      return;
    }

    // Check if answer is correct
    const correct = checkAnswer(currentQuestion, selectedAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    // Update answers
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = selectedAnswer;
    setAnswers(newAnswers);

    // Deduct life if incorrect
    if (!correct && lives > 1) {
      setLives(lives - 1);
    } else if (!correct && lives === 1) {
      setLives(0);
      // Game over
    }
  };

  const checkAnswer = (question: Question, answer: any): boolean => {
    if (question.type === 'multiple-choice') {
      return answer === question.correctAnswer;
    } else if (question.type === 'matching') {
      return question.pairs?.every((pair: any, idx: number) => answer?.[idx] === pair.correctMatch) ?? false;
    } else if (question.type === 'scramble' || question.type === 'scramble-word') {
      return answer?.toLowerCase() === question.correctAnswer?.toLowerCase();
    }
    return false;
  };

  const handleContinue = async () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
    } else {
      // Assessment complete
      await handleSubmitAssessment();
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      setIsSubmitting(true);
      const correctCount = answers.filter((answer, idx) => 
        checkAnswer(assessment.questions[idx], answer)
      ).length;

      const result = await apiClient.assessment.submit(Number(assessment.id), {
        student_id: studentId,
        answers,
        yunit_id: Number(yunitId),
        bahagi_id: Number(bahagiId),
        total_questions: assessment.questions.length
      });

      if (result.success) {
        onComplete(result);
      } else {
        throw new Error(result.error || 'Failed to submit assessment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  if (lives === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50"
      >
        <div className="text-center space-y-6">
          <div className="text-7xl animate-bounce">💔</div>
          <h2 className="text-3xl font-black text-white">Game Over</h2>
          <p className="text-slate-400">You've run out of lives!</p>
          
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => {
                setLives(3);
                setCurrentQuestionIdx(0);
                setAnswers(new Array(totalQuestions).fill(null));
                setSelectedAnswer(null);
                setShowResult(false);
              }}
              className="px-6 py-3 bg-brand-purple text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              🔄 Retry
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Back
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-b from-slate-900 to-slate-950 border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Bumalik
          </button>
          
          <div className="flex items-center gap-4">
            {/* Hearts */}
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-2xl ${i < lives ? '❤️' : '🖤'}`} />
              ))}
            </div>

            {/* Progress */}
            <div className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
              {currentQuestionIdx + 1} / {totalQuestions}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
            className="h-full bg-gradient-to-r from-brand-purple to-brand-sky"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Question Type Badge */}
            <div className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">
              {currentQuestion.type.replace('-', ' ').toUpperCase()}
            </div>

            {/* Question Text */}
            <div>
              <h3 className="text-2xl font-black text-white">{currentQuestion.question}</h3>
            </div>

            {/* Question Media */}
            {currentQuestion.questionMedia && (
              <div className="space-y-2">
                {currentQuestion.questionMedia.type?.startsWith('image') ? (
                  <img
                    src={currentQuestion.questionMedia.preview}
                    alt="Question"
                    className="max-w-full max-h-64 rounded-lg"
                  />
                ) : (
                  <audio controls className="w-full">
                    <source
                      src={currentQuestion.questionMedia.preview}
                      type={currentQuestion.questionMedia.type}
                    />
                  </audio>
                )}
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option: string, idx: number) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-lg text-left font-bold transition-all ${
                        selectedAnswer === idx
                          ? isCorrect === true
                            ? 'bg-green-500 border-2 border-green-400 text-white'
                            : isCorrect === false
                            ? 'bg-red-500 border-2 border-red-400 text-white'
                            : 'bg-brand-purple border-2 border-brand-purple text-white'
                          : showResult && idx === currentQuestion.correctAnswer
                          ? 'bg-green-500/40 border-2 border-green-400 text-white'
                          : 'bg-slate-800 border-2 border-slate-700 text-white hover:border-slate-600'
                      }`}
                      disabled={showResult}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'matching' && (
                <div className="space-y-3">
                  {currentQuestion.pairs?.map((pair: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="bg-slate-800 rounded-lg p-3 flex-1">
                        <p className="text-white font-bold">{pair.left}</p>
                      </div>
                      <span className="text-slate-400">→</span>
                      <select
                        value={selectedAnswer?.[idx] || ''}
                        onChange={(e) => {
                          const newAnswer = [...(selectedAnswer || [])];
                          newAnswer[idx] = e.target.value;
                          setSelectedAnswer(newAnswer);
                        }}
                        disabled={showResult}
                        className="bg-slate-800 border-2 border-slate-700 text-white rounded-lg p-3 flex-1 font-bold"
                      >
                        <option value="">Select match</option>
                        {pair.rightOptions?.map((option: string, optIdx: number) => (
                          <option key={optIdx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {(currentQuestion.type === 'scramble' || currentQuestion.type === 'scramble-word') && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Unscramble this word:</p>
                    <p className="text-3xl font-black text-brand-purple tracking-widest letter-spacing">
                      {currentQuestion.scrambleWords?.[0]?.text || 'EXAMPLE'}{' '}
                      {currentQuestion.scrambleWords?.slice(1).map((w: any) => w.text).join(' ')}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={selectedAnswer || ''}
                    onChange={(e) => setSelectedAnswer(e.target.value.toUpperCase())}
                    placeholder="Type your answer..."
                    disabled={showResult}
                    className="w-full p-4 bg-slate-800 border-2 border-slate-700 text-white rounded-lg font-bold text-lg focus:border-brand-purple outline-none"
                  />
                </div>
              )}
            </div>

            {/* Result Message */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg text-center font-bold ${
                  isCorrect
                    ? 'bg-green-500/20 border border-green-500 text-green-300'
                    : 'bg-red-500/20 border border-red-500 text-red-300'
                }`}
              >
                {isCorrect ? '✅ Tama! Excellent!' : '❌ Mali. Try again!'}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="bg-linear-to-t from-slate-950 to-slate-900 border-t border-white/10 p-6">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <button
            onClick={handleSkip}
            disabled={showResult}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Laktawan (Skip)
          </button>

          <button
            onClick={() => {
              if (!showResult) {
                handleSubmitAnswer();
              } else {
                handleContinue();
              }
            }}
            disabled={selectedAnswer === null && selectedAnswer !== 0}
            className="flex-1 px-4 py-3 bg-brand-purple text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {!showResult ? 'Pakitsek' : currentQuestionIdx < totalQuestions - 1 ? 'Magpatuloy' : 'Tapusin'}
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};
