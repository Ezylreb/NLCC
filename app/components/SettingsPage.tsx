'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface SettingsPageProps {
    onBack: () => void;
    onLogout: () => void;
    user?: { firstName: string; lastName: string; email: string; class_name?: string } | null;
}

const SettingsPageComponent = ({ onBack, onLogout, user: initialUser }: SettingsPageProps) => {
    const [activeTab, setActiveTab] = useState<'account' | 'preferences'>('account');

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [account, setAccount] = useState({
        firstName: initialUser?.firstName || '',
        lastName: initialUser?.lastName || '',
        email: initialUser?.email || '',
        lrn: '',
        className: (initialUser as any)?.class_name || ''
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        darkMode: false,
        soundEffects: true
    });



    // Load from API on mount
    useEffect(() => {
        if (account.email) {
            fetchUserData(account.email);
        }
    }, [account.email]);

    const fetchUserData = async (email: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.user.fetchByEmail(email);
            if (response.success && response.data) {
                setAccount({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    lrn: response.data.lrn || '',
                    className: response.data.class_name || ''
                });
                if (response.data.preferences) {
                    setPreferences({
                        darkMode: !!response.data.preferences.darkMode,
                        soundEffects: !!response.data.preferences.soundEffects
                    });
                    if (response.data.preferences.darkMode) document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                }
            } else {
                console.log('User not found in DB, using defaults');
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSaveAllSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        try {
            // Extract user ID from email or account data
            const userId = account.email;
            const result = await apiClient.user.updateProfile(userId, {
                name: `${account.firstName} ${account.lastName}`,
                email: account.email,
                preferences: preferences
            });
            
            if (result.success) {
                showToast('All settings saved to database!');
            } else {
                showToast(result.error || 'Error connecting to server');
            }
        } catch (err) {
            showToast('Error connecting to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferenceChange = async (key: keyof typeof preferences, value: any) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        
        if (key === 'darkMode') {
            if (value) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        }

        showToast('Preference updated locally');
    };



    const tabs = [
        { id: 'account', label: 'Account', icon: '👤' },
        { id: 'preferences', label: 'Preferences', icon: '🎨' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-slate-50 bg-pattern z-[70] flex flex-col p-4 md:p-8 overflow-auto animate-in fade-in duration-500 selection:bg-brand-purple">
            {toastMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-in slide-in-from-top-4 duration-300">
                    {toastMessage}
                </div>
            )}
            <main className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                {/* Header/Back Button */}
                <header className="flex items-center mb-2 md:mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs uppercase hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <span>←</span> Back
                    </button>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight ml-4 md:ml-6">Settings</h1>
                </header>

                <section className="flex flex-col lg:flex-row gap-6 md:gap-8 pb-12">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
                        <div className="bg-white rounded-3xl md:rounded-[2rem] p-3 md:p-4 border border-slate-200 shadow-sm flex flex-row lg:flex-col gap-2 relative overflow-hidden overflow-x-auto lg:overflow-visible custom-scrollbar">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all focus:outline-none relative z-10 whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-brand-purple text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-brand-purple'
                                        }`}
                                >
                                    <span className="text-xl">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-4 border border-slate-200 shadow-sm mt-0 md:mt-4">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm text-red-500 hover:bg-red-50 transition-all focus:outline-none"
                            >
                                <span className="text-lg md:text-xl">🚪</span>
                                Sign Out
                            </button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-h-0">
                        <div className="bg-white rounded-3xl md:rounded-[3rem] p-6 md:p-12 border border-slate-200 shadow-sm h-full min-h-[400px] md:min-h-[500px] relative">
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-[2.5rem]">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                        <span className="font-black text-slate-900 tracking-tight">Syncing...</span>
                                    </div>
                                </div>
                            )}

                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <div className="flex flex-col gap-6 md:gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col gap-1 md:gap-2">
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Account Profile</h2>
                                        <p className="text-slate-500 font-bold text-[10px] md:text-xs">Update your personal information.</p>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-6 pb-6 border-b border-slate-100">
                                        <div className="relative">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-2xl md:text-4xl border border-slate-200">
                                                👤
                                            </div>
                                            <button className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform text-[10px] md:text-xs">
                                                ✏️
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-base md:text-lg font-black text-slate-800">Profile Picture</h3>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5 md:mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </div>

                                    <form className="flex flex-col gap-6" onSubmit={handleSaveAllSettings}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">First Name</label>
                                                <input type="text" value={account.firstName} onChange={(e) => setAccount({...account, firstName: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all font-bold text-slate-700" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                                                <input type="text" value={account.lastName} onChange={(e) => setAccount({...account, lastName: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all font-bold text-slate-700" />
                                            </div>
                                        </div>

                                         <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                            <input type="email" value={account.email} onChange={(e) => setAccount({...account, email: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all font-bold text-slate-700" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Student LRN</label>
                                                <input 
                                                    type="text" 
                                                    readOnly 
                                                    value={account.lrn || 'Not Assigned'} 
                                                    className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 cursor-not-allowed font-bold text-slate-400" 
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold ml-1">Assigned by Administrator</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enrollment</label>
                                                <input 
                                                    type="text" 
                                                    readOnly 
                                                    value={account.className || 'Not Enrolled'} 
                                                    className="px-4 py-3 rounded-xl border border-slate-200 bg-brand-purple/5 cursor-not-allowed font-black text-brand-purple" 
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold ml-1">Assigned Class Group</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2 md:pt-4">
                                            <button type="submit" className="w-full md:w-auto px-6 py-3 bg-brand-purple text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-purple/90 transition-colors">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Preferences Tab */}
                            {activeTab === 'preferences' && (
                                <div className="flex flex-col gap-6 md:gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col gap-1 md:gap-2">
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">App Preferences</h2>
                                        <p className="text-slate-500 font-bold text-[10px] md:text-xs">Customize your learning experience.</p>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                            <div>
                                                <h4 className="font-black text-slate-800">Dark Mode</h4>
                                                <p className="text-xs font-medium text-slate-500 mt-1">Adjust the appearance of the app.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={preferences.darkMode} onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                                            </label>
                                        </div>

                                        <div className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                            <div>
                                                <h4 className="font-black text-slate-800">Sound Effects</h4>
                                                <p className="text-xs font-medium text-slate-500 mt-1">Play sounds during lessons and achievements.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={preferences.soundEffects} onChange={(e) => handlePreferenceChange('soundEffects', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                                            </label>
                                        </div>

                                        {/* Language and Daily Goal removed per user request */}
                                        
                                        <div className="flex justify-end pt-2 md:pt-4">
                                            <button 
                                                onClick={() => handleSaveAllSettings()}
                                                className="w-full md:w-auto px-6 py-3 bg-brand-purple text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-purple/90 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>💾</span> Save Preferences
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}



                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export const SettingsPage = React.memo(SettingsPageComponent);
