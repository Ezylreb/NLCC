'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Parent3DBackground } from './Parent3DBackground';

interface DashboardProps {
    onBack: () => void;
    userId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack, userId }) => {
    const [stats, setStats] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await apiClient.user.getStats(userId);
                if (response.success) {
                    setStats(response.data?.stats || []);
                    setProgress(response.data?.progress || []);
                    setAchievements(response.data?.achievements || []);
                }
            } catch (err) {
                console.error('Failed to fetch user stats:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [userId]);

    return (
        <div className="fixed inset-0 z-[70] flex flex-col overflow-x-hidden overflow-y-auto selection:bg-brand-purple/30 custom-scrollbar bg-slate-950">
            {/* 3D Neural Analytical Background */}
            <Parent3DBackground />

            {/* Content Layer */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-20 flex flex-col gap-12 md:gap-20">
                <header className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 animate-in slide-in-from-top duration-700">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-2xl group hover:scale-105 transition-transform duration-500 shadow-purple-500/10">
                            📊
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tightest leading-none drop-shadow-2xl">
                                Parent <span className="text-brand-purple">Portal</span>
                            </h1>
                            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
                                Loading Student Academic Data...
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={onBack}
                        className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/20 to-brand-sky/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                            <span className="text-lg">↩</span> Return to Grid
                        </span>
                    </button>
                </header>

                {/* Stat Cards - Holographic Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 rounded-[3rem] bg-white/5 border border-white/10 animate-pulse" />
                        ))
                    ) : stats.map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative p-8 rounded-[3rem] bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-brand-purple/50 transition-all hover:bg-white/10 shadow-2xl overflow-hidden"
                        >
                            {/* Inner Glow */}
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-purple/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${stat.color?.includes('indigo') ? 'bg-brand-purple' : 'bg-brand-sky'} shadow-[0_0_10px_currentColor]`}></span>
                                {stat.label}
                            </h2>
                            <p className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 group-hover:scale-110 transition-transform origin-left">{stat.value}</p>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400 font-black text-xs flex items-center gap-1.5 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                                    ↑ {stat.trend}
                                </span>
                                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Growth</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Curriculum Section - Expanded to Full Width */}
                    {/* Curriculum Section - Expanded to Full Width */}
                    <section className="lg:col-span-12 xl:col-span-12 p-8 md:p-12 rounded-[3.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-3xl animate-in slide-in-from-left duration-1000">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none drop-shadow-lg">
                                    Curriculum <span className="text-brand-sky">Status</span>
                                </h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Updated in real-time</p>
                            </div>
                            <select className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 font-black text-white text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-purple/40 backdrop-blur-3xl">
                                <option className="bg-slate-900 text-white">Last 30 Days</option>
                                <option className="bg-slate-900 text-white">Full Archive</option>
                            </select>
                        </div>

                        <div className="space-y-10">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse" />
                                ))
                            ) : progress.length > 0 ? progress.map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                    className="flex flex-col gap-4 group"
                                >
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-white text-lg tracking-tight group-hover:text-brand-sky transition-colors">{item.label}</span>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Core Concept Mastery</span>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform origin-bottom">{item.val}</span>
                                            <span className="text-sm font-black text-slate-500 mb-1.5 uppercase">%</span>
                                        </div>
                                    </div>
                                    <div className="h-5 bg-white/5 rounded-2xl overflow-hidden border border-white/10 p-1.5 flex items-center">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.val}%` }}
                                            transition={{ duration: 2, ease: "circOut" }}
                                            className={`h-full bg-gradient-to-r ${idx % 2 === 0 ? 'from-brand-purple to-brand-sky' : 'from-brand-sky to-emerald-400'} rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]`}
                                        />
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center gap-6 opacity-40">
                                    <div className="text-6xl">📡</div>
                                    <p className="text-white font-black uppercase tracking-widest text-xs">Loading Data...</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <style jsx>{`
                .tracking-tightest { letter-spacing: -0.06em; }
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(139, 92, 246, 0.2); 
                    border-radius: 5px;
                    border: 3px solid transparent;
                    background-clip: content-box;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.4); }
            `}</style>
        </div>
    );
};
