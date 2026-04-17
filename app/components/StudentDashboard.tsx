'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MagAralPage } from './StudentComponents/MagAralPage';
import { StudentLeaderboard } from './StudentComponents/StudentLeaderboard';
import { StudentMissions } from './StudentComponents/StudentMissions';
import { StudentShop } from './StudentComponents/StudentShop';
import { StudentAvatarCustomization } from './StudentComponents/StudentAvatarCustomization';

interface StudentDashboardProps {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; } | null;
    onStartLesson: (lessonId: string) => void;
}

type TabType = 'lessons' | 'leaders' | 'missions' | 'store' | 'avatar' | 'profile';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
    onLogout, 
    user,
    onStartLesson
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('lessons');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const tabs = [
        { id: 'lessons' as const, label: 'Mag-Aral', icon: '📚' },
        { id: 'leaders' as const, label: 'Listahan ng Lider', icon: '🏆' },
        { id: 'missions' as const, label: 'Mga Misyon', icon: '🎯' },
        { id: 'store' as const, label: 'Tindahan', icon: '🏪' },
        { id: 'avatar' as const, label: 'Avatar', icon: '😊' },
        { id: 'profile' as const, label: 'Profile', icon: '👤' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex bg-linear-to-b from-slate-950 to-slate-900 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 bg-linear-to-b from-slate-900 to-slate-950 border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="text-2xl font-black text-brand-purple">BrightStart</div>
                    <div className="text-xs text-slate-400 mt-2">Student</div>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                    {tabs.filter(t => t.id !== 'profile').map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-brand-purple text-white'
                                    : 'text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            <span className="mr-3">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="border-t border-white/10 p-4 space-y-3">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === 'profile'
                                ? 'bg-brand-purple text-white'
                                : 'text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        <span className="mr-3">👤</span>
                        Profile
                    </button>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-950/20 transition-all"
                    >
                        <span className="mr-3">🚪</span>
                        Logout
                    </button>
                </div>
                <div className="border-t border-white/10 p-4 text-xs text-slate-400">
                    <div>Signed in:</div>
                    <div className="text-white font-semibold mt-1 truncate">
                        {user?.firstName}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'lessons' && (
                        <motion.div
                            key="lessons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <MagAralPage
                                studentId={user?.id || ''}
                                studentName={`${user?.firstName} ${user?.lastName}`}
                                onNavigate={(view) => {
                                    if (view === 'dashboard') {
                                        setActiveTab('lessons');
                                    }
                                }}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'leaders' && (
                        <motion.div key="leaders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                            <StudentLeaderboard />
                        </motion.div>
                    )}

                    {activeTab === 'missions' && (
                        <motion.div key="missions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                            <StudentMissions />
                        </motion.div>
                    )}

                    {activeTab === 'store' && (
                        <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                            <StudentShop />
                        </motion.div>
                    )}

                    {activeTab === 'avatar' && (
                        <motion.div key="avatar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                            <StudentAvatarCustomization studentId={user?.id} />
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <h1 className="text-4xl font-black text-white mb-8">Profile</h1>
                            <div className="max-w-2xl space-y-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-slate-400 text-sm">First Name</p>
                                    <p className="text-white font-semibold">{user?.firstName}</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-slate-400 text-sm">Last Name</p>
                                    <p className="text-white font-semibold">{user?.lastName}</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-slate-400 text-sm">XP Points</p>
                                    <p className="text-white font-semibold">1,250 XP</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-slate-400 text-sm">Coins</p>
                                    <p className="text-white font-semibold">340 Coins</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-sm"
                        >
                            <h2 className="text-xl font-black text-white mb-4">Logout</h2>
                            <p className="text-slate-400 mb-6">Are you sure you want to logout?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
