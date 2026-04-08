'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AssessmentModal } from './AssessmentModal';

interface StudentDashboardProps {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; } | null;
    onStartLesson: (lessonId: string) => void;
}

interface Assessment {
    id: string;
    title: string;
    type: 'multiple-choice' | 'short-answer' | 'checkbox' | 'media-audio' | 'scramble' | 'matching';
    instructions: string;
    reward: number;
    questions: any[];
}

type TabType = 'lessons' | 'leaders' | 'missions' | 'store' | 'avatar' | 'profile';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
    onLogout, 
    user,
    onStartLesson
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('lessons');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

    const handleAssessmentSubmit = async (data: any) => {
        setIsSubmittingAssessment(true);
        try {
            const res = await fetch('/api/student/submit-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    studentId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Assessment submitted! +' + (selectedAssessment?.reward || 0) + ' ⭐ Stars');
                setShowAssessmentModal(false);
                setSelectedAssessment(null);
            } else {
                const error = await res.json();
                alert('❌ Error: ' + error.error);
            }
        } catch (err) {
            console.error('Error submitting assessment:', err);
            alert('❌ Failed to submit assessment');
        } finally {
            setIsSubmittingAssessment(false);
        }
    };

    const openAssessment = (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        setShowAssessmentModal(true);
    };

    const characterImages = [
        '/Character/NLLCTeachHalf1.png',
        '/Character/NLLCTeachHalf2.png',
        '/Character/NLLCTeachHalf3.png',
        '/Character/NLLCTeachHalf4.png',
    ];

    const bahagis = [
        { id: 1, title: 'Mag-alok at tumanggap ng inumin', isOpen: true },
        { id: 2, title: 'Pagkilala sa mga salita', isOpen: false },
        { id: 3, title: 'Pag-unawa ng konteksto', isOpen: false },
        { id: 4, title: 'Paglikha ng sariling pangungusap', isOpen: false },
        { id: 5, title: 'Makipag-usap nang tumpak', isOpen: false },
        { id: 6, title: 'Pagsusuri ng tekstong Tagalog', isOpen: false },
    ];

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
                            className="p-8"
                        >
                            <div className="mb-8">
                                <h1 className="text-4xl font-black text-white mb-2">Mag-Aral</h1>
                                <p className="text-slate-400">Tamaan ang iyong mga layunin</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bahagis.map((bahagi, idx) => (
                                    <motion.div
                                        key={bahagi.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative rounded-3xl overflow-hidden transition-all ${
                                            bahagi.isOpen ? 'cursor-pointer hover:scale-105' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="bg-linear-to-br from-brand-purple via-purple-600 to-purple-700 p-6 min-h-96 flex flex-col relative">
                                            {/* Lock Badge */}
                                            {!bahagi.isOpen && (
                                                <div className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-lg shadow-lg">
                                                    🔒
                                                </div>
                                            )}

                                            {/* Header with Title and Libro Button */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <h3 className="text-base font-black text-white flex-1">
                                                    {bahagi.title}
                                                </h3>
                                                <button
                                                    onClick={() => bahagi.isOpen && onStartLesson(`bahagi-${bahagi.id}`)}
                                                    disabled={!bahagi.isOpen}
                                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                                                        bahagi.isOpen
                                                            ? 'bg-white text-slate-900 hover:shadow-lg'
                                                            : 'bg-white/50 text-slate-700 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <span>📖</span>
                                                    LIBRO
                                                </button>
                                            </div>

                                            {/* Character Image */}
                                            <div className="flex-1 flex items-center justify-center py-4 relative">
                                                <div className="w-32 h-32">
                                                    <Image
                                                        src={characterImages[idx % 4]}
                                                        alt="character"
                                                        fill
                                                        className="object-contain drop-shadow-lg"
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-4 justify-center items-end mt-6">
                                                {/* Simulan */}
                                                <button
                                                    onClick={() => bahagi.isOpen && onStartLesson(`bahagi-${bahagi.id}`)}
                                                    disabled={!bahagi.isOpen}
                                                    className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-2xl transition-all hover:scale-110 active:scale-95 shadow-lg ${
                                                        bahagi.isOpen
                                                            ? 'bg-white text-slate-900'
                                                            : 'bg-white/50 text-slate-700 cursor-not-allowed'
                                                    }`}
                                                    title="Simulan"
                                                >
                                                    ⭐
                                                </button>

                                                {/* Test */}
                                                <button
                                                    onClick={() => openAssessment({
                                                        id: `assessment-${bahagi.id}-1`,
                                                        title: `Assessment: ${bahagi.title}`,
                                                        type: 'multiple-choice',
                                                        instructions: 'Answer these questions about the lesson',
                                                        reward: 25,
                                                        questions: [
                                                            {
                                                                question: 'What is the main topic of this lesson?',
                                                                options: ['Option A', 'Option B', 'Option C', 'Option D']
                                                            }
                                                        ]
                                                    })}
                                                    disabled={!bahagi.isOpen}
                                                    className={`flex flex-col items-center group ${bahagi.isOpen ? 'cursor-pointer' : 'opacity-50'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full ${bahagi.isOpen ? 'bg-white hover:scale-110' : 'bg-white/50'} flex items-center justify-center text-lg transition-all shadow-lg`}>
                                                        ✏️
                                                    </div>
                                                    <span className="text-xs text-white font-bold mt-1">TEST</span>
                                                    {bahagi.isOpen && <span className="text-[10px] text-white/70 mt-0.5 font-bold">+25⭐</span>}
                                                </button>

                                                {/* Trophy */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-lg">
                                                        🏆
                                                    </div>
                                                    <span className="text-xs text-white font-bold mt-1">GIFT</span>
                                                </div>
                                            </div>

                                            {/* Yunit Badge */}
                                            <div className="mt-4 text-center">
                                                <span className="inline-block bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                                                    4 Leksyon
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'leaders' && (
                        <motion.div key="leaders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <h1 className="text-4xl font-black text-white mb-8">Listahan ng Lider</h1>
                            <div className="text-slate-400">Coming soon...</div>
                        </motion.div>
                    )}

                    {activeTab === 'missions' && (
                        <motion.div key="missions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <h1 className="text-4xl font-black text-white mb-8">Mga Misyon</h1>
                            <div className="text-slate-400">Coming soon...</div>
                        </motion.div>
                    )}

                    {activeTab === 'store' && (
                        <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <h1 className="text-4xl font-black text-white mb-8">Tindahan</h1>
                            <div className="text-slate-400">Coming soon...</div>
                        </motion.div>
                    )}

                    {activeTab === 'avatar' && (
                        <motion.div key="avatar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <h1 className="text-4xl font-black text-white mb-8">✨ Avatar Customization</h1>
                            <div className="text-slate-400">Coming soon...</div>
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

            {/* Assessment Modal */}
            {selectedAssessment && (
                <AssessmentModal
                    isOpen={showAssessmentModal}
                    onClose={() => {
                        setShowAssessmentModal(false);
                        setSelectedAssessment(null);
                    }}
                    assessment={selectedAssessment}
                    onSubmit={handleAssessmentSubmit}
                    isLoading={isSubmittingAssessment}
                />
            )}

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
