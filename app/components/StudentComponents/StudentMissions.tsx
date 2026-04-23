'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface Mission {
    id: string;
    title: string;
    description: string;
    category: 'lesson' | 'assessment' | 'challenge' | 'daily' | 'active';
    difficulty: 'easy' | 'medium' | 'hard';
    xp_reward?: number;
    coin_reward?: number;
    progress: number;
    target: number;
    completed: boolean;
    icon?: string;
}

interface StudentMissionsProps {
    refreshToken?: number;
}

export const StudentMissions: React.FC<StudentMissionsProps> = ({ refreshToken = 0 }) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'daily' | 'active' | 'completed'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);

    const getCategoryIcon = (category: string): string => {
        switch (category) {
            case 'daily': return '📅';
            case 'lesson': return '📚';
            case 'challenge': return '⚡';
            case 'active': return '🔥';
            default: return '🎯';
        }
    };

    const getMockMissions = (): Mission[] => [
        {
            id: '1',
            title: 'Taposing ang 3 Leksyon',
            description: 'Kumpletuhin ang 3 bahagi ng araw-araw na leksyon',
            category: 'daily',
            difficulty: 'easy',
            xp_reward: 250,
            coin_reward: 50,
            progress: 2,
            target: 3,
            completed: false,
            icon: '📚'
        },
        {
            id: '2',
            title: 'Perpektong Marka',
            description: 'Makakuha ng 100% sa isang assessment',
            category: 'challenge',
            difficulty: 'hard',
            xp_reward: 500,
            coin_reward: 100,
            progress: 0,
            target: 1,
            completed: false,
            icon: '⭐'
        },
        {
            id: '3',
            title: 'Araw-araw na Mag-aral',
            description: 'Magloji sa loob ng 7 magkakaibang araw',
            category: 'daily',
            difficulty: 'medium',
            xp_reward: 350,
            coin_reward: 75,
            progress: 5,
            target: 7,
            completed: false,
            icon: '📅'
        },
        {
            id: '4',
            title: 'Unang Bahagi',
            description: 'Tapusin ang unang bahagi ng kurso',
            category: 'lesson',
            difficulty: 'easy',
            xp_reward: 400,
            coin_reward: 80,
            progress: 1,
            target: 1,
            completed: true,
            icon: '🏁'
        },
        {
            id: '5',
            title: 'Speedy Learner',
            description: 'Kumpletuhin ang assessment sa loob ng 5 minuto',
            category: 'challenge',
            difficulty: 'hard',
            xp_reward: 600,
            coin_reward: 120,
            progress: 0,
            target: 1,
            completed: false,
            icon: '⚡'
        },
        {
            id: '6',
            title: 'Kolektado ng XP',
            description: 'Kumita ng 1000 XP points',
            category: 'active',
            difficulty: 'medium',
            xp_reward: 300,
            coin_reward: 60,
            progress: 750,
            target: 1000,
            completed: false,
            icon: '💎'
        }
    ];

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await apiClient.student.getMissions();
                
                if (result.success && result.data) {
                    const transformedMissions = result.data.map((mission: any, idx: number) => ({
                        id: mission.id || `mission-${idx}`,
                        title: mission.title,
                        description: mission.description,
                        category: mission.category,
                        difficulty: mission.difficulty,
                        xp_reward: mission.xp_reward,
                        coin_reward: mission.coin_reward,
                        progress: mission.progress || 0,
                        target: mission.target || 1,
                        completed: mission.completed || false,
                        icon: getCategoryIcon(mission.category),
                    }));
                    setMissions(transformedMissions);
                } else {
                    setError('Failed to load missions');
                    setMissions(getMockMissions());
                }
            } catch (error) {
                console.error('Failed to fetch missions:', error);
                setError('Failed to load missions. Showing mock data.');
                setMissions(getMockMissions());
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissions();
    }, [refreshToken]);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'hard':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'Madali';
            case 'medium':
                return 'Katamtaman';
            case 'hard':
                return 'Mahirap';
            default:
                return difficulty;
        }
    };

    const handleCompleteMission = async (mission: Mission) => {
        if (mission.completed) {
            return; // Already completed
        }

        if (mission.progress < mission.target) {
            alert(`Kumpleto muna ang mission! ${mission.progress}/${mission.target}`);
            return;
        }

        try {
            setCompletingMissionId(mission.id);
            const response = await apiClient.student.completeMission(mission.id);

            if (response.success) {
                // Update mission to completed
                setMissions((prev) =>
                    prev.map((m) =>
                        m.id === mission.id
                            ? { ...m, completed: true }
                            : m
                    )
                );
                console.log(`Mission completed! Earned ${response.data?.xp_reward || 0} XP and ${response.data?.coin_reward || 0} coins!`);
            } else {
                if (response.data?.alreadyCompleted) {
                    // Mission was already completed
                    setMissions((prev) =>
                        prev.map((m) =>
                            m.id === mission.id
                                ? { ...m, completed: true }
                                : m
                        )
                    );
                } else {
                    alert(`Failed to complete mission: ${response.error}`);
                }
            }
        } catch (err) {
            console.error('Error completing mission:', err);
            alert('Failed to complete mission. Please try again.');
        } finally {
            setCompletingMissionId(null);
        }
    };

    const filteredMissions = missions.filter((m) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'daily') return m.category === 'daily';
        if (activeFilter === 'active') return !m.completed;
        if (activeFilter === 'completed') return m.completed;
        return true;
    });

    return (
        <div className="min-h-full p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2">🎯 Mga Misyon</h1>
                    <p className="text-slate-400">Taposing ang mga misyon upang makakuha ng rewards</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {(['all', 'daily', 'active', 'completed'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                activeFilter === filter
                                    ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/40'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            {filter === 'all' ? 'Lahat' : filter === 'daily' ? 'Araw-araw' : filter === 'active' ? 'Aktibo' : 'Tapos'}
                        </button>
                    ))}
                </div>

                {/* Missions Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-brand-purple rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredMissions.map((mission, idx) => (
                            <motion.div
                                key={mission.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.08 }}
                                className={`relative p-6 rounded-xl border transition-all ${
                                    mission.completed
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {/* Completed Badge */}
                                {mission.completed && (
                                    <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        ✓
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{mission.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-white">{mission.title}</h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                                                {getDifficultyLabel(mission.difficulty)}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4">{mission.description}</p>

                                        {/* Progress Bar */}
                                        {!mission.completed && (
                                            <div className="mb-3">
                                                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(mission.progress / mission.target) * 100}%` }}
                                                        transition={{ duration: 0.8, delay: 0.2 }}
                                                        className="bg-linear-to-r from-brand-purple to-brand-sky h-full"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {mission.progress} / {mission.target}
                                                </p>
                                                {mission.progress >= mission.target && (
                                                    <button
                                                        onClick={() => handleCompleteMission(mission)}
                                                        disabled={completingMissionId === mission.id}
                                                        className="mt-3 w-full py-2 px-4 bg-linear-to-r from-brand-purple to-brand-sky hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                                                    >
                                                        {completingMissionId === mission.id ? 'Completing...' : '✨ Kumpletuhin ang Misyon'}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Reward */}
                                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                            <span className="text-sm text-slate-400">Gantimpala:</span>
                                            <span className="text-lg font-bold text-yellow-400">+{mission.xp_reward || 100} XP</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {filteredMissions.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <p className="text-2xl mb-2">🎉</p>
                        <p className="text-slate-400">Walang misyon sa kategoryang ito</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
