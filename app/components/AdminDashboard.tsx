'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AdminDashboardProps {
    onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
    const [settings, setSettings] = useState<any>({ maintenance_mode: false, signup_enabled: true });
    const [tempSettings, setTempSettings] = useState<any>({ maintenance_mode: false, signup_enabled: true });
    const [isChangingSettings, setIsChangingSettings] = useState(false);
    const [stats, setStats] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotalPages, setActivityTotalPages] = useState(1);
    const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [newStudent, setNewStudent] = useState({
        firstName: '',
        lastName: '',
        email: '',
        lrn: '',
        password: '',
        className: '',
    });
    const [newTeacher, setNewTeacher] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        className: '',
    });
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false); // This state is now for the generic "Add User" modal, but the instruction implies specific student/teacher modals. I will rename this to showCreateStudent for clarity based on the instruction's usage.
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showCreateStudent, setShowCreateStudent] = useState(false);
    const [showCreateTeacher, setShowCreateTeacher] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'TEACHER' | 'ADMIN'>('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!newStudent.firstName.trim() || !newStudent.lastName.trim() || !newStudent.email.trim() || !newStudent.password.trim() || !newStudent.lrn.trim()) {
            setError('All fields are required. Please fill out the form completely.');
            setIsLoading(false);
            return;
        }

        if (newStudent.lrn.length !== 12 || !/^\d+$/.test(newStudent.lrn)) {
            setError('Student LRN must be exactly 12 digits.');
            setIsLoading(false);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/create-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent),
            });

            const data = await response.json();

            if (response.ok) {
                setShowCreateStudent(false);
                setNewStudent({ firstName: '', lastName: '', email: '', lrn: '', password: '', className: '' });
                alert('✅ Student account created successfully!');
                fetchDashboardData();
            } else {
                setError(data.error || 'Failed to create student account.');
            }
        } catch (err) {
            console.error('Error creating student:', err);
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsCreating(true);

        if (!newTeacher.firstName.trim() || !newTeacher.lastName.trim() || !newTeacher.email.trim() || !newTeacher.password.trim()) {
            setError('All fields are required. Please fill out the form completely.');
            setIsCreating(false);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.email)) {
            setError('Please enter a valid email address.');
            setIsCreating(false);
            return;
        }

        if (newTeacher.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setIsCreating(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/create-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTeacher),
            });

            const data = await response.json();

            if (response.ok) {
                setShowCreateTeacher(false);
                setNewTeacher({ firstName: '', lastName: '', email: '', password: '', className: '' });
                alert('✅ Teacher account created successfully!');
                fetchDashboardData();
            } else {
                setError(data.error || 'Failed to create teacher account.');
            }
        } catch (err) {
            console.error('Error creating teacher:', err);
            setError('Connection error. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (selectedUser?.role !== 'TEACHER' && selectedUser?.lrn && selectedUser.lrn.length !== 12) {
            setError('Student LRN must be exactly 12 digits.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: selectedUser.firstName,
                    lastName: selectedUser.lastName,
                    email: selectedUser.email,
                    lrn: selectedUser.lrn,
                    role: selectedUser.role,
                    className: selectedUser.className
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowManageModal(false);
                alert('User updated successfully!');
                fetchDashboardData();
            } else {
                setError(data.error || 'Failed to update user');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        setError(null);
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setShowManageModal(false);
                alert('User deleted successfully');
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchDashboardData = async () => {
        setIsDataLoading(true); // Added to ensure loading state is shown
        try {
            const [statsRes, settingsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/settings')
            ]);
            
            if (statsRes.ok) {
                const statsData = await statsRes.json().catch(() => null);
                if (statsData) {
                    setStats(statsData.stats || []);
                    setRecentUsers(statsData.users || []);
                    setChartData(statsData.chartData || []);
                    if (statsData.activities) setRecentActivities(statsData.activities); // Ensure activities are updated
                }
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json().catch(() => null);
                if (settingsData) {
                    setSettings(settingsData);
                    setTempSettings(settingsData);
                }
            }
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsChangingSettings(true);
        try {
            // Update each changed setting
            const updates = Object.entries(tempSettings).map(([key, value]) => {
                if (settings[key] !== value) {
                    return fetch('/api/admin/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key, value })
                    });
                }
                return null;
            }).filter(u => u !== null);

            if (updates.length > 0) {
                await Promise.all(updates);
                setSettings(tempSettings);
                alert('System settings updated successfully!');
            }
        } catch (err) {
            console.error('Failed to update settings:', err);
            alert('Failed to update system settings.');
        } finally {
            setIsChangingSettings(false);
        }
    };

    const updateSetting = async (key: string, value: boolean) => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (response.ok) {
                setSettings({ ...settings, [key]: value });
            }
        } catch (err) {
            console.error('Failed to update setting:', err);
        }
    };

    const fetchActivities = async (page: number) => {
        setIsActivitiesLoading(true);
        try {
            const response = await fetch(`/api/admin/activities?page=${page}&limit=5`);
            const data = await response.json();
            if (response.ok) {
                setRecentActivities(data.activities);
                setActivityTotalPages(data.pagination.totalPages);
                setActivityPage(data.pagination.currentPage);
            }
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        } finally {
            setIsActivitiesLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData();
    }, []); // Initial load for stats

    React.useEffect(() => {
        if (activeTab === 'overview') {
            fetchActivities(activityPage);
        }
    }, [activityPage, activeTab]);

    return (
        <div className="min-h-screen bg-slate-900 flex selection:bg-brand-purple relative overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed md:relative inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:flex shrink-0'}`}>
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <Image src="/logo/logo.png" alt="NLLC Logo" width={40} height={40} className="rounded-xl shadow-lg shadow-slate-900 shrink-0" />
                    <div>
                        <h1 className="text-white font-black tracking-tight leading-none">NLLC Admin</h1>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'users', label: 'User Management', icon: '👥' },
                        { id: 'settings', label: 'System Settings', icon: '⚙️' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as typeof activeTab);
                                setIsSidebarOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${activeTab === tab.id
                                ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all text-left"
                    >
                        <span className="text-xl">🚪</span>
                        Log Out Securely
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-center">
                        <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner shadow-red-500/20">
                            🚪
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Log Out Securely?</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">
                            Are you sure you want to log out of the admin panel? You will need to re-authenticate to access this dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-3 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    onLogout();
                                }}
                                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                YES, LOGOUT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Teacher Modal */}
            {showCreateTeacher && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Create Teacher Account</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Teacher Registration</p>
                            </div>
                            <button onClick={() => setShowCreateTeacher(false)} className="text-2xl text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleCreateTeacher} className="flex flex-col gap-6">
                            {error && <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={newTeacher.firstName}
                                        onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                                        placeholder="Juan"
                                        className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Last Name</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={newTeacher.lastName}
                                        onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                                        placeholder="Dela Cruz"
                                        className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    required 
                                    type="email" 
                                    value={newTeacher.email}
                                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                                    placeholder="juan.delacruz@school.edu.ph"
                                    className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Password</label>
                                <input 
                                    required 
                                    type="password" 
                                    value={newTeacher.password}
                                    onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                                    placeholder="••••••"
                                    minLength={6}
                                    className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                />
                                <p className="text-[8px] text-slate-500 ml-1">Minimum 6 characters</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Class</label>
                                <select 
                                    value={newTeacher.className}
                                    onChange={(e) => setNewTeacher({...newTeacher, className: e.target.value})}
                                    className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors appearance-none"
                                >
                                    <option value="">No Class Assigned</option>
                                    <option value="Kinder 1">Kinder 1</option>
                                    <option value="Kinder 2">Kinder 2</option>
                                </select>
                            </div>

                            <button
                                disabled={isCreating}
                                type="submit"
                                className="bg-brand-purple text-white font-black py-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
                            >
                                {isCreating ? 'Processing...' : 'Register Teacher Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl text-white"
                        >
                            ☰
                        </button>
                        <div className="flex items-center gap-2">
                            <Image src="/logo/logo.png" alt="NLLC Logo" width={32} height={32} className="rounded-xl shadow-lg shadow-slate-900" />
                            <h1 className="text-white font-black tracking-tight">Admin</h1>
                        </div>
                    </div>
                    <button onClick={() => setShowLogoutModal(true)} className="text-red-400 text-sm font-bold bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">Logout</button>
                </header>

                <div className="flex-1 overflow-auto p-8 lg:p-12">

                    {/* Top Bar Area */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight capitalize mb-1">
                                {activeTab.replace('-', ' ')}
                            </h2>
                            <p className="text-slate-400 font-bold text-xs md:text-sm">Welcome back, Super Admin.</p>
                        </div>
                        {activeTab === 'users' && (
                            <div className="flex gap-4">
                            <button 
                                onClick={() => setShowCreateStudent(true)}
                                className="bg-brand-purple text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
                            >
                                + Create Student
                            </button>
                            <button 
                                onClick={() => setShowCreateTeacher(true)}
                                className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-black border border-slate-700 hover:bg-slate-700 transition-colors"
                            >
                                + Create Teacher
                            </button>
                        </div>
                        )}
                    </div>

                    {/* Registration Modal */}
                    {showCreateStudent && ( // Changed from showAddModal
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
                                
                                <header className="mb-8 relative z-10">
                                    <h3 className="text-2xl font-black text-white tracking-tight">Register Student</h3>
                                    <p className="text-slate-400 font-bold text-sm">Create a new student account with LRN.</p>
                                </header>

                                <form onSubmit={handleCreateStudent} className="flex flex-col gap-5 relative z-10">
                                    {error && <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Juan" 
                                                value={newStudent.firstName}
                                                onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="dela Cruz" 
                                                value={newStudent.lastName}
                                                onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student LRN (12 Digits)</label>
                                        <input 
                                            required
                                            type="text" 
                                            maxLength={12}
                                            placeholder="123456789012" 
                                            value={newStudent.lrn}
                                            onChange={(e) => setNewStudent({...newStudent, lrn: e.target.value.replace(/\D/g, '')})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Login Email</label>
                                        <input 
                                            required
                                            type="email" 
                                            placeholder="student@example.com" 
                                            value={newStudent.email}
                                            onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                                        <input 
                                            required
                                            type="password" 
                                            placeholder="••••••••" 
                                            value={newStudent.password}
                                            onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Class</label>
                                        <select 
                                            value={newStudent.className}
                                            onChange={(e) => setNewStudent({...newStudent, className: e.target.value})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors appearance-none"
                                        >
                                            <option value="">No Class Assigned</option>
                                            <option value="Kinder 1">Kinder 1</option>
                                            <option value="Kinder 2">Kinder 2</option>
                                        </select>
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setShowCreateStudent(false)} // Changed from setShowAddModal
                                            className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-3 bg-brand-purple text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {/* Manage User Modal */}
                    {showManageModal && selectedUser && (
                        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
                                
                                <header className="mb-8 relative z-10">
                                    <h3 className="text-2xl font-black text-white tracking-tight">
                                        Manage {selectedUser.role === 'TEACHER' ? 'Teacher' : 'Student'}
                                    </h3>
                                    <p className="text-slate-400 font-bold text-sm">
                                        {selectedUser.role === 'TEACHER' ? 'Update faculty credentials.' : 'Update account details or remove access.'}
                                    </p>
                                </header>

                                <form onSubmit={handleUpdateUser} className="flex flex-col gap-5 relative z-10">
                                    {error && <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={selectedUser.firstName || ''}
                                                onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={selectedUser.lastName || ''}
                                                onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                            />
                                        </div>
                                    </div>

                                    {selectedUser.role !== 'TEACHER' && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student LRN</label>
                                            <input 
                                                required
                                                type="text" 
                                                maxLength={12}
                                                value={selectedUser.lrn || ''}
                                                onChange={(e) => setSelectedUser({...selectedUser, lrn: e.target.value.replace(/\D/g, '')})}
                                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <input 
                                            required
                                            type="email" 
                                            value={selectedUser.email || ''}
                                            onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Class</label>
                                        <select 
                                            value={selectedUser.className || ''}
                                            onChange={(e) => setSelectedUser({...selectedUser, className: e.target.value})}
                                            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-purple transition-colors appearance-none"
                                        >
                                            <option value="">No Class Assigned</option>
                                            <option value="Kinder 1">Kinder 1</option>
                                            <option value="Kinder 2">Kinder 2</option>
                                        </select>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setShowManageModal(false)}
                                                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                                            >
                                                CANCEL
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={isLoading || isDeleting}
                                                className="flex-2 bg-brand-purple text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                                            </button>
                                        </div>
                                        
                                        <button 
                                            type="button"
                                            onClick={handleDeleteUser}
                                            disabled={isLoading || isDeleting}
                                            className="w-full mt-2 py-3 rounded-xl font-bold text-xs text-red-400 hover:bg-red-400/10 transition-colors border border-red-400/20"
                                        >
                                            {isDeleting ? 'DELETING...' : `DELETE ${selectedUser.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'} ACCOUNT`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-2xl shadow-inner ${stat.color}`}>
                                                {stat.icon}
                                            </div>
                                            <span className="text-green-400 text-xs font-black bg-green-400/10 px-2 py-1 rounded-lg">{stat.trend}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-4xl font-black text-white mb-1 tracking-tighter">{stat.value}</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts & Activity placeholder */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="col-span-1 lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-[2rem] p-8 flex flex-col">
                                    <h3 className="text-lg font-black text-white mb-6">User Growth Overview</h3>
                                    <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 flex items-end justify-between px-8 py-10 min-h-[300px] relative">
                                        {chartData.length > 0 ? (
                                            <>
                                                <div className="absolute inset-0 flex flex-col justify-between px-8 py-10 pointer-events-none">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className="w-full border-t border-slate-800/50 h-0"></div>
                                                    ))}
                                                </div>
                                                {chartData.map((item, i) => {
                                                    const maxVal = Math.max(...chartData.map(d => d.value));
                                                    const height = (item.value / maxVal) * 100;
                                                    return (
                                                        <div key={i} className="flex flex-col items-center gap-4 flex-1 group">
                                                            <div className="relative w-full flex justify-center items-end h-[180px]">
                                                                <div 
                                                                    className="w-8 bg-gradient-to-t from-brand-purple/20 to-brand-purple rounded-t-lg transition-all duration-700 group-hover:to-brand-purple/80 relative"
                                                                    style={{ height: `${height}%` }}
                                                                >
                                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20">
                                                                        {item.value} Users
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.day}</span>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <p className="text-slate-500 font-bold text-sm flex items-center gap-2"><span>📈</span> Chart Data Loading...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-[2rem] p-8 flex flex-col h-full">
                                    <h3 className="text-lg font-black text-white mb-6">Recent Activity</h3>
                                    <div className="flex flex-col gap-6 flex-1">
                                        {isActivitiesLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <div key={i} className="flex gap-4 animate-pulse">
                                                    <div className="w-2 h-2 rounded-full mt-1.5 bg-slate-700"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                                                        <div className="h-2 bg-slate-800 rounded w-1/4"></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : recentActivities.length > 0 ? (
                                            recentActivities.map((activity, idx) => (
                                                <div key={idx} className="flex gap-4 group cursor-default">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-150 shadow-[0_0_10px_rgba(147,51,234,0.5)] ${
                                                        activity.type === 'auth' ? 'bg-amber-400' : 
                                                        activity.type === 'system' ? 'bg-brand-purple' : 'bg-green-400'
                                                    }`}></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200 leading-tight group-hover:text-white transition-colors">{activity.log}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{activity.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-xs font-bold italic">No recent activity found.</p>
                                        )}
                                    </div>

                                    {/* Activity Pagination Controls */}
                                    <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between">
                                        <button 
                                            disabled={activityPage === 1 || isActivitiesLoading}
                                            onClick={() => setActivityPage(p => p - 1)}
                                            className="text-xs font-black text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors flex items-center gap-1"
                                        >
                                            ← PREV
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {[...Array(activityTotalPages)].map((_, i) => {
                                                const p = i + 1;
                                                // Only show 3 pages if there are many
                                                if (activityTotalPages > 3 && (p < activityPage - 1 || p > activityPage + 1)) {
                                                    if (p === 1 || p === activityTotalPages) return <span key={p} className="text-[10px] text-slate-600">.</span>;
                                                    return null;
                                                }
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => setActivityPage(p)}
                                                        className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all ${
                                                            activityPage === p 
                                                            ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20' 
                                                            : 'text-slate-500 hover:bg-slate-700 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button 
                                            disabled={activityPage === activityTotalPages || isActivitiesLoading}
                                            onClick={() => setActivityPage(p => p + 1)}
                                            className="text-xs font-black text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors flex items-center gap-1"
                                        >
                                            NEXT →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-[2rem] overflow-hidden animate-in fade-in duration-500">
                            <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row gap-4 items-center bg-slate-800/80">
                                <div className="relative w-full max-w-sm">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search name, email, or LRN..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium w-full focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all placeholder:text-slate-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Filter by Role:</span>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as any)}
                                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple transition-all cursor-pointer appearance-none min-w-[120px]"
                                    >
                                        <option value="all">ALL ROLES</option>
                                        <option value="USER">STUDENTS</option>
                                        <option value="TEACHER">TEACHERS</option>
                                        <option value="ADMIN">ADMINS</option>
                                    </select>
                                    {(searchQuery || roleFilter !== 'all') && (
                                        <button 
                                            onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                                            className="text-[10px] font-black text-brand-purple hover:text-brand-purple/80 uppercase tracking-widest ml-2 px-2 py-1 bg-brand-purple/10 rounded-lg transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-widest">
                                            <th className="p-4 font-black">User</th>
                                            <th className="p-4 font-black">Role / Class</th>
                                            <th className="p-4 font-black">LRN</th>
                                            <th className="p-4 font-black">Joined</th>
                                            <th className="p-4 font-black text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {(() => {
                                            const filteredUsers = (recentUsers || []).filter(user => {
                                                const search = searchQuery.toLowerCase();
                                                const name = (user.name || '').toLowerCase();
                                                const email = (user.email || '').toLowerCase();
                                                const lrn = (user.lrn || '').toLowerCase();
                                                
                                                const matchesSearch = name.includes(search) || email.includes(search) || lrn.includes(search);
                                                const matchesRole = roleFilter === 'all' || user.role === roleFilter;
                                                
                                                return matchesSearch && matchesRole;
                                            });

                                            if (filteredUsers.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-4xl grayscale">🔍</span>
                                                                <p className="text-slate-400 font-bold text-sm">
                                                                    {isDataLoading ? 'Fetching users...' : 'No users match your current filters.'}
                                                                </p>
                                                                {!isDataLoading && (
                                                                    <button 
                                                                        onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                                                                        className="text-xs font-black text-brand-purple hover:underline mt-2"
                                                                    >
                                                                        Reset all filters
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500 uppercase">
                                                                {(user.name || '?')[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm leading-none mb-1">{user.name || 'Unknown User'}</p>
                                                                <p className="text-slate-500 text-[10px] font-medium">{user.email || 'No Email'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded w-fit ${
                                                                user.role === 'TEACHER' ? 'bg-brand-sky/10 text-brand-sky border border-brand-sky/20' : 
                                                                user.role === 'ADMIN' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 
                                                                'bg-slate-800 text-slate-500 border border-slate-700'
                                                            }`}>
                                                                {user.role}
                                                            </span>
                                                            {user.className && (
                                                                <span className="text-[10px] font-black text-brand-purple uppercase tracking-tight">
                                                                    🎓 {user.className}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-300 text-[11px] font-black tracking-widest">{user.lrn || 'N/A'}</td>
                                                    <td className="p-4 text-slate-400 text-[11px] font-bold uppercase">{user.joinDate}</td>
                                                    <td className="p-4 text-right pr-8">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowManageModal(true);
                                                            }}
                                                            className="bg-slate-900 hover:bg-brand-purple hover:text-white border border-slate-800 hover:border-brand-purple text-slate-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl bg-slate-800/50 border border-slate-700/50 rounded-[2rem] p-8 animate-in fade-in duration-500">
                            <h3 className="text-xl font-black text-white mb-6">Global System Preferences</h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 transition-colors duration-500">
                                    <div>
                                        <h4 className="text-white font-bold">Maintenance Mode</h4>
                                        <p className="text-slate-500 text-xs mt-1">Prevent users from logging in while updating.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={tempSettings.maintenance_mode}
                                            onChange={(e) => setTempSettings({ ...tempSettings, maintenance_mode: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    </label>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 transition-colors duration-500">
                                    <div>
                                        <h4 className="text-white font-bold">New User Registrations</h4>
                                        <p className="text-slate-500 text-xs mt-1">Allow new parents to create accounts.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={tempSettings.signup_enabled !== false}
                                            onChange={(e) => setTempSettings({ ...tempSettings, signup_enabled: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-end">
                                    <button
                                        disabled={isChangingSettings || JSON.stringify(settings) === JSON.stringify(tempSettings)}
                                        onClick={handleSaveSettings}
                                        className="bg-brand-purple text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-purple/90 transition-all disabled:opacity-50"
                                    >
                                        {isChangingSettings ? 'Saving...' : 'Save Global Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};
