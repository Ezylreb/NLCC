'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonDetailPageProps {
    lessonId: string;
    onBack: () => void;
    onStartGame: () => void;
}

type LearningStage = 'guide' | 'learning' | 'assessment' | 'reward';

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({ 
    lessonId, 
    onBack,
    onStartGame
}) => {
    const [lessonData, setLessonData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stage, setStage] = useState<LearningStage>('guide');
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        // Simulated lesson data - in real app, fetch from API
        const mockLessons: Record<string, any> = {
            'bahagi-1': {
                title: 'Mag-alok at tumanggap ng inumin',
                unit: 'Leksyon 1 ng 4',
                bahagi: 'Bahagi 1, Yunit 1',
                xpReward: 10,
                coinsReward: 5,
                character: '👧',
                callout: 'Halika, matuto tayo ng mga bagong salita!',
                guide: 'Sa bahaging ito, matututunan mo kung paano mag-alok at tumanggap ng inumin sa pamamagitan ng Tagalog. Ang iyong gawain ay makipagsalita nang maayos at alintanin ang magandang paraan ng pakikipagpalipay sa iba.',
                topics: ['Pag-alok', 'Pagtanggap', 'Pagsasalita'],
                assessmentType: 'multiple-choice',
                assessmentQuestions: [
                    {
                        question: 'Paano mo ia-alok ang inumin?',
                        options: ['Nais mo ba ng inumin?', 'Mag-alok', 'Uminom', 'Inumin'],
                        correct: 0
                    },
                    {
                        question: 'Ano ang tamang paraan ng pagtanggap?',
                        options: ['Oo, salamat', 'Hindi', 'Umalis', 'Sige'],
                        correct: 0
                    }
                ],
                rewards: {
                    xp: 10,
                    coins: 5,
                    achievements: ['First Offer', '+10 XP', 'Coins Earned']
                }
            },
            'bahagi-2': {
                title: 'Pagkilala sa mga salita',
                unit: 'Leksyon 2 ng 4',
                bahagi: 'Bahagi 2, Yunit 1',
                xpReward: 15,
                coinsReward: 7,
                character: '👦',
                callout: 'Alamin ang mga bagong salita!',
                guide: 'Matututunan mo ang iba\'t ibang salita at kung paano ito ginagamit sa pang-araw-araw na pag-uusap.',
                topics: ['Vocabulario', 'Kahulugan', 'Paggamit'],
                assessmentType: 'matching',
                assessmentQuestions: [
                    {
                        question: 'Itugma ang salita sa kahulugan',
                        pairs: [
                            { left: 'Salita', right: 'Pangako' },
                            { left: 'Kwento', right: 'Kuwento' }
                        ]
                    }
                ],
                rewards: {
                    xp: 15,
                    coins: 7,
                    achievements: ['Word Master', '+15 XP', 'Coins Earned']
                }
            }
        };

        const data = mockLessons[lessonId] || mockLessons['bahagi-1'];
        setLessonData(data);
        setIsLoading(false);
    }, [lessonId]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
            {/* Header Navigation */}
            <div className="sticky top-0 bg-linear-to-b from-slate-900 to-transparent flex items-center justify-between p-6 border-b border-white/10 z-40">
                <button
                    onClick={onBack}
                    className="text-white text-2xl hover:text-brand-purple transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-black text-white">
                    {lessonData?.bahagi}
                </h1>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Learning Flow Progress */}
            <div className="sticky top-20 bg-linear-to-b from-slate-900 to-transparent px-8 py-4 border-b border-white/10 z-30">
                <div className="flex items-center gap-4 max-w-4xl mx-auto">
                    {/* Simulan */}
                    <button
                        onClick={() => setStage('guide')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                            stage === 'guide'
                                ? 'bg-white text-slate-900'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <span className="text-xl">⭐</span>
                        Simulan
                    </button>

                    {/* Arrow */}
                    <div className="text-white/50">→</div>

                    {/* Assessment */}
                    <button
                        onClick={() => stage !== 'guide' && setStage('assessment')}
                        disabled={stage === 'guide'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                            stage === 'assessment'
                                ? 'bg-white text-slate-900'
                                : stage === 'guide'
                                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <span className="text-xl">✏️</span>
                        Pagsusuri
                    </button>

                    {/* Arrow */}
                    <div className="text-white/50">→</div>

                    {/* Rewards */}
                    <button
                        onClick={() => stage === 'assessment' && setStage('reward')}
                        disabled={stage === 'guide' || stage === 'learning'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                            stage === 'reward'
                                ? 'bg-white text-slate-900'
                                : stage === 'assessment'
                                ? 'bg-white/20 text-white'
                                : 'bg-white/10 text-white/50 cursor-not-allowed'
                        }`}
                    >
                        <span className="text-xl">🏆</span>
                        Gantimpala
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-8">
                <AnimatePresence mode="wait">
                    {/* GUIDE/LEARNING STAGE */}
                    {stage === 'guide' && (
                        <motion.div
                            key="guide"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Hero Section */}
                            <div className="mb-12 p-8 bg-linear-to-r from-emerald-400 to-lime-300 rounded-2xl">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-2">
                                            {lessonData?.bahagi}
                                        </p>
                                        <h1 className="text-4xl font-black text-slate-900 mb-4">
                                            {lessonData?.title}
                                        </h1>
                                        <p className="text-slate-800 text-lg max-w-2xl">
                                            {lessonData?.callout}
                                        </p>
                                    </div>
                                    <div className="text-8xl mb-4">{lessonData?.character}</div>
                                </div>
                            </div>

                            {/* Topics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                                {lessonData?.topics?.map((topic: string, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 bg-white/10 border border-white/20 rounded-lg text-center"
                                    >
                                        <p className="text-white font-bold">{topic}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Guide Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-8 bg-white/5 border border-white/10 rounded-xl mb-12"
                            >
                                <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                                    <span>📖</span> Librong Gabay
                                </h3>
                                <p className="text-slate-300 leading-relaxed text-lg">
                                    {lessonData?.guide}
                                </p>
                            </motion.div>

                            {/* Next Button */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStage('learning')}
                                className="w-full p-6 bg-linear-to-r from-green-500 to-emerald-600 rounded-xl font-black text-white text-xl hover:shadow-lg transition-all"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <span className="text-2xl">▶️</span>
                                    Simulan Ang Leksyon
                                </span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* LEARNING STAGE */}
                    {stage === 'learning' && (
                        <motion.div
                            key="learning"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-8 bg-linear-to-r from-blue-400 to-cyan-400 rounded-xl mb-12 text-center"
                            >
                                <h2 className="text-4xl font-black text-slate-900 mb-6">
                                    Simulan Ang Pag-Aral
                                </h2>
                                <div className="text-8xl mb-6">{lessonData?.character}</div>
                                <p className="text-xl text-slate-900 font-bold mb-8">
                                    Manood at matuto ng mga bagong salita at konsento!
                                </p>
                                <div className="bg-slate-900 rounded-lg p-12 mb-8">
                                    <div className="flex items-center justify-center gap-3 text-white">
                                        <span className="text-3xl">🎬</span>
                                        Interactive Learning Module
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStage('assessment')}
                                    className="px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
                                >
                                    Tapos na! Sumusunod na Pagsusuri →
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ASSESSMENT STAGE */}
                    {stage === 'assessment' && (
                        <motion.div
                            key="assessment"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-8 bg-linear-to-r from-orange-400 to-yellow-400 rounded-xl mb-12"
                            >
                                <h2 className="text-4xl font-black text-slate-900 mb-6">
                                    ✏️ Pagsusuri / Misyon
                                </h2>
                                <div className="space-y-6">
                                    {lessonData?.assessmentQuestions?.map((q: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="p-6 bg-white rounded-lg"
                                        >
                                            <p className="text-lg font-bold text-slate-900 mb-4">
                                                {idx + 1}. {q.question}
                                            </p>
                                            {q.options && (
                                                <div className="space-y-3">
                                                    {q.options.map((option: string, optIdx: number) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => optIdx === q.correct && setStage('reward')}
                                                            className={`w-full p-3 rounded-lg font-bold transition-all text-left ${
                                                                optIdx === q.correct
                                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                                    : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* REWARD STAGE */}
                    {stage === 'reward' && (
                        <motion.div
                            key="reward"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-12 bg-linear-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-2xl text-center"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.6, repeat: 2 }}
                                    className="text-8xl mb-6"
                                >
                                    🏆
                                </motion.div>
                                <h2 className="text-5xl font-black text-slate-900 mb-8">
                                    Tapus Na!
                                </h2>
                                <div className="grid grid-cols-3 gap-4 mb-12">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-6 bg-white rounded-xl"
                                    >
                                        <div className="text-4xl mb-2">⭐</div>
                                        <p className="font-bold text-slate-900">
                                            +{lessonData?.xpReward} XP
                                        </p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="p-6 bg-white rounded-xl"
                                    >
                                        <div className="text-4xl mb-2">💰</div>
                                        <p className="font-bold text-slate-900">
                                            +{lessonData?.coinsReward} Coins
                                        </p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="p-6 bg-white rounded-xl"
                                    >
                                        <div className="text-4xl mb-2">🎯</div>
                                        <p className="font-bold text-slate-900">
                                            Achievement
                                        </p>
                                    </motion.div>
                                </div>
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onBack}
                                    className="px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
                                >
                                    Balik sa Dashboard
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
