'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizQuestion {
  id: string;
  assessmentId: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: any;
  questionMedia?: any;
  scrambleWords?: any[];
  pairs?: any[];
  xp: number;
  coins: number;
  points: number;
  difficulty: number; // 1=easy, 2=medium, 3=hard
}

interface AdaptiveQuizScreenProps {
  studentId: string;
  bahagiId: string | number;
  onComplete: (result: any) => void;
  onBack: () => void;
}

// Extract display text from an option that may be a string or {text, media} object
const optionText = (opt: any): string => {
  if (typeof opt === 'string') return opt;
  if (opt && typeof opt === 'object' && 'text' in opt) return opt.text || '';
  return String(opt ?? '');
};

export const AdaptiveQuizScreen: React.FC<AdaptiveQuizScreenProps> = ({
  studentId,
  bahagiId,
  onComplete,
  onBack,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(1); // 1-3
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);

  // Results tracking
  const [answers, setAnswers] = useState<any[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAudioQuestion = (type: string) =>
    type === 'audio' || type === 'media-audio';

  const startRecording = useCallback(async () => {
    try {
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
  }, []);

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

  const formatRecTime = (secs: number) => {
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
  }, [currentIdx]);

  // Fetch questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/student/adaptive-quiz?bahagiId=${bahagiId}&studentId=${studentId}`);
        const data = await res.json();

        if (data.success && data.questions?.length > 0) {
          setQuestions(data.questions);
        } else {
          setError('Walang available na quiz para sa bahaging ito.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [bahagiId, studentId]);

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIdx + (showResult ? 1 : 0)) / totalQuestions) * 100 : 0;

  const difficultyLabel = difficultyLevel === 1 ? 'Madali' : difficultyLevel === 2 ? 'Katamtaman' : 'Mahirap';
  const difficultyColor = difficultyLevel === 1 ? 'text-emerald-400' : difficultyLevel === 2 ? 'text-amber-400' : 'text-red-400';

  // Check answer correctness
  const checkAnswer = useCallback((question: QuizQuestion, answer: any): boolean => {
    if (!question) return false;
    const type = question.type;

    if (type === 'multiple-choice') {
      return answer === question.correctAnswer;
    } else if (type === 'checkbox') {
      if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
        return JSON.stringify([...answer].sort()) === JSON.stringify([...question.correctAnswer].sort());
      }
      return false;
    } else if (type === 'short-answer') {
      return String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    } else if (type === 'matching') {
      return question.pairs?.every((pair: any, idx: number) =>
        answer?.[idx]?.toLowerCase() === pair.correctMatch?.toLowerCase()
      ) ?? false;
    } else if (type === 'scramble' || type === 'scramble-word') {
      return String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    } else if (type === 'audio' || type === 'media-audio') {
      return answer === 'audio-recorded';
    }
    return false;
  }, []);

  // Generate hint based on question type
  const getHint = (question: QuizQuestion): string => {
    if (!question) return '';
    const type = question.type;
    const correct = question.correctAnswer;

    if (type === 'multiple-choice' && question.options && typeof correct === 'number') {
      const correctText = question.options[correct];
      if (correctText) return `Hint: Nagsisimula sa "${correctText.charAt(0).toUpperCase()}..."`;
    } else if (type === 'short-answer' && typeof correct === 'string') {
      return `Hint: Nagsisimula sa "${correct.charAt(0).toUpperCase()}${correct.length > 2 ? correct.charAt(1) : ''}..."`;
    } else if ((type === 'scramble' || type === 'scramble-word') && typeof correct === 'string') {
      return `Hint: Ang tamang sagot ay may ${correct.length} letra at nagsisimula sa "${correct.substring(0, 2).toUpperCase()}..."`;
    } else if (type === 'matching') {
      return 'Hint: Subukang basahin muli ang mga pagpipilian nang mabuti.';
    }
    return 'Hint: Pag-isipang mabuti ang tanong.';
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null && selectedAnswer !== 0) return;
    if (!currentQuestion) return;

    const correct = checkAnswer(currentQuestion, selectedAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
      const xpGain = Math.round(currentQuestion.xp * (difficultyLevel * 0.5 + 0.5));
      const coinGain = Math.round(currentQuestion.coins * (difficultyLevel * 0.5 + 0.5));
      setTotalXP(prev => prev + xpGain);
      setTotalCoins(prev => prev + coinGain);

      // Increase difficulty after 2 correct in a row
      if (streak + 1 >= 2 && difficultyLevel < 3) {
        setDifficultyLevel(prev => Math.min(3, prev + 1));
      }
    } else {
      setStreak(0);
      setShowHint(true);
      setLives(prev => Math.max(0, prev - 1));
      // Decrease difficulty on wrong
      if (difficultyLevel > 1) {
        setDifficultyLevel(prev => Math.max(1, prev - 1));
      }
    }

    // Record answer
    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect: correct,
    }]);
  };

  const handleContinue = () => {
    if (currentIdx < totalQuestions - 1) {
      discardRecording();
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
      setShowHint(false);
    } else {
      // Quiz finished
      setQuizComplete(true);
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const res = await fetch('/api/student/adaptive-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          bahagiId: Number(bahagiId),
          answers,
          totalQuestions,
          correctCount,
          difficultyLevel,
          timeSpent,
        }),
      });

      const result = await res.json();
      if (result.success) {
        onComplete(result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setDifficultyLevel(1);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setShowHint(false);
    setLives(3);
    setStreak(0);
    setAnswers([]);
    setCorrectCount(0);
    setTotalXP(0);
    setTotalCoins(0);
    setQuizComplete(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 md:left-48 bg-slate-950 flex items-center justify-center z-40">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-5xl mb-4 inline-block"
          >
            🧠
          </motion.div>
          <p className="text-white text-lg font-semibold">Inihahanda ang quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !questions.length) {
    return (
      <div className="fixed inset-0 md:left-48 bg-slate-950 flex items-center justify-center z-40">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-white text-lg mb-2">Walang Quiz</p>
          <p className="text-slate-400 mb-6">{error || 'Walang available na tanong para sa bahaging ito.'}</p>
          <button onClick={onBack} className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-400 transition-all">
            Bumalik
          </button>
        </div>
      </div>
    );
  }

  // Game over state
  if (lives === 0 && !quizComplete) {
    const currentScore = Math.round((correctCount / (currentIdx + 1)) * 100);
    return (
      <div className="fixed inset-0 md:left-48 bg-slate-950 flex items-center justify-center z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="text-7xl">💔</div>
          <h2 className="text-3xl font-black text-white">Ubos na ang Buhay!</h2>
          <p className="text-slate-400">Na-sagot mo nang tama ang {correctCount} sa {currentIdx + 1} na tanong ({currentScore}%)</p>
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="text-amber-400 font-bold">⚡ +{totalXP} XP</span>
            <span className="text-yellow-400 font-bold">🪙 +{totalCoins} Coins</span>
          </div>
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-400 transition-all"
            >
              🔄 Ulitin
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700 text-white rounded-full font-bold hover:bg-slate-600 transition-all"
            >
              Bumalik
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz complete state
  if (quizComplete) {
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= 75;
    return (
      <div className="fixed inset-0 md:left-48 bg-slate-950 flex items-center justify-center z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="text-7xl">{isPassed ? '🎉' : '📚'}</div>
          <h2 className="text-3xl font-black text-white">
            {isPassed ? 'Mahusay!' : 'Subukan Muli'}
          </h2>
          <div className="bg-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="text-5xl font-black text-white">{scorePercentage}%</div>
            <p className="text-slate-400">
              {correctCount} tama sa {totalQuestions} tanong
            </p>
            <div className="flex items-center justify-center gap-6 text-lg">
              <span className="text-amber-400 font-bold">⚡ +{totalXP} XP</span>
              <span className="text-yellow-400 font-bold">🪙 +{totalCoins} Coins</span>
            </div>
            {isPassed ? (
              <p className="text-emerald-400 font-semibold">✅ Pumasa ka! Congrats!</p>
            ) : (
              <p className="text-red-400 font-semibold">Kailangan ng 75% para pumasa</p>
            )}
          </div>
          <div className="flex gap-4 justify-center">
            {!isPassed && (
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-400 transition-all"
              >
                🔄 Ulitin
              </button>
            )}
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700 text-white rounded-full font-bold hover:bg-slate-600 transition-all"
            >
              {isPassed ? 'Magpatuloy' : 'Bumalik'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 md:left-48 bg-slate-950 flex flex-col overflow-hidden z-40">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors font-semibold">
            ← Bumalik
          </button>

          <div className="flex items-center gap-4">
            {/* Difficulty indicator */}
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 ${difficultyColor}`}>
              {difficultyLabel}
            </span>

            {/* Hearts */}
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="text-xl">{i < lives ? '❤️' : '🖤'}</span>
              ))}
            </div>

            {/* Streak */}
            {streak > 0 && (
              <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-lg">
                🔥 {streak}
              </span>
            )}

            {/* Question counter */}
            <div className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
              {currentIdx + 1} / {totalQuestions}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-purple-500 rounded-full"
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* XP/Coins earned so far */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-amber-400 font-bold">⚡ {totalXP} XP</span>
          <span className="text-yellow-400 font-bold">🪙 {totalCoins} Coins</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Question type badge */}
            <div className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentQuestion.type.replace('-', ' ')}
            </div>

            {/* Question text */}
            <h3 className="text-2xl font-black text-white leading-snug">
              {currentQuestion.question}
            </h3>

            {/* Question media */}
            {currentQuestion.questionMedia && (
              <div className="space-y-2">
                {currentQuestion.questionMedia.type?.startsWith('image') ? (
                  <img
                    src={currentQuestion.questionMedia.preview || currentQuestion.questionMedia.url}
                    alt="Question"
                    className="max-w-full max-h-64 rounded-xl border border-slate-700"
                  />
                ) : currentQuestion.questionMedia.type?.startsWith('audio') ? (
                  <audio controls className="w-full">
                    <source src={currentQuestion.questionMedia.preview || currentQuestion.questionMedia.url} type={currentQuestion.questionMedia.type} />
                  </audio>
                ) : null}
              </div>
            )}

            {/* Answer options based on question type */}
            <div className="space-y-3">
              {/* Multiple Choice */}
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option: any, idx: number) => (
                    <motion.button
                      key={idx}
                      onClick={() => !showResult && setSelectedAnswer(idx)}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      className={`w-full p-4 rounded-xl text-left font-semibold transition-all border-2 ${
                        showResult
                          ? idx === currentQuestion.correctAnswer
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : selectedAnswer === idx && !isCorrect
                            ? 'bg-red-500/20 border-red-500 text-red-300'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                          : selectedAnswer === idx
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                      }`}
                      disabled={showResult}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                          showResult
                            ? idx === currentQuestion.correctAnswer
                              ? 'bg-emerald-500 text-white'
                              : selectedAnswer === idx ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'
                            : selectedAnswer === idx
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {optionText(option)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {currentQuestion.type === 'short-answer' && (
                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="I-type ang iyong sagot..."
                  disabled={showResult}
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 text-white rounded-xl font-semibold text-lg focus:border-purple-500 outline-none transition-colors"
                />
              )}

              {/* Scramble */}
              {(currentQuestion.type === 'scramble' || currentQuestion.type === 'scramble-word') && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Ayusin ang mga letra:</p>
                    <p className="text-3xl font-black text-purple-400 tracking-widest">
                      {currentQuestion.scrambleWords?.map((w: any) => w.text || w).join(' ') || '???'}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={selectedAnswer || ''}
                    onChange={(e) => setSelectedAnswer(e.target.value.toUpperCase())}
                    placeholder="I-type ang tamang salita..."
                    disabled={showResult}
                    className="w-full p-4 bg-slate-800 border-2 border-slate-700 text-white rounded-xl font-semibold text-lg focus:border-purple-500 outline-none"
                  />
                </div>
              )}

              {/* Matching */}
              {currentQuestion.type === 'matching' && currentQuestion.pairs && (
                <div className="space-y-3">
                  {currentQuestion.pairs.map((pair: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="bg-slate-800 rounded-xl p-3 flex-1 border border-slate-700">
                        <p className="text-white font-semibold">{pair.left}</p>
                      </div>
                      <span className="text-slate-500 text-lg">→</span>
                      <select
                        value={selectedAnswer?.[idx] || ''}
                        onChange={(e) => {
                          const newAnswer = [...(selectedAnswer || Array(currentQuestion.pairs!.length).fill(''))];
                          newAnswer[idx] = e.target.value;
                          setSelectedAnswer(newAnswer);
                        }}
                        disabled={showResult}
                        className="bg-slate-800 border-2 border-slate-700 text-white rounded-xl p-3 flex-1 font-semibold focus:border-purple-500 outline-none"
                      >
                        <option value="">Pumili...</option>
                        {pair.rightOptions?.map((option: any, optIdx: number) => (
                          <option key={optIdx} value={optionText(option)}>{optionText(option)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {currentQuestion.type === 'checkbox' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option: any, idx: number) => {
                    const selected = Array.isArray(selectedAnswer) && selectedAnswer.includes(idx);
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => {
                          if (showResult) return;
                          const current = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
                          if (current.includes(idx)) {
                            setSelectedAnswer(current.filter(i => i !== idx));
                          } else {
                            setSelectedAnswer([...current, idx]);
                          }
                        }}
                        className={`w-full p-4 rounded-xl text-left font-semibold transition-all border-2 ${
                          showResult
                            ? Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.includes(idx)
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : selected
                              ? 'bg-red-500/20 border-red-500 text-red-300'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                            : selected
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                        }`}
                        disabled={showResult}
                      >
                        <span className="inline-flex items-center gap-3">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                            selected ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {selected ? '✓' : ''}
                          </span>
                          {optionText(option)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Audio Recording */}
              {isAudioQuestion(currentQuestion.type) && (
                <div className="space-y-5">
                  {/* Avatar with speech bubble */}
                  <div className="flex items-end gap-3">
                    <div className="w-24 h-28 shrink-0">
                      <img
                        src="/Character/NLLCTeachHalf1.png"
                        alt="Teacher"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="relative bg-slate-800 border border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                          </svg>
                        </div>
                        <p className="text-cyan-400 font-bold text-sm">{currentQuestion.question}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mic Error */}
                  {micError && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-center">
                      <p className="text-red-400 text-sm">{micError}</p>
                    </div>
                  )}

                  {/* Record / Playback */}
                  {!audioUrl ? (
                    <div className="space-y-3">
                      {/* Wide mic button like reference */}
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
                            <span>Nire-record... {formatRecTime(recordingTime)}</span>
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

                      {/* Waveform animation while recording */}
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
                    /* Playback / Re-record */
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Na-record na!</p>
                          <p className="text-slate-400 text-xs">Tagal: {formatRecTime(recordingTime)}</p>
                        </div>
                      </div>
                      <audio src={audioUrl} controls className="w-full h-10" />
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

            {/* Result feedback */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-center font-bold border ${
                  isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {isCorrect ? (
                  <div className="space-y-1">
                    <p className="text-lg">{isAudioQuestion(currentQuestion.type) ? '🎤 Na-submit na ang iyong sagot!' : '✅ Tama! Mahusay!'}</p>
                    {streak >= 2 && <p className="text-sm text-orange-400">🔥 {streak} streak! Difficulty up!</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg">❌ Mali.</p>
                    {showHint && (
                      <p className="text-sm text-amber-300">{getHint(currentQuestion)}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="bg-slate-900 border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          {!showResult ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmitAnswer}
              disabled={(selectedAnswer === null && selectedAnswer !== 0 && !Array.isArray(selectedAnswer)) && !isRecording}
              className="w-full py-4 rounded-full font-black text-base uppercase tracking-wider bg-purple-500 text-white hover:bg-purple-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              Pakitsek
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinue}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-full font-black text-base uppercase tracking-wider transition-all shadow-lg ${
                isCorrect
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
                  : 'bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'Submitting...' : currentIdx < totalQuestions - 1 ? 'Susunod' : 'Tapusin'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
