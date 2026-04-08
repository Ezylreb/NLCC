'use client';

import React from 'react';
import Image from 'next/image';

interface TeacherSidebarProps {
    activeTab: 'overview' | 'classes' | 'profile';
    onTabChange: (tab: 'overview' | 'classes' | 'profile') => void;
    user: { firstName: string; lastName: string; id?: string } | null;
    isSidebarOpen: boolean;
    onSidebarClose: () => void;
    onLogout: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
    activeTab,
    onTabChange,
    user,
    isSidebarOpen,
    onSidebarClose,
    onLogout
}) => {
    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'classes', label: 'Classes', icon: '🏫' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <>
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onSidebarClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-[#020617] border-r border-slate-800 flex flex-col fixed md:relative inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:flex'}`}>
                {/* Logo Section */}
                <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-linear-to-r from-brand-purple to-brand-sky rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <Image src="/logo/logo.png" alt="NLLC Logo" width={36} height={36} className="rounded-xl relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-white font-black tracking-tight leading-none text-sm uppercase">NLLC Teacher</h1>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Learning Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-4">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onTabChange(item.id as any);
                                onSidebarClose();
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left group ${
                                activeTab === item.id
                                    ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                        >
                            <span className={`text-lg transition-transform group-hover:scale-125 ${activeTab === item.id ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-slate-800/50">
                    <div className="bg-slate-900/50 rounded-2xl p-4 mb-4 border border-slate-800">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logged in as</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center font-black text-xs text-white">
                                {user?.firstName?.[0] || 'T'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-white truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Faculty Leader</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/10"
                    >
                        <span>🚪</span> Log Out
                    </button>
                </div>
            </aside>
        </>
    );
};
