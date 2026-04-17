'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface StudentRank {
    rank: number;
    name: string;
    xp: number;
    avatar?: string;
    badge?: string;
    id?: string;
    isCurrentStudent?: boolean;
}

export const StudentLeaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<StudentRank[]>([]);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch leaderboard data
        const fetchLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await apiClient.student.getLeaderboard(timeframe);
                
                if (result.success && result.data) {
                    setLeaderboard(result.data);
                } else {
                    // Fallback to mock data if API fails
                    const mockData: StudentRank[] = [
                    { rank: 1, name: 'Maria Santos', xp: 4850, badge: '🏆' },
                    { rank: 2, name: 'Juan dela Cruz', xp: 4620, badge: '🥈' },
                    { rank: 3, name: 'Anna Reyes', xp: 4395, badge: '🥉' },
                    { rank: 4, name: 'Carlos Mendoza', xp: 3980 },
                    { rank: 5, name: 'Sofia Garcia', xp: 3750 },
                    { rank: 6, name: 'Miguel Ramos', xp: 3620 },
                    { rank: 7, name: 'Rosa Lopez', xp: 3490 },
                    { rank: 8, name: 'Antonio Cruz', xp: 3245 },
                    { rank: 9, name: 'Elena Morales', xp: 3120 },
                    { rank: 10, name: 'Diego Torres', xp: 2950 },
                    ];
                    setLeaderboard(mockData);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
                setError('Failed to load leaderboard. Showing mock data.');
                // Fallback to mock data
                const mockData: StudentRank[] = [
                    { rank: 1, name: 'Maria Santos', xp: 4850, badge: '🏆' },
                    { rank: 2, name: 'Juan dela Cruz', xp: 4620, badge: '🥈' },
                    { rank: 3, name: 'Anna Reyes', xp: 4395, badge: '🥉' },
                    { rank: 4, name: 'Carlos Mendoza', xp: 3980 },
                    { rank: 5, name: 'Sofia Garcia', xp: 3750 },
                    { rank: 6, name: 'Miguel Ramos', xp: 3620 },
                    { rank: 7, name: 'Rosa Lopez', xp: 3490 },
                    { rank: 8, name: 'Antonio Cruz', xp: 3245 },
                    { rank: 9, name: 'Elena Morales', xp: 3120 },
                    { rank: 10, name: 'Diego Torres', xp: 2950 },
                ];
                setLeaderboard(mockData);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [timeframe]);

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return 'from-yellow-400 to-yellow-600';
            case 2: return 'from-slate-300 to-slate-500';
            case 3: return 'from-orange-300 to-orange-600';
            default: return 'from-slate-700 to-slate-900';
        }
    };

    const getMedalEmoji = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    return (
        <div className="min-h-full p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2">🏆 Listahan ng Lider</h1>
                    <p className="text-slate-400">Makita kung sino ang nangungunang estudyante</p>
                </div>

                {/* Timeframe Selector */}
                <div className="flex gap-3 mb-8">
                    {(['week', 'month', 'all'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                timeframe === tf
                                    ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/40'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            {tf === 'week' ? 'Lingguhan' : tf === 'month' ? 'Buwan' : 'Lahat ng Oras'}
                        </button>
                    ))}
                </div>

                {/* Leaderboard List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-brand-purple rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Top 3 - Special Cards */}
                        {leaderboard.slice(0, 3).map((student, idx) => (
                            <motion.div
                                key={student.rank}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-gradient-to-r ${getMedalColor(student.rank)} p-0.5 rounded-xl`}
                            >
                                <div className="bg-slate-900 rounded-lg p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-brand-sky flex items-center justify-center text-2xl font-black">
                                        {getMedalEmoji(student.rank)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold">{student.name}</h3>
                                        <p className="text-slate-400 text-sm">Ranggo #{student.rank}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-brand-purple">{student.xp}</div>
                                        <p className="text-xs text-slate-400">XP Points</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Remaining Students */}
                        {leaderboard.slice(3).map((student, idx) => (
                            <motion.div
                                key={student.rank}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (idx + 3) * 0.08 }}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 flex items-center gap-4 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                                    {student.rank}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold">{student.name}</h3>
                                </div>
                                <div className="text-right font-bold">
                                    <div className="text-brand-purple">{student.xp} XP</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 p-4 bg-brand-purple/10 border border-brand-purple/30 rounded-lg text-sm text-slate-300"
                >
                    💡 <span className="text-brand-purple font-semibold">Tip:</span> Kumpletuhing mga leksyon at assessment upang makuha ang mas maraming XP points!
                </motion.div>
            </motion.div>
        </div>
    );
};
