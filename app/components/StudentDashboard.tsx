'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { MagAralPage } from './StudentComponents/MagAralPage';
import { StudentLeaderboard } from './StudentComponents/StudentLeaderboard';
import { StudentMissions } from './StudentComponents/StudentMissions';
import { StudentShop } from './StudentComponents/StudentShop';
import { StudentAvatarCustomization } from './StudentComponents/StudentAvatarCustomization';
import { AvatarDisplay } from './AvatarDisplay';

interface StudentDashboardProps {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; email?: string; lrn?: string; } | null;
    onStartLesson: (lessonId: string) => void;
}

type TabType = 'lessons' | 'leaders' | 'missions' | 'store' | 'avatar' | 'profile';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
    onLogout, 
    user,
    onStartLesson
}) => {
    // Initialize activeTab from localStorage
    const getInitialTab = (): TabType => {
        if (typeof window !== 'undefined') {
            const savedTab = localStorage.getItem('studentActiveTab');
            if (savedTab && ['lessons', 'leaders', 'missions', 'store', 'avatar', 'profile'].includes(savedTab)) {
                return savedTab as TabType;
            }
        }
        return 'lessons';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
    const [visitedTabs, setVisitedTabs] = useState<Record<TabType, boolean>>(() => {
        const initialTab = getInitialTab();
        return {
            lessons: initialTab === 'lessons',
            leaders: initialTab === 'leaders',
            missions: initialTab === 'missions',
            store: initialTab === 'store',
            avatar: initialTab === 'avatar',
            profile: initialTab === 'profile',
        };
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);

    // Profile edit states
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // Badges state
    const [completedMissions, setCompletedMissions] = useState<any[]>([]);
    const [trophies, setTrophies] = useState<any[]>([]);
    const [lessonsRefreshToken, setLessonsRefreshToken] = useState(0);
    const [leadersRefreshToken, setLeadersRefreshToken] = useState(0);
    const [missionsRefreshToken, setMissionsRefreshToken] = useState(0);

    // Save active tab to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('studentActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        setVisitedTabs((prev) => ({
            ...prev,
            [activeTab]: true,
        }));
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'lessons') {
            setLessonsRefreshToken((prev) => prev + 1);
        }

        if (activeTab === 'leaders') {
            setLeadersRefreshToken((prev) => prev + 1);
        }

        if (activeTab === 'missions') {
            setMissionsRefreshToken((prev) => prev + 1);
        }
    }, [activeTab]);

    const tabs = [
        { id: 'lessons' as const, label: 'Mag-Aral', icon: '📚' },
        { id: 'leaders' as const, label: 'Listahan ng Lider', icon: '🏆' },
        { id: 'missions' as const, label: 'Mga Misyon', icon: '🎯' },
        { id: 'store' as const, label: 'Tindahan', icon: '🏪' },
        { id: 'avatar' as const, label: 'Avatar', icon: '😊' },
        { id: 'profile' as const, label: 'Profile', icon: '👤' },
    ];

    // Fetch full user profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.email) {
                try {
                    const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile(data);
                        setEditFirstName(data.firstName || '');
                        setEditLastName(data.lastName || '');
                        setEditEmail(data.email || '');
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };
        fetchUserProfile();
    }, [user?.email]);

    // Fetch badges (completed missions + trophies) when profile tab is visited
    useEffect(() => {
        if (activeTab !== 'profile' || !user?.id) return;
        const fetchBadges = async () => {
            try {
                const [missionsRes, rewardsRes] = await Promise.all([
                    fetch('/api/student/missions', { headers: { 'x-student-id': user.id! } }),
                    fetch(`/api/student/rewards?studentId=${user.id}`)
                ]);
                if (missionsRes.ok) {
                    const mData = await missionsRes.json();
                    const missions = mData.data || mData.missions || [];
                    setCompletedMissions(missions.filter((m: any) => m.completed));
                }
                if (rewardsRes.ok) {
                    const rData = await rewardsRes.json();
                    setTrophies(rData.trophies || []);
                }
            } catch (err) {
                console.error('Error fetching badges:', err);
            }
        };
        fetchBadges();
    }, [activeTab, user?.id]);

    // Handle password change
    const handlePasswordChange = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword || !newPassword) {
            setPasswordError('Pakikompletuhin ang lahat ng field');
            return;
        }

        setIsLoadingPassword(true);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setPasswordSuccess('Matagumpay na nabago ang password!');
                setCurrentPassword('');
                setNewPassword('');
                setTimeout(() => setPasswordSuccess(''), 3000);
            } else {
                setPasswordError(data.error || 'Hindi nabago ang password');
            }
        } catch (error) {
            setPasswordError('May error sa pagbago ng password');
        } finally {
            setIsLoadingPassword(false);
        }
    };

    // Download avatar as image
    const handleDownloadAvatar = async () => {
        if (!avatarRef.current) return;

        try {
            const canvas = await html2canvas(avatarRef.current, {
                backgroundColor: null,
                scale: 2
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `avatar-${user?.firstName || 'student'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error downloading avatar:', error);
        }
    };

    // Handle profile update
    const handleProfileUpdate = async () => {
        setProfileError('');
        setProfileSuccess('');

        if (!editFirstName.trim() || !editLastName.trim()) {
            setProfileError('Pangalan ay kinakailangan');
            return;
        }

        if (!editEmail.trim() || !editEmail.includes('@')) {
            setProfileError('Valid email ay kinakailangan');
            return;
        }

        setIsLoadingProfile(true);

        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    firstName: editFirstName.trim(),
                    lastName: editLastName.trim(),
                    email: editEmail.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                setProfileSuccess('Matagumpay na na-update ang profile!');
                setUserProfile(data.user);
                setTimeout(() => setProfileSuccess(''), 3000);
            } else {
                setProfileError(data.error || 'Hindi ma-update ang profile');
            }
        } catch (error) {
            setProfileError('May error sa pag-update ng profile');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-linear-to-b from-slate-950 to-slate-900 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 bg-linear-to-b from-slate-900 to-slate-950 border-r border-white/10 flex flex-col relative z-50">
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
            <div className="flex-1 overflow-y-auto relative z-10">
                {visitedTabs.lessons && (
                    <div className={activeTab === 'lessons' ? 'w-full h-full' : 'hidden'}>
                        <MagAralPage
                            studentId={user?.id || ''}
                            studentName={`${user?.firstName} ${user?.lastName}`}
                            refreshToken={lessonsRefreshToken}
                            onNavigate={(view) => {
                                if (view === 'missions' || view === 'lessons' || view === 'leaders' || view === 'store' || view === 'avatar' || view === 'profile') {
                                    setActiveTab(view as TabType);
                                }
                            }}
                        />
                    </div>
                )}

                {visitedTabs.leaders && (
                    <div className={activeTab === 'leaders' ? 'w-full' : 'hidden'}>
                        <StudentLeaderboard studentId={user?.id || ''} refreshToken={leadersRefreshToken} />
                    </div>
                )}

                {visitedTabs.missions && (
                    <div className={activeTab === 'missions' ? 'w-full' : 'hidden'}>
                        <StudentMissions refreshToken={missionsRefreshToken} />
                    </div>
                )}

                {visitedTabs.store && (
                    <div className={activeTab === 'store' ? 'w-full' : 'hidden'}>
                        <StudentShop userId={user?.id || ''} />
                    </div>
                )}

                {visitedTabs.avatar && (
                    <div className={activeTab === 'avatar' ? 'w-full' : 'hidden'}>
                        <StudentAvatarCustomization />
                    </div>
                )}

                {visitedTabs.profile && (
                    <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={activeTab === 'profile' ? 'p-8' : 'hidden'}>
                            <h1 className="text-4xl font-black text-white mb-8">← Profile</h1>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-stretch">
                                {/* Left Side - Profile Information */}
                                <div className="space-y-6 flex flex-col">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white mb-4">Personal na Impormasyon</h3>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">Unang Pangalan</label>
                                            <input
                                                type="text"
                                                value={editFirstName}
                                                onChange={(e) => setEditFirstName(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                                placeholder="Ilagay ang unang pangalan"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">Apelyido</label>
                                            <input
                                                type="text"
                                                value={editLastName}
                                                onChange={(e) => setEditLastName(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                                placeholder="Ilagay ang apelyido"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">LRN Number</label>
                                            <input
                                                type="text"
                                                value={userProfile?.lrn || 'N/A'}
                                                readOnly
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-slate-400 font-medium cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                                placeholder="Ilagay ang email"
                                            />
                                        </div>

                                        {profileError && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                                {profileError}
                                            </div>
                                        )}

                                        {profileSuccess && (
                                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                                {profileSuccess}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleProfileUpdate}
                                            disabled={isLoadingProfile}
                                            className="w-full px-6 py-3 bg-linear-to-r from-brand-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
                                        >
                                            {isLoadingProfile ? 'Sinasave...' : 'I-save ang mga Pagbabago'}
                                        </button>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Baguhin ang Password</h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">Kasalukuyang password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                                        placeholder="Ilagay ang kasalukuyang password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        {showCurrentPassword ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">Bagong password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                                        placeholder="Ilagay ang bagong password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        {showNewPassword ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    • Minimum 6 characters<br />
                                                    • Kahit isang malaking letra (A-Z)<br />
                                                    • Kahit isang special character (!@#$%^&*, etc.)
                                                </p>
                                            </div>

                                            {passwordError && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                                    {passwordError}
                                                </div>
                                            )}

                                            {passwordSuccess && (
                                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                                    {passwordSuccess}
                                                </div>
                                            )}

                                            <button
                                                onClick={handlePasswordChange}
                                                disabled={isLoadingPassword}
                                                className="w-full px-6 py-3 bg-brand-purple hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
                                            >
                                                {isLoadingPassword ? 'Sinasave...' : 'I-Save ang Bagong Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Avatar Display */}
                                <div className="flex flex-col items-center justify-between h-full">
                                    <div className="w-full flex flex-col h-full">
                                        <div className="text-center mb-4">
                                            <h3 className="text-2xl font-bold text-white mb-2">Avatar</h3>
                                            <p className="text-slate-400 text-sm">Iyong personalized na avatar</p>
                                        </div>
                                        
                                        <div 
                                            ref={avatarRef}
                                            className="flex-1 w-full bg-linear-to-br from-purple-900/30 to-blue-900/30 border-4 border-white/20 rounded-2xl p-6 mb-4 flex items-center justify-center min-h-125"
                                        >
                                            <div className="w-full h-full flex items-center justify-center">
                                                {user?.id ? (
                                                    <div className="w-full h-full">
                                                        <AvatarDisplay studentId={user.id} size="lg" />
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-400 text-center">
                                                        <div className="text-6xl mb-4">😊</div>
                                                        <p>Loading avatar...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleDownloadAvatar}
                                            className="w-full px-8 py-3 bg-linear-to-r from-brand-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                                        >
                                            I-download
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side - Badges Achieved */}
                                <div className="flex flex-col h-full">
                                    <h3 className="text-2xl font-bold text-white mb-2 text-center">Mga Badge</h3>
                                    <p className="text-slate-400 text-sm text-center mb-4">Mga nakamit mula sa misyon at milestone</p>
                                    <div className="flex-1 bg-slate-800/30 border border-white/10 rounded-2xl p-4 overflow-y-auto max-h-150 space-y-3">
                                        {/* Trophies */}
                                        {trophies.length > 0 && trophies.map((trophy: any, i: number) => (
                                            <div key={`trophy-${i}`} className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                <span className="text-3xl">{trophy.icon || '🏆'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{trophy.title}</p>
                                                    <p className="text-yellow-400 text-xs">Trophy</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Completed Missions */}
                                        {completedMissions.length > 0 && completedMissions.map((mission: any, i: number) => (
                                            <div key={`mission-${i}`} className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                                <span className="text-3xl">🎯</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{mission.title}</p>
                                                    <p className="text-green-400 text-xs">+{mission.xp_reward} XP · +{mission.coin_reward} Coins</p>
                                                </div>
                                            </div>
                                        ))}

                                        {trophies.length === 0 && completedMissions.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                                <span className="text-5xl mb-4">🎖️</span>
                                                <p className="font-semibold">Wala pang badge</p>
                                                <p className="text-xs mt-1">Kumpletuhin ang mga misyon para makakuha!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
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
