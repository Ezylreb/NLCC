'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { useQuizAudio } from './useQuizAudio';
import { ASSESSMENT_COMPLETION_XP } from '@/lib/constants/xp-rewards';

interface Question {
  id?: string;
  question: string;
  type: string;
  options?: Array<string | { option_text?: string; text?: string; option_order?: number }>;
  correctAnswer?: any;
  correct_answer?: any;
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
  isRetake?: boolean;
  previousAttempts?: number;
  onComplete: (result: any) => void;
  onBack: () => void;
}

const assessmentCache = new Map<string, Assessment>();

const getOptionLabel = (option: string | { option_text?: string; text?: string }) => {
  if (typeof option === 'string') {
    return option;
  }

  return option.option_text ?? option.text ?? '';
};

const normalizeMatchingPairs = (question: Question) => {
  if (Array.isArray(question.pairs) && question.pairs.length > 0) {
    return question.pairs.map((pair) => ({
      ...pair,
      left: pair?.left ?? pair?.text ?? '',
      correctMatch: pair?.correctMatch ?? pair?.match ?? '',
      rightOptions: Array.isArray(pair?.rightOptions)
        ? pair.rightOptions.map((option: any) => getOptionLabel(option))
        : pair?.correctMatch ?? pair?.match
          ? [pair.correctMatch ?? pair.match]
          : [],
    }));
  }

  if (!Array.isArray(question.options)) {
    return [];
  }

  const derivedPairs = question.options.map((option: any) => ({
    left: option?.left ?? option?.text ?? option?.option_text ?? '',
    correctMatch: option?.correctMatch ?? option?.match ?? '',
  }));

  const rightOptions = derivedPairs
    .map((pair) => pair.correctMatch)
    .filter((value) => typeof value === 'string' && value.trim().length > 0);

  return derivedPairs.map((pair) => ({
    ...pair,
    rightOptions,
  }));
};

const normalizeQuestionForScreen = (question: Question): Question => {
  if (question.type !== 'matching') {
    return question;
  }

  return {
    ...question,
    pairs: normalizeMatchingPairs(question),
  };
};

const hasAnswerForQuestion = (question: Question, answer: any) => {
  if (question.type === 'checkbox') {
    return Array.isArray(answer) && answer.length > 0;
  }

  if (question.type === 'short-answer') {
    return String(answer ?? '').trim().length > 0;
  }

  if (question.type === 'matching') {
    const pairs = normalizeMatchingPairs(question);
    return pairs.length > 0 && Array.isArray(answer) && pairs.every((_, idx) => String(answer?.[idx] ?? '').trim().length > 0);
  }

  if (question.type === 'scramble' || question.type === 'scramble-word') {
    return Array.isArray(answer) && answer.length > 0;
  }

  if (question.type === 'audio' || question.type === 'media-audio') {
    return answer === 'audio-recorded';
  }

  return answer !== null && typeof answer !== 'undefined';
};

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  studentId,
  yunitId,
  bahagiId,
  isRetake = false,
  previousAttempts = 0,
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

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scramble word state
  const [scramblePool, setScramblePool] = useState<string[]>([]);
  const [scrambleSelected, setScrambleSelected] = useState<string[]>([]);
  const {
    ensureBackgroundPlayback,
    playCorrectSound,
    playWrongSound,
    playCompletionSound,
    playLoseSound,
    registerQuestionAudio,
  } = useQuizAudio();

  const hasPlayedLoseSoundRef = useRef(false);

  const isAudioQuestion = (type: string) =>
    type === 'audio' || type === 'media-audio';

  const startRecording = useCallback(async () => {
    try {
      ensureBackgroundPlayback();
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setSelectedAnswer('audio-recorded');
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setMicError('Hindi ma-access ang mikropono. Pakisuri ang pahintulot.');
    }
  }, [ensureBackgroundPlayback]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setSelectedAnswer(null);
  }, [audioUrl]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Cleanup audio on question change
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [currentQuestionIdx]);

  // Shuffle scramble words when question changes
  useEffect(() => {
    if (!assessment) return;
    const q = assessment.questions[currentQuestionIdx];
    if (q && (q.type === 'scramble' || q.type === 'scramble-word') && q.scrambleWords?.length) {
      const words = q.scrambleWords.map((w: any) => (typeof w === 'string' ? w : w.text || '').trim()).filter(Boolean);
      const shuffled = [...words];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      if (shuffled.length > 1 && JSON.stringify(shuffled) === JSON.stringify(words)) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      setScramblePool(shuffled);
      setScrambleSelected([]);
    }
  }, [currentQuestionIdx, assessment]);

  useEffect(() => {
    const fetchAssessment = async () => {
      const cacheKey = String(yunitId);
      const cachedAssessment = assessmentCache.get(cacheKey);

      if (cachedAssessment) {
        setAssessment(cachedAssessment);
        setAnswers(new Array(cachedAssessment.questions?.length || 0).fill(null));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.assessment.fetch({
          yunit_id: Number(yunitId),
          student_view: true,
          first_only: true,
        });
        
        if (response.data?.assessments?.length > 0) {
          const assessmentData = {
            ...response.data.assessments[0],
            questions: Array.isArray(response.data.assessments[0]?.questions)
              ? response.data.assessments[0].questions.map((question: Question) => normalizeQuestionForScreen(question))
              : [],
          };
          assessmentCache.set(cacheKey, assessmentData);
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

  useEffect(() => {
    if (lives === 0 && !hasPlayedLoseSoundRef.current) {
      playLoseSound();
      hasPlayedLoseSoundRef.current = true;
    }

    if (lives > 0) {
      hasPlayedLoseSoundRef.current = false;
    }
  }, [lives, playLoseSound]);

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
  const matchingPairs = normalizeMatchingPairs(currentQuestion);
  const totalQuestions = assessment.questions.length;

  const handleAnswerSelect = (answer: any) => {
    ensureBackgroundPlayback();
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    ensureBackgroundPlayback();
    if (!hasAnswerForQuestion(currentQuestion, selectedAnswer)) {
      alert('Please select an answer');
      return;
    }

    // Check if answer is correct
    const correct = checkAnswer(currentQuestion, selectedAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

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
    } else if (question.type === 'checkbox') {
      if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
        return JSON.stringify([...answer].sort()) === JSON.stringify([...question.correctAnswer].sort());
      }
      return false;
    } else if (question.type === 'short-answer') {
      const normalizedAnswer = String(answer ?? '').trim().toLowerCase();
      const expectedAnswer = String(question.correctAnswer ?? question.correct_answer ?? '').trim().toLowerCase();
      if (!expectedAnswer) {
        return normalizedAnswer.length > 0;
      }
      return normalizedAnswer === expectedAnswer;
    } else if (question.type === 'matching') {
      return normalizeMatchingPairs(question).every((pair: any, idx: number) =>
        String(answer?.[idx] ?? '').trim().toLowerCase() === String(pair.correctMatch ?? '').trim().toLowerCase()
      );
    } else if (question.type === 'scramble' || question.type === 'scramble-word') {
      if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
        return JSON.stringify(answer.map((w: string) => w.toLowerCase().trim())) ===
               JSON.stringify(question.correctAnswer.map((w: string) => w.toLowerCase().trim()));
      }
      if (Array.isArray(answer) && question.scrambleWords?.length) {
        const correct = question.scrambleWords.map((w: any) => (typeof w === 'string' ? w : w.text || '').toLowerCase().trim());
        return JSON.stringify(answer.map((w: string) => w.toLowerCase().trim())) === JSON.stringify(correct);
      }
      return false;
    } else if (isAudioQuestion(question.type)) {
      // Audio answers are always "submitted for review" — count as correct for progression
      return answer === 'audio-recorded';
    }
    return false;
  };

  const handleContinue = async () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
      // Reset audio state for next question
      discardRecording();
    } else {
      // Assessment complete
      await handleSubmitAssessment();
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const correctCount = answers.filter((answer, idx) => 
        checkAnswer(assessment.questions[idx], answer)
      ).length;

      const response = await fetch('/api/student/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          yunitId: Number(yunitId),
          bahagiId: Number(bahagiId),
          assessmentId: Number(assessment.id),
          answers,
          totalQuestions: assessment.questions.length,
          isRetake,
          previousAttempts,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit assessment');
      }

      if (result.success) {
        playCompletionSound();
        const isPassed = Boolean(result.isPassed ?? result.data?.isCorrect);
        onComplete({
          ...result,
          isPassed,
          scorePercentage: result.scorePercentage ?? (isPassed ? 100 : 0),
          xpEarned: result.xpEarned ?? (isPassed ? ASSESSMENT_COMPLETION_XP : 0),
          coinsEarned: result.coinsEarned ?? 0,
          message:
            result.message ??
            (isPassed
              ? `🎉 Mahusay! Earned +${ASSESSMENT_COMPLETION_XP} XP.`
              : result.data?.feedback ?? 'Subukan muli.'),
        });
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
      discardRecording();
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
        className="fixed inset-0 md:left-48 bg-slate-950 flex items-center justify-center z-40"
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
    <div className="fixed inset-0 md:left-48 bg-slate-950 flex flex-col overflow-hidden z-40">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors font-semibold"
          >
            ← Bumalik
          </button>
          
          <div className="flex items-center gap-4">
            {isRetake && (
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Retake #{previousAttempts + 1}
              </span>
            )}
            {/* Hearts */}
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="text-xl">{i < lives ? '❤️' : '🖤'}</span>
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
            className="h-full bg-brand-purple rounded-full"
            transition={{ duration: 0.3 }}
          />
        </div>

        {isRetake && (
          <div className="mt-2 text-xs text-amber-300 font-semibold">
            Nauna nang nasagutan ang assessment na ito. Practice retake ito at wala nang dagdag na XP o coins.
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-2xl mx-auto w-full min-w-0"
          >
            {/* Question Type Badge */}
            <div className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentQuestion.type.replace('-', ' ')}
            </div>

            {/* Question Text */}
            <div>
              <h3 className="text-2xl font-black text-white wrap-break-word leading-snug">{currentQuestion.question}</h3>
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
                  <audio ref={registerQuestionAudio} controls preload="none" className="w-full">
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
                  {currentQuestion.options?.map((option, idx: number) => (
                    <motion.button
                      key={typeof option === 'string' ? idx : option.option_order ?? idx}
                      onClick={() => handleAnswerSelect(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-xl text-left font-semibold transition-all wrap-break-word border-2 ${
                        selectedAnswer === idx
                          ? isCorrect === true
                            ? 'bg-green-500/20 border-green-500 text-green-300'
                            : isCorrect === false
                            ? 'bg-red-500/20 border-red-500 text-red-300'
                            : 'bg-brand-purple/20 border-brand-purple text-white'
                          : showResult && idx === currentQuestion.correctAnswer
                          ? 'bg-green-500/20 border-green-500 text-green-300'
                          : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                      }`}
                      disabled={showResult}
                    >
                      {getOptionLabel(option)}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short-answer' && (
                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={(e) => {
                    ensureBackgroundPlayback();
                    setSelectedAnswer(e.target.value);
                  }}
                  placeholder="I-type ang iyong sagot..."
                  disabled={showResult}
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 text-white rounded-xl font-semibold text-lg focus:border-brand-purple outline-none transition-colors"
                />
              )}

              {currentQuestion.type === 'checkbox' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx: number) => {
                    const selected = Array.isArray(selectedAnswer) && selectedAnswer.includes(idx);

                    return (
                      <motion.button
                        key={typeof option === 'string' ? idx : option.option_order ?? idx}
                        onClick={() => {
                          if (showResult) return;
                          ensureBackgroundPlayback();

                          const currentSelections = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
                          if (currentSelections.includes(idx)) {
                            setSelectedAnswer(currentSelections.filter((value) => value !== idx));
                          } else {
                            setSelectedAnswer([...currentSelections, idx]);
                          }
                        }}
                        disabled={showResult}
                        className={`w-full p-4 rounded-xl text-left font-semibold transition-all border-2 wrap-break-word ${
                          showResult
                            ? Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.includes(idx)
                              ? 'bg-green-500/20 border-green-500 text-green-300'
                              : selected
                                ? 'bg-red-500/20 border-red-500 text-red-300'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                            : selected
                              ? 'bg-brand-purple/20 border-brand-purple text-white'
                              : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                        }`}
                      >
                        <span className="inline-flex items-center gap-3">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                            selected ? 'bg-brand-purple text-white' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {selected ? '✓' : ''}
                          </span>
                          {getOptionLabel(option)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'matching' && (
                <div className="space-y-3">
                  {matchingPairs.map((pair: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 min-w-0">
                      <div className="bg-slate-800 rounded-lg p-3 flex-1 min-w-0 border border-slate-700">
                        <p className="text-white font-bold wrap-break-word">{pair.left}</p>
                      </div>
                      <span className="text-slate-400 hidden md:inline">→</span>
                      <select
                        value={selectedAnswer?.[idx] || ''}
                        onChange={(e) => {
                          ensureBackgroundPlayback();
                          const newAnswer = [...(selectedAnswer || Array(matchingPairs.length).fill(''))];
                          newAnswer[idx] = e.target.value;
                          setSelectedAnswer(newAnswer);
                        }}
                        disabled={showResult}
                        className="bg-slate-800 border-2 border-slate-700 text-white rounded-lg p-3 flex-1 font-bold min-w-0"
                      >
                        <option value="">Select match</option>
                        {pair.rightOptions?.map((option: any, optIdx: number) => (
                          <option key={optIdx} value={getOptionLabel(option)}>
                            {getOptionLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {(currentQuestion.type === 'scramble' || currentQuestion.type === 'scramble-word') && (
                <div className="space-y-5">
                  {/* Selected words (answer area) */}
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 min-h-15">
                    <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Iyong sagot:</p>
                    <div className="flex flex-wrap gap-2 min-h-10">
                      {scrambleSelected.length === 0 && (
                        <p className="text-slate-600 text-sm italic">Pindutin ang mga salita sa ibaba para ayusin...</p>
                      )}
                      {scrambleSelected.map((word, idx) => (
                        <motion.button
                          key={`sel-${idx}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={() => {
                            if (showResult) return;
                            setScrambleSelected(prev => prev.filter((_, i) => i !== idx));
                            setScramblePool(prev => [...prev, word]);
                            setSelectedAnswer(null);
                          }}
                          disabled={showResult}
                          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                            showResult
                              ? isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-red-500/20 border-red-500 text-red-300'
                              : 'bg-purple-500/20 border-purple-500 text-purple-300 hover:bg-purple-500/30'
                          }`}
                        >
                          {word}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-700/50" />

                  {/* Word pool (shuffled buttons) */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {scramblePool.map((word, idx) => (
                      <motion.button
                        key={`pool-${idx}`}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (showResult) return;
                          const newSelected = [...scrambleSelected, word];
                          setScramblePool(prev => prev.filter((_, i) => i !== idx));
                          setScrambleSelected(newSelected);
                          const totalWords = (currentQuestion.scrambleWords || []).length;
                          if (newSelected.length === totalWords) {
                            setSelectedAnswer(newSelected);
                          }
                        }}
                        disabled={showResult}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-800 border-2 border-slate-600 text-white hover:border-slate-400 hover:bg-slate-700 transition-all"
                      >
                        {word}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Recording Answer */}
              {isAudioQuestion(currentQuestion.type) && (
                <div className="space-y-6">
                  {/* Avatar with speech bubble */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
                    {/* Character avatar */}
                    <div className="w-24 h-28 shrink-0 self-start">
                      <img
                        src="/Character/NLLCTeachHalf1.png"
                        alt="Teacher"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Speech bubble with audio prompt */}
                    <div className="relative bg-slate-800 border border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3 w-full max-w-xs min-w-0">
                      {currentQuestion.questionMedia?.preview ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            </svg>
                          </div>
                          <p className="text-cyan-400 font-bold text-sm wrap-break-word">{currentQuestion.question}</p>
                        </div>
                      ) : (
                        <p className="text-cyan-400 font-bold text-sm wrap-break-word">{currentQuestion.question}</p>
                      )}
                    </div>
                  </div>

                  {/* Mic Error */}
                  {micError && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-center">
                      <p className="text-red-400 text-sm">{micError}</p>
                    </div>
                  )}

                  {/* Record / Playback Area */}
                  {!audioUrl ? (
                    <div className="space-y-3">
                      {/* Wide mic button */}
                      <motion.button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={showResult}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold text-sm tracking-wider uppercase transition-all ${
                          isRecording
                            ? 'bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-500/10'
                            : 'bg-slate-800/80 border-slate-600 text-cyan-400 hover:border-cyan-500/60 hover:bg-slate-800'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {isRecording ? (
                          <>
                            <motion.div
                              className="w-3 h-3 rounded-sm bg-red-400"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            />
                            <span>Nire-record... {formatTime(recordingTime)}</span>
                            <span className="text-xs opacity-60">(pindutin para ihinto)</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                              <line x1="12" x2="12" y1="19" y2="22"/>
                            </svg>
                            <span>Pindutin para magsalita</span>
                          </>
                        )}
                      </motion.button>

                      {/* Recording pulse animation */}
                      {isRecording && (
                        <div className="flex justify-center gap-1">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-red-400 rounded-full"
                              animate={{ height: [4, Math.random() * 20 + 8, 4] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Playback / Re-record UI */
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Na-record na!</p>
                          <p className="text-slate-400 text-xs">Tagal: {formatTime(recordingTime)}</p>
                        </div>
                      </div>
                      <audio src={audioUrl} controls preload="none" className="w-full h-10" />
                      {!showResult && (
                        <button
                          type="button"
                          onClick={discardRecording}
                          className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all"
                        >
                          🔄 I-record Ulit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Result Message */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-center font-bold ${
                  isCorrect
                    ? 'bg-green-500/20 border border-green-500 text-green-300'
                    : 'bg-red-500/20 border border-red-500 text-red-300'
                }`}
              >
                {isCorrect
                  ? isAudioQuestion(currentQuestion.type)
                    ? '🎤 Na-submit na ang iyong sagot!'
                    : '✅ Tama! Excellent!'
                  : '❌ Mali. Try again!'}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="bg-slate-900 border-t border-white/10 p-6">
        <div className="max-w-2xl mx-auto w-full space-y-3 min-w-0">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 text-red-300 wrap-break-word">
              {error}
            </div>
          )}

          <div className="flex gap-4 min-w-0">
            <button
              onClick={handleSkip}
              disabled={showResult}
              className="flex-1 min-w-0 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Laktawan (Skip)
            </button>

            <button
              onClick={() => {
                if (!showResult) {
                  handleSubmitAnswer();
                } else {
                  ensureBackgroundPlayback();
                  handleContinue();
                }
              }}
              disabled={!hasAnswerForQuestion(currentQuestion, selectedAnswer) && !isRecording}
              className="flex-1 min-w-0 px-4 py-3 bg-brand-purple text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {!showResult ? 'Pakitsek' : currentQuestionIdx < totalQuestions - 1 ? 'Magpatuloy' : 'Tapusin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
