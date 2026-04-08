'use client';

import React, { useState } from 'react';

interface TeacherProfilePageProps {
    user: {
        firstName: string;
        lastName: string;
        email?: string;
        id?: string;
    } | null;
    onUpdate?: (data: any) => void;
}

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({ user, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
    });

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(formData);
        }
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700 max-w-2xl mx-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-brand-purple to-brand-purple/50 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-5xl font-black shadow-lg">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">{user?.firstName} {user?.lastName}</h2>
                        <p className="text-white/80 font-bold text-sm mt-1">Faculty Leader</p>
                        <p className="text-white/60 text-xs mt-2 uppercase tracking-wide">{user?.email || 'No email registered'}</p>
                    </div>
                </div>
            </div>

            {/* Profile Information */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-white">Profile Information</h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        firstName: user?.firstName || '',
                                        lastName: user?.lastName || '',
                                        email: user?.email || '',
                                    });
                                }}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">First Name</span>
                            <span className="text-sm font-black text-white">{user?.firstName}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Name</span>
                            <span className="text-sm font-black text-white">{user?.lastName}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</span>
                            <span className="text-sm font-black text-white">{user?.email || 'Not set'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-6 text-center">
                    <div className="text-4xl font-black text-brand-purple mb-2">📊</div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Account Status</p>
                    <p className="text-lg font-black text-white">Active</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-6 text-center">
                    <div className="text-4xl font-black text-brand-sky mb-2">🎓</div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Role</p>
                    <p className="text-lg font-black text-white">Faculty Leader</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-6 text-center">
                    <div className="text-4xl font-black text-emerald-400 mb-2">✓</div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Account Verified</p>
                    <p className="text-lg font-black text-white">Yes</p>
                </div>
            </div>
        </div>
    );
};
