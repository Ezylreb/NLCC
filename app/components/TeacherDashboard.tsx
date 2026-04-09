'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { TeacherBahagi } from './TeacherBahagi';
import { TeacherLessonEditor } from './TeacherLessonEditor';
import { BahagiCard } from './BahagiCard';
import { ManageClassStudents } from './TeacherComponents/ManageClassStudents';

interface TeacherDashboardProps {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; class_name?: string } | null;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout, user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'content' | 'assignments' | 'bahagis' | 'manage-class'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [allStudentExplorersList, setAllStudentExplorersList] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [lessons, setLessons] = useState<any[]>([]);
    const [weeklyChart, setWeeklyChart] = useState<{label:string,value:number}[]>([]);
    const [monthlyChart, setMonthlyChart] = useState<{label:string,value:number}[]>([]);
    const [chartView, setChartView] = useState<'weekly'|'monthly'>('weekly');
    const [showCreateLesson, setShowCreateLesson] = useState(false);
    const [newLesson, setNewLesson] = useState({ title: '', description: '', category: 'Reading', icon: '📚' });
    const [newItems, setNewItems] = useState([{ primaryText: '', secondaryText: '', imageEmoji: '⭐', linkUrl: '' }]);
    
    // Assignment State
    const [assignments, setAssignments] = useState<any[]>([]);
    const [showCreateAssignment, setShowCreateAssignment] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', reward: '10', dueDate: '', icon: '📝' });
    const [isSavingAssignment, setIsSavingAssignment] = useState(false);
    const [isEditingAssignment, setIsEditingAssignment] = useState(false);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

    // Lesson Links State
    const [lessonLinks, setLessonLinks] = useState<any[]>([]);
    const [showPostLink, setShowPostLink] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', url: '', description: '', icon: '🔗' });
    const [isSavingLink, setIsSavingLink] = useState(false);

    // Student Detail State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentDetailsError, setStudentDetailsError] = useState('');

    // Assignment Stats State
    const [selectedAssignmentStats, setSelectedAssignmentStats] = useState<any[]>([]);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [statAssignmentTitle, setStatAssignmentTitle] = useState('');

    // Bahagi State
    const [bahagis, setBahagis] = useState<any[]>([]);
    const [showBahagiModal, setShowBahagiModal] = useState(false);
    const [showLessonEditor, setShowLessonEditor] = useState(false);
    const [selectedBahagiForEdit, setSelectedBahagiForEdit] = useState<any>(null);
    const [isBahagiLoading, setIsBahagiLoading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Online' | 'Offline' | 'Idle'>('all');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleFileUpload = async (file: File, target: 'lesson' | number) => {
        const uploadKey = target === 'lesson' ? 'lesson' : `item-${target}`;
        setIsUploading(prev => ({ ...prev, [uploadKey]: true }));
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await res.json();
            if (res.ok) {
                if (target === 'lesson') {
                    setNewLesson(prev => ({ ...prev, icon: data.url }));
                } else {
                    const updated = [...newItems];
                    updated[target].imageEmoji = data.url;
                    setNewItems(updated);
                }
            } else {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };


    const handleViewAssignmentStats = async (assignmentId: string, title: string) => {
        setIsStatsLoading(true);
        setIsStatsModalOpen(true);
        setStatAssignmentTitle(title);
        try {
            const res = await fetch(`/api/teacher/assignment-stats?assignmentId=${assignmentId}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedAssignmentStats(data.completions || []);
            } else {
                console.error('Stats Error:', data.error);
                setSelectedAssignmentStats([]);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setSelectedAssignmentStats([]);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const handleEditLesson = async (lessonId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/lessons/${lessonId}`);
            const data = await res.json();
            if (res.ok) {
                setNewLesson({
                    title: data.title,
                    description: data.description || '',
                    category: data.category || 'Reading',
                    icon: data.icon || '📚'
                });
                setNewItems(data.items.map((i: any) => ({
                    primaryText: i.primary || i.word || '',
                    secondaryText: i.secondary || i.sentence || '',
                    imageEmoji: i.image || '⭐',
                    pronunciation: i.pronunciation || '',
                    linkUrl: i.link_url || ''
                })));
                setEditingLessonId(lessonId);
                setIsEditing(true);
                setShowCreateLesson(true);
            }
        } catch (err) {
            console.error('Failed to fetch lesson details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('🛑 Sigurado ka ba? Are you sure you want to delete this lesson? This cannot be undone.')) return;
        
        try {
            const res = await fetch(`/api/teacher/delete-lesson?id=${lessonId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Aralin Deleted! Success.');
                setLessons(prev => prev.filter(l => l.id !== lessonId));
            } else {
                throw new Error(data.error || 'Deletion failed');
            }
        } catch (err: any) {
            console.error('Failed to delete lesson:', err);
            alert(`🛑 Error: Hindi ma-delete ang aralin. ${err.message}`);
        }
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm('🛑 Sigurado ka ba? This will delete the assignment and all student progress associated with it!')) return;
        try {
            const res = await fetch(`/api/teacher/delete-assignment?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAssignments(assignments.filter((a: any) => a.id !== id));
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
        } catch (err: any) {
            alert(`🛑 Error deleting assignment: ${err.message}`);
        }
    };

    const handleEditAssignment = (id: string) => {
        const assignment = assignments.find((a: any) => a.id === id);
        if (assignment) {
            setNewAssignment({
                title: assignment.title,
                description: assignment.description || '',
                reward: assignment.reward?.toString() || '10',
                dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
                icon: assignment.icon || '📝'
            });
            setEditingAssignmentId(id);
            setIsEditingAssignment(true);
            setShowCreateAssignment(true);
        }
    };

    const handleViewStudentDetails = async (studentId: string) => {
        try {
            setShowStudentModal(true);
            setSelectedStudent(null);
            setStudentDetailsError('');
            const res = await fetch(`/api/teacher/student-detail?studentId=${studentId}`);
            if (!res.ok) throw new Error('Failed to load student tracking details');
            const data = await res.json();
            setSelectedStudent(data);
        } catch (err: any) {
            setStudentDetailsError(err.message);
        }
    };

    const fetchData = async () => {
        if (!user?.id) return;
        setIsSyncing(true);
        setIsLoading(true);
        try {
            // 1. Fetch Teacher Stats & Students (with cache-buster)
            const statsResponse = await fetch(`/api/teacher/stats?teacherId=${user.id}&v=${Date.now()}`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats || []);
                setAllStudentExplorersList(statsData.students || []);
                const currentClasses = statsData.classes || [];
                setClasses(currentClasses);
                setWeeklyChart(statsData.weeklyChart || []);
                setMonthlyChart(statsData.monthlyChart || []);
                if (statsData._debug) setDebugInfo(statsData._debug);

                // 2. Fetch Class-Specific Lessons
                const teacherClass = user?.class_name || (user as any)?.className || currentClasses?.[0]?.name;
                const lessonRes = await fetch(`/api/admin/stats?className=${teacherClass || ''}&v=${Date.now()}`);
                if (lessonRes.ok) {
                    const lessonData = await lessonRes.json();
                    setLessons(lessonData.lessons || []);
                }
            }

            // 3. Fetch Assignments
            const assignmentRes = await fetch(`/api/teacher/assignments?v=${Date.now()}`);
            if (assignmentRes.ok) {
                const assignmentData = await assignmentRes.json();
                setAssignments(assignmentData.assignments || []);
            }

            // 4. Fetch Lesson Links
            const linksRes = await fetch(`/api/teacher/lesson-links?v=${Date.now()}`);
            if (linksRes.ok) {
                const linksData = await linksRes.json();
                setLessonLinks(linksData.links || []);
            }

            // 5. Fetch Bahagis (New Course System)
            const bahagisRes = await fetch(`/api/teacher/bahagi?v=${Date.now()}`);
            if (bahagisRes.ok) {
                const bahagisData = await bahagisRes.json();
                setBahagis(bahagisData.bahagis || []);
            }
        } catch (error) {
            console.error('Failed to fetch teacher dashboard data:', error);
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) fetchData();
    }, [activeTab]);

    // Bahagi Handlers
    const handleCreateBahagi = async (data: any) => {
        try {
            const res = await fetch('/api/teacher/bahagi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, teacherId: user?.id })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to create bahagi');
            
            setBahagis([result.bahagi, ...bahagis]);
            setShowBahagiModal(false);
            alert('✅ Bahagi created successfully!');
        } catch (err: any) {
            alert(`🛑 Error: ${err.message}`);
        }
    };

    const handleDeleteBahagi = async (bahagiId: string) => {
        if (!confirm('🛑 Are you sure? This will delete the entire Bahagi and all associated lessons and assessments!')) return;
        try {
            const res = await fetch(`/api/teacher/bahagi/${bahagiId}`, { method: 'DELETE' });
            if (res.ok) {
                setBahagis(bahagis.filter(b => b.id !== bahagiId));
                alert('✅ Bahagi deleted successfully!');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
        } catch (err: any) {
            alert(`🛑 Error: ${err.message}`);
        }
    };

    const handleEditBahagi = (bahagi: any) => {
        setSelectedBahagiForEdit(bahagi);
        setShowLessonEditor(true);
    };

    const handleBahagiSave = async (bahagiId: string, status: 'open' | 'archived') => {
        try {
            const res = await fetch(`/api/teacher/bahagi/${bahagiId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_open: status === 'open' })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to update');
            
            setBahagis(bahagis.map(b => b.id === bahagiId ? result.bahagi : b));
            alert(`✅ Bahagi ${status === 'open' ? 'opened' : 'archived'}!`);
        } catch (err: any) {
            alert(`🛑 Error: ${err.message}`);
        }
    };

    const handlePostLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink.title || !newLink.url) return;
        setIsSavingLink(true);
        try {
            const res = await fetch('/api/teacher/lesson-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newLink, teacherId: user?.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to post link');
            setLessonLinks([data.link, ...lessonLinks]);
            setShowPostLink(false);
            setNewLink({ title: '', url: '', description: '', icon: '🔗' });
        } catch (err: any) {
            alert(`🛑 ${err.message}`);
        } finally {
            setIsSavingLink(false);
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;
        try {
            const res = await fetch(`/api/teacher/lesson-links?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setLessonLinks(lessonLinks.filter(l => l.id !== id));
            }
        } catch (err) {
            console.error('Delete link error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex selection:bg-brand-purple text-slate-200 relative overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-90 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-[#020617] border-r border-slate-800 flex flex-col fixed md:relative inset-y-0 left-0 z-100 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:flex'}`}>
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

                <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'bahagis', label: 'Course Sections', icon: '🎯' },
                        { id: 'content', label: 'My Lessons', icon: '📚' },
                        { id: 'assignments', label: 'Assignments', icon: '📝' },
                        { id: 'classes', label: 'My Classes', icon: '🏫' },
                        { id: 'students', label: 'Student Progress', icon: '🎓' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                setIsSidebarOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left group ${
                                activeTab === tab.id
                                    ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                        >
                            <span className={`text-lg transition-transform group-hover:scale-125 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

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
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/10"
                    >
                        <span>🚪</span> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-[#020617]/50 backdrop-blur-md border-b border-slate-800/50 p-4 md:p-6 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center md:hidden"
                        >
                            <span className="text-xl">☰</span>
                        </button>
                        <div>
                            <h2 className="text-lg md:text-2xl font-black text-white tracking-tight capitalize">
                                {activeTab} <span className="text-brand-purple">Dashboard</span>
                            </h2>
                            <p className="hidden sm:block text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Academic Year 2025-2026</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Live</p>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={isSyncing}
                            title="Sync all data"
                            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-brand-purple/50 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all disabled:opacity-70"
                        >
                            {isSyncing ? (
                                <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <span className="text-base">🔄</span>
                            )}
                            <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 custom-scrollbar relative">
                    {/* Sync overlay */}
                    {isSyncing && (
                        <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none">
                            <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Data...</p>
                        </div>
                    )}
                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-brand-purple/30 transition-all group">
                                        <div className="flex justify-start items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                                {stat.icon}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-black text-white mb-1 tracking-tighter">{stat.value}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Recent Progress Chart Placeholder */}
                                <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800/50 rounded-4xl p-8">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-lg font-black text-white">Class Progress Trends</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setChartView('weekly')}
                                                className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                                                    chartView === 'weekly'
                                                        ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20'
                                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                            >Weekly</button>
                                            <button
                                                onClick={() => setChartView('monthly')}
                                                className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                                                    chartView === 'monthly'
                                                        ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20'
                                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                            >Monthly</button>
                                        </div>
                                    </div>
                                    {/* Bar Chart */}
                                    {(() => {
                                        const data = chartView === 'weekly' ? weeklyChart : monthlyChart;
                                        const maxVal = Math.max(...data.map(d => d.value), 1);
                                        return (
                                            <div className="h-64 bg-slate-950/50 rounded-2xl border border-slate-900 flex flex-col px-4 pt-4 pb-2 relative overflow-hidden">
                                                {/* Grid lines */}
                                                <div className="absolute inset-0 flex flex-col justify-between px-4 py-4 pointer-events-none">
                                                    {[100, 75, 50, 25, 0].map(v => (
                                                        <div key={v} className="flex items-center gap-2">
                                                            <span className="text-[8px] font-black text-slate-700 w-5 text-right">{v}</span>
                                                            <div className="flex-1 border-t border-slate-800/60" />
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Bars */}
                                                <div className="flex-1 flex items-end justify-around gap-2 relative z-10 pb-6">
                                                    {data.map((item, i) => (
                                                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                                                            <span className="text-[9px] font-black text-brand-purple opacity-0 group-hover:opacity-100 transition-opacity">{item.value}%</span>
                                                            <div
                                                                className="w-full rounded-t-lg bg-linear-to-t from-brand-purple/40 to-brand-purple transition-all duration-700 relative"
                                                                style={{ height: `${(item.value / maxVal) * 150}px`, minHeight: item.value > 0 ? '4px' : '0' }}
                                                            >
                                                                <div className="absolute inset-x-0 top-0 h-1 bg-brand-purple/60 rounded-t-lg" />
                                                            </div>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {data.every(d => d.value === 0) && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                        <span className="text-2xl opacity-30">📊</span>
                                                        <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">No progress data yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Active Students List */}
                                <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/50 rounded-4xl p-8">
                                    <h3 className="text-lg font-black text-white mb-6">Student Activity</h3>
                                    <div className="flex flex-col gap-5">
                                        {allStudentExplorersList.map(student => (
                                            <div key={student.id} className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center relative shadow-sm">
                                                    <span className="text-xs font-black text-slate-400">{student.name[0]}</span>
                                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                                        student.status === 'Online' ? 'bg-emerald-500' : student.status === 'Idle' ? 'bg-amber-500' : 'bg-slate-600'
                                                    }`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white truncate group-hover:text-brand-purple transition-colors">{student.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-linear-to-r from-brand-purple to-brand-sky rounded-full transition-all duration-500" style={{ width: `${student.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-500">{student.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('students')}
                                        className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all hover:text-white"
                                    >
                                        View All Students
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bahagis' && (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-white">Course Sections (Bahagi)</h3>
                                    <p className="text-slate-500 font-bold text-xs mt-1">Organize content into structured learning sections</p>
                                </div>
                                <button 
                                    onClick={() => setShowBahagiModal(true)}
                                    className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                >
                                    + Create New Bahagi
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bahagis.length > 0 ? bahagis.map(bahagi => (
                                    <BahagiCard 
                                        key={bahagi.id}
                                        id={bahagi.id}
                                        title={bahagi.title}
                                        yunit={bahagi.yunit}
                                        image={bahagi.image_url || 'https://via.placeholder.com/400x200?text=Course'}
                                        description={bahagi.description}
                                        isOpen={bahagi.is_open}
                                        lessonCount={bahagi.lessonCount || 0}
                                        assessmentCount={bahagi.assessmentCount || 0}
                                        totalXP={bahagi.totalXP || 0}
                                        onEdit={() => handleEditBahagi(bahagi)}
                                        onDelete={() => handleDeleteBahagi(bahagi.id)}
                                        onToggleStatus={(newStatus) => handleBahagiSave(bahagi.id, newStatus ? 'open' : 'archived')}
                                        onOpenEditor={() => handleEditBahagi(bahagi)}
                                    />
                                )) : (
                                    <div className="col-span-full py-20 bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                                        <span className="text-5xl mb-4">📭</span>
                                        <h4 className="text-lg font-black text-white">No Course Sections Yet</h4>
                                        <p className="text-slate-500 text-xs font-bold max-w-xs mt-2">Create your first Bahagi to start organizing your lessons and assessments!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-white">My Managed Lessons</h3>
                                <button 
                                    onClick={() => {
                                        setNewLesson({ title: '', description: '', category: 'Reading', icon: '📚' });
                                        setNewItems([{ primaryText: '', secondaryText: '', imageEmoji: '⭐', linkUrl: '' }]);
                                        setIsEditing(false);
                                        setEditingLessonId(null);
                                        setShowCreateLesson(true);
                                    }}
                                    className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                >
                                    + Create New Lesson
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lessons.length > 0 ? lessons.map(lesson => (
                                    <div key={lesson.id} className="bg-slate-900/50 border border-slate-800/50 rounded-4xl p-6 flex flex-col relative group hover:border-brand-purple/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {lesson.category}
                                            </span>
                                            <span className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl overflow-hidden border border-slate-700">
                                                {lesson.icon && lesson.icon.startsWith('http') ? (
                                                    <img src={lesson.icon} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    lesson.icon
                                                )}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-white mb-2">{lesson.title}</h4>
                                        <p className="text-xs font-medium text-slate-500 mb-6 line-clamp-2">{lesson.description}</p>
                                        <div className="mt-auto flex justify-between items-center">
                                            <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">{lesson.status}</span>
                                            <div className="flex gap-4 items-center">
                                                <button 
                                                    onClick={() => handleEditLesson(lesson.id)}
                                                    className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                                                >Edit →</button>
                                                <button 
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="text-slate-500 hover:text-rose-500 transition-colors"
                                                    title="Delete Lesson"
                                                >🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                                        <span className="text-5xl mb-4">📭</span>
                                        <h4 className="text-lg font-black text-white">No Lessons Yet</h4>
                                        <p className="text-slate-500 text-xs font-bold max-w-xs mt-2">You haven't created any lessons. Click the button above to start building your first aralin!</p>
                                    </div>
                                )}
                            </div>

                            {/* Create Lesson Modal */}
                            {showCreateLesson && (
                                <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-100 flex items-center justify-center p-4">
                                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                                        <button onClick={() => setShowCreateLesson(false)} className="absolute top-8 right-8 text-2xl text-slate-500 hover:text-white transition-colors">✕</button>
                                        
                                        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{isEditing ? 'Improve Aralin' : 'Craft New Lesson'}</h2>
                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{isEditing ? 'Master Editor' : 'Lesson Architect'}</p>
                                            </div>
                                        </header>

                                        <form className="grid grid-cols-1 lg:grid-cols-2 gap-10" onSubmit={async (e) => {
                                            e.preventDefault();
                                            setIsSaving(true);
                                            try {
                                                if (isEditing && editingLessonId) {
                                                    const res = await fetch('/api/teacher/update-lesson', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: editingLessonId,
                                                            ...newLesson,
                                                            items: newItems
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error('Update failed');
                                                } else {
                                                    // Create Lesson
                                                    const lessonRes = await fetch('/api/teacher/create-lesson', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ 
                                                            ...newLesson, 
                                                            teacherId: user?.id,
                                                            className: user?.class_name || (user as any)?.className || classes[0]?.name || 'General'
                                                        })
                                                    });
                                                    const lessonData = await lessonRes.json();
                                                    
                                                    if (!lessonRes.ok) throw new Error(lessonData.error || 'Failed to create lesson');

                                                    const lessonId = lessonData.lesson.id;
                                                    
                                                    for (let i = 0; i < newItems.length; i++) {
                                                        await fetch('/api/teacher/add-lesson-item', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ lessonId, ...newItems[i], itemOrder: i })
                                                        });
                                                    }
                                                }
                                                
                                                alert(isEditing ? '✅ Na-update na ang Aralin!' : '🚀 Published Successfully!');
                                                setShowCreateLesson(false);
                                                window.location.reload();
                                            } catch (err: any) {
                                                console.error('Save failed:', err);
                                                alert(`🛑 Error: ${err.message}`);
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}>
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lesson Title</label>
                                                    <input 
                                                        required 
                                                        value={newLesson.title}
                                                        onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                                                        className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm focus:border-brand-purple outline-none transition-all placeholder:text-slate-700" 
                                                        placeholder="e.g. Mga Hayop sa Bukid"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                                    <textarea 
                                                        rows={2}
                                                        value={newLesson.description}
                                                        onChange={e => setNewLesson({...newLesson, description: e.target.value})}
                                                        className="bg-slate-950 border border-slate-800 text-white px-5 py-3 rounded-xl text-xs focus:border-brand-purple outline-none transition-all placeholder:text-slate-700 resize-none" 
                                                        placeholder="What will the students learn?"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lesson Category</label>
                                                    <select 
                                                        value={newLesson.category}
                                                        onChange={e => setNewLesson({...newLesson, category: e.target.value})}
                                                        className="bg-slate-950 border border-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold focus:border-brand-purple outline-none transition-all cursor-pointer"
                                                    >
                                                        <option value="Reading">📖 Pagbabasa (Reading)</option>
                                                        <option value="Speaking">🗣️ Pagsasalita (Speaking)</option>
                                                        <option value="Writing">✍️ Pagsusulat (Writing)</option>
                                                        <option value="Culture">🇵🇭 Kultura (Culture)</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lesson Icon / Image</label>
                                                        <div className="flex gap-4 items-center bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-xl md:text-2xl overflow-hidden shrink-0 shadow-inner group/img relative">
                                                                {isUploading['lesson'] ? (
                                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                                                                        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                                                    </div>
                                                                ) : null}
                                                                {newLesson.icon && (newLesson.icon.startsWith('http') || newLesson.icon.startsWith('/') || newLesson.icon.includes('.')) ? (
                                                                    <img 
                                                                        src={newLesson.icon} 
                                                                        alt="Lesson Icon" 
                                                                        className="w-full h-full object-cover transition-transform group-hover/img:scale-110" 
                                                                        onError={(e) => {
                                                                            const target = e.currentTarget;
                                                                            target.onerror = null;
                                                                            target.src = 'https://placehold.co/150x150/1e293b/white?text=Oops!';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span className="animate-pulse-subtle">{newLesson.icon || '🖼️'}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 flex flex-col gap-2">
                                                                <input 
                                                                    value={newLesson.icon}
                                                                    onChange={e => setNewLesson({...newLesson, icon: e.target.value})}
                                                                    className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold focus:border-brand-purple outline-none transition-all" 
                                                                    placeholder="Icon URL or Emoji"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <label className="flex-1">
                                                                        <div className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-black uppercase tracking-widest py-2 rounded-lg text-center cursor-pointer transition-all border border-slate-700 hover:border-slate-600">
                                                                            📤 Upload Photo
                                                                        </div>
                                                                        <input 
                                                                            type="file" 
                                                                            className="hidden" 
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleFileUpload(file, 'lesson');
                                                                            }}
                                                                        />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                <button 
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="mt-4 bg-brand-purple text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    {isSaving ? 'Processing...' : (isEditing ? '💾 Save Changes' : '🚀 Publish Lesson')}
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-6">
                                                <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vocabulary Items</h4>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setNewItems([...newItems, { primaryText: '', secondaryText: '', imageEmoji: '⭐', linkUrl: '' }])}
                                                        className="bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-sm"
                                                    >
                                                        + Add New Manual Slide
                                                    </button>
                                                </div>

                                                <div className="flex flex-col gap-4 max-h-96 overflow-auto pr-2 custom-scrollbar">
                                                    {newItems.map((item, idx) => (
                                                        <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative group">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                                                                className="absolute top-4 right-4 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >✕</button>
                                                            <div className="grid grid-cols-12 gap-4">
                                                                <div className="col-span-4">
                                                                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Visual Preview</label>
                                                                    <div className="space-y-3">
                                                                        <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl overflow-hidden group/itemimg relative shadow-inner">
                                                                            {isUploading[`item-${idx}`] ? (
                                                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                                                                                    <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                                                                </div>
                                                                            ) : null}
                                                                            {item.imageEmoji && (item.imageEmoji.startsWith('http') || item.imageEmoji.startsWith('/') || item.imageEmoji.includes('.')) ? (
                                                                                <img 
                                                                                    src={item.imageEmoji} 
                                                                                    alt={item.primaryText || "Visual"} 
                                                                                    className="w-full h-full object-cover transition-transform group-hover/itemimg:scale-110" 
                                                                                    onError={(e) => {
                                                                                        const target = e.currentTarget;
                                                                                        target.onerror = null;
                                                                                        target.src = 'https://placehold.co/150x150/1e293b/white?text=Oops!';
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span className="animate-float">{item.imageEmoji || '⭐'}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col gap-2">
                                                                            <input 
                                                                                required
                                                                                value={item.imageEmoji}
                                                                                onChange={e => {
                                                                                    const updated = [...newItems];
                                                                                    updated[idx].imageEmoji = e.target.value;
                                                                                    setNewItems(updated);
                                                                                }}
                                                                                className="bg-slate-900 border border-slate-800 text-white w-full py-2 px-2 rounded-lg text-center text-[7px] font-bold truncate focus:border-brand-purple outline-none transition-all placeholder:text-slate-700" 
                                                                                placeholder="Emoji or URL"
                                                                            />
                                                                            <label>
                                                                                <div className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[7px] font-black uppercase tracking-widest py-1.5 rounded-lg text-center cursor-pointer transition-all border border-slate-700">
                                                                                    📷 Upload
                                                                                </div>
                                                                                <input 
                                                                                    type="file" 
                                                                                    className="hidden" 
                                                                                    accept="image/*"
                                                                                    onChange={(e) => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) handleFileUpload(file, idx);
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-8 flex flex-col gap-4 justify-center">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest ml-1">Tagalog Term</label>
                                                                        <input 
                                                                            required
                                                                            placeholder="e.g. Aso"
                                                                            value={item.primaryText}
                                                                            onChange={e => {
                                                                                const updated = [...newItems];
                                                                                updated[idx].primaryText = e.target.value;
                                                                                setNewItems(updated);
                                                                            }}
                                                                            className="bg-slate-900 border border-slate-800 text-white px-4 py-3.5 rounded-xl text-[10px] font-black focus:border-brand-purple outline-none transition-all placeholder:text-slate-700" 
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest ml-1">English / Meaning</label>
                                                                        <input 
                                                                            placeholder="e.g. Dog"
                                                                            value={item.secondaryText}
                                                                            onChange={e => {
                                                                                const updated = [...newItems];
                                                                                updated[idx].secondaryText = e.target.value;
                                                                                setNewItems(updated);
                                                                            }}
                                                                            className="bg-slate-900 border border-slate-800 text-white px-4 py-3.5 rounded-xl text-[10px] font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700" 
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest ml-1">Interactive Link (Optional)</label>
                                                                        <input 
                                                                            type="url"
                                                                            placeholder="https://..."
                                                                            value={item.linkUrl || ''}
                                                                            onChange={e => {
                                                                                const updated = [...newItems];
                                                                                updated[idx].linkUrl = e.target.value;
                                                                                setNewItems(updated);
                                                                            }}
                                                                            className="bg-slate-900 border border-slate-800 text-white px-4 py-3.5 rounded-xl text-[10px] font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700" 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'classes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
                             {classes.map((cls, i) => (
                                 <div key={i} className={`bg-slate-900/50 border-t-4 ${cls.color} border-x border-b border-slate-800/50 rounded-4xl p-8 flex flex-col group hover:bg-slate-900/80 transition-all text-left block w-full`}>
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 w-full block">Classroom ID: {i+1024}</span>
                                     <h3 className="text-xl font-black text-white mb-6 group-hover:text-brand-purple transition-colors w-full">{cls.name}</h3>
                                     
                                     <div className="flex flex-col gap-4 mb-8 w-full">
                                         <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-[10px] font-bold text-slate-500">Total Students</span>
                                            <span className="text-xs font-black text-white">{cls.students} Enrolled</span>
                                         </div>
                                         <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                            <span className="text-[10px] font-bold text-slate-500">Upcoming Topic</span>
                                            <span className="text-xs font-black text-brand-sky">{cls.nextLesson}</span>
                                         </div>
                                     </div>

                                     <div className="mt-auto space-y-2 w-full">
                                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                             <span>Syllabus Completion</span>
                                             <span>{cls.progress}%</span>
                                         </div>
                                         <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full relative">
                                             <div className="absolute top-0 left-0 h-full bg-brand-purple rounded-full" style={{ width: `${cls.progress}%` }}></div>
                                         </div>
                                         <button 
                                             onClick={() => {
                                                 setSelectedClass(cls);
                                                 setActiveTab('manage-class');
                                             }}
                                             className="w-full mt-4 bg-brand-sky hover:bg-brand-sky/80 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-widest transition-colors"
                                         >
                                             👥 Manage Students
                                         </button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    {activeTab === 'students' && (
                         <div className="bg-slate-900/50 border border-slate-800/50 rounded-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                             <div className="p-8 border-b border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80">
                                 <div>
                                     <h3 className="text-lg font-black text-white">Class List</h3>
                                     <p className="text-xs font-medium text-slate-500">Monitoring {allStudentExplorersList.length} active students in the system</p>
                                 </div>
                                 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">🔍</span>
                                         <input 
                                            type="text" 
                                            placeholder="Search by name or email..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-purple transition-colors w-full sm:w-64 placeholder:text-slate-700"
                                         />
                                     </div>
                                     <select 
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-brand-purple cursor-pointer"
                                     >
                                         <option value="all">ALL STATUS</option>
                                         <option value="Online">ONLINE</option>
                                         <option value="Idle">IDLE</option>
                                         <option value="Offline">OFFLINE</option>
                                     </select>
                                 </div>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead>
                                         <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/50">
                                             <th className="px-8 py-5">Student Name</th>
                                             <th className="px-8 py-5">Mastery Level</th>
                                             <th className="px-8 py-5">Activities</th>
                                             <th className="px-8 py-5">Avg Score</th>
                                             <th className="px-8 py-5 text-right">Performance</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-800/30">
                                         {(() => {
                                             const filteredStudents = (allStudentExplorersList || []).filter(s => {
                                                 const query = searchQuery.toLowerCase();
                                                 const name = (s.name || '').toLowerCase();
                                                 const email = (s.email || '').toLowerCase();
                                                 const matchesSearch = name.includes(query) || email.includes(query);
                                                 const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
                                                 return matchesSearch && matchesStatus;
                                             });

                                             if (filteredStudents.length === 0) {
                                                 return (
                                                     <tr>
                                                         <td colSpan={5} className="py-24 text-center">
                                                             <div className="flex flex-col items-center gap-3">
                                                                 <span className="text-4xl grayscale opacity-50">👤</span>
                                                                 <p className="text-slate-500 font-bold text-sm">
                                                                     {isLoading ? 'Kumukuha ng datos...' : 'Walang nakitang student explorers. (Try refreshing the page if this persists)'}
                                                                 </p>
                                                                 {(searchQuery || filterStatus !== 'all') && (
                                                                     <button 
                                                                        onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                                                                        className="text-[10px] font-black text-brand-purple hover:underline uppercase tracking-widest mt-2"
                                                                     >
                                                                         Reset all filters
                                                                     </button>
                                                                 )}
                                                             </div>
                                                         </td>
                                                     </tr>
                                                 );
                                             }

                                             return filteredStudents.map((student, i) => (
                                                 <tr key={student.id || i} className="hover:bg-slate-800/20 transition-all cursor-pointer group" onClick={() => handleViewStudentDetails(student.id)}>
                                                     <td className="px-8 py-5">
                                                         <div className="flex items-center gap-4">
                                                             <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-brand-purple/50 transition-colors shadow-inner">
                                                                 {(student.name || '?')[0]}
                                                             </div>
                                                             <div>
                                                                 <p className="text-sm font-black text-white group-hover:text-brand-purple transition-colors mb-0.5">{student.name}</p>
                                                                 <div className="flex items-center gap-2">
                                                                     <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{student.email || 'No Email Registered'}</p>
                                                                     {student.className && (
                                                                         <span className="text-[8px] bg-brand-purple/10 text-brand-purple px-1.5 py-0.5 rounded font-black uppercase">
                                                                             {student.className}
                                                                         </span>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="px-8 py-5">
                                                         <div className="flex flex-col gap-1.5 w-36">
                                                             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                 <span className="text-slate-500">Mastery Level</span>
                                                                 <span className="text-brand-sky">{student.progress}%</span>
                                                             </div>
                                                             <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full">
                                                                 <div className="h-full bg-linear-to-r from-brand-sky to-brand-purple rounded-full" style={{ width: `${student.progress}%` }}></div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="px-8 py-5">
                                                         <div className="flex flex-col">
                                                             <span className="text-[10px] font-black text-white">8 Activities</span>
                                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active: {student.lastActive}</span>
                                                         </div>
                                                     </td>
                                                     <td className="px-8 py-5">
                                                         <div className="flex items-center gap-2">
                                                             <span className="w-2 h-2 rounded-full bg-brand-sky shadow-[0_0_10px_#38bdf8]"></span>
                                                             <span className="text-xs font-black text-white">{student.progress + 5}%</span>
                                                         </div>
                                                     </td>
                                                     <td className="px-8 py-5 text-right flex justify-end">
                                                         <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                             student.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                             student.status === 'Idle' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                             'bg-slate-800/20 text-slate-500 border-slate-700/20'
                                                         }`}>
                                                             {student.status}
                                                         </div>
                                                     </td>
                                                 </tr>
                                             ));
                                         })()}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                    )}

                    {activeTab === 'manage-class' && selectedClass && (
                        <div className="animate-in fade-in duration-700">
                            <button 
                                onClick={() => setActiveTab('classes')}
                                className="mb-6 text-brand-sky hover:text-brand-sky/80 flex items-center gap-2 font-bold text-sm transition-colors"
                            >
                                ← Back to Classes
                            </button>
                            <ManageClassStudents
                                classId={selectedClass.id}
                                className={selectedClass.name}
                                teacherId={user?.id || ''}
                            />
                        </div>
                    )}
                     
                    {activeTab === 'assignments' && (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
                            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-4xl border border-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-black text-white">Assignment Management</h3>
                                    <p className="text-slate-500 font-bold text-xs mt-1">Manage and draft upcoming class challenges</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setNewAssignment({ title: '', description: '', reward: '10', dueDate: '', icon: '📝' });
                                        setEditingAssignmentId(null);
                                        setIsEditingAssignment(false);
                                        setShowCreateAssignment(true);
                                    }}
                                    className="bg-brand-purple text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    + Create New Assignment
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignments.map((assignment: any) => (
                                    <div 
                                        key={assignment.id} 
                                        onClick={() => handleViewAssignmentStats(assignment.id, assignment.title)}
                                        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 group hover:border-brand-purple transition-all shadow-sm cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                                        
                                        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-brand-purple/20 transition-all border border-slate-700">
                                                {assignment.icon || '📝'}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 text-right">
                                                <span className="text-[10px] font-black text-brand-purple uppercase tracking-[0.2em] bg-brand-purple/10 px-3 py-1.5 rounded-full">
                                                    {assignment.reward || 10} ⭐ STARS
                                                </span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Click to see who finished
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <h4 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-brand-purple transition-colors">{assignment.title}</h4>
                                            <p className="text-xs font-medium text-slate-500 mb-8 line-clamp-2 leading-relaxed">{assignment.description}</p>
                                        </div>

                                        <div className="mt-auto pt-5 border-t border-slate-800/50 flex justify-between items-center relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Target Deadline</span>
                                                <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">
                                                    {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No date set'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditAssignment(assignment.id); }}
                                                    className="w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-brand-purple hover:bg-brand-purple/10 hover:border-brand-purple/30 transition-all shadow-sm"
                                                    title="Edit Assignment"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }}
                                                    className="w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm"
                                                    title="Delete Assignment"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {assignments.length === 0 && (
                                     <div className="col-span-full py-16 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                                         <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">📭</div>
                                         <h4 className="text-lg font-black text-white">No Assignments Active</h4>
                                         <p className="text-slate-500 text-xs font-bold max-w-xs mt-2">Click the create button above to assign tasks to your class!</p>
                                     </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-4xl border border-slate-800/50 mt-10">
                                <div>
                                    <h3 className="text-xl font-black text-white">Lesson Links & Resources</h3>
                                    <p className="text-slate-500 font-bold text-xs mt-1">Post external resources or lesson materials</p>
                                </div>
                                <button 
                                    onClick={() => setShowPostLink(true)}
                                    className="bg-brand-sky text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    + Post New Link
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                {lessonLinks.map((link: any) => (
                                    <div key={link.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 hover:border-brand-sky transition-all group relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                                                {link.icon || '🔗'}
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteLink(link.id)}
                                                className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >🗑️</button>
                                        </div>
                                        <h4 className="text-lg font-black text-white mb-2 truncate">{link.title}</h4>
                                        <p className="text-xs font-medium text-slate-500 mb-6 line-clamp-2">{link.description || 'No description provided.'}</p>
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[10px] font-black text-brand-sky uppercase tracking-[0.2em] hover:underline"
                                        >
                                            Visit Link →
                                        </a>
                                    </div>
                                ))}

                                {lessonLinks.length === 0 && (
                                    <div className="col-span-full py-12 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                                        <p className="text-slate-500 text-xs font-bold">No lesson links posted yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Post Link Modal */}
                            {showPostLink && (
                                <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-200 flex items-center justify-center p-4">
                                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative">
                                        <button onClick={() => setShowPostLink(false)} className="absolute top-8 right-8 text-2xl text-slate-500 hover:text-white transition-colors">✕</button>
                                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Post Resource Link</h2>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Share resources with your students</p>
                                        
                                        <form className="flex flex-col gap-6" onSubmit={handlePostLink}>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Title</label>
                                                <input required value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" placeholder="e.g. Supplementary Reading Video" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL</label>
                                                <input required type="url" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" placeholder="https://youtube.com/..." />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon Emoji</label>
                                                <input required value={newLink.icon} onChange={e => setNewLink({...newLink, icon: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" placeholder="🔗" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Short Description</label>
                                                <textarea rows={2} value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full resize-none" placeholder="What is this link for?" />
                                            </div>
                                            <button type="submit" disabled={isSavingLink} className="mt-4 bg-brand-sky text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all w-full">
                                                {isSavingLink ? 'Posting...' : '🚀 Post Link Now'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Create Assignment Modal */}
                {showCreateAssignment && (
                    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                            <button onClick={() => setShowCreateAssignment(false)} className="absolute top-8 right-8 text-2xl text-slate-500 hover:text-white transition-colors">✕</button>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2">{isEditingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">{isEditingAssignment ? 'Modify this challenge' : 'Deploy a new challenge'}</p>
                            
                            <form className="flex flex-col gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
                                    <input required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" placeholder="e.g. Read 'Ang Alamat'" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                    <textarea required rows={3} value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full resize-none" placeholder="Instructions for students" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reward (Stars)</label>
                                        <input type="number" required value={newAssignment.reward} onChange={e => setNewAssignment({...newAssignment, reward: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" min="1" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon Emoji</label>
                                        <input required value={newAssignment.icon} onChange={e => setNewAssignment({...newAssignment, icon: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" placeholder="📝" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Due Date (Optional)</label>
                                    <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm outline-none w-full" style={{ colorScheme: 'dark' }} />
                                </div>
                                <button type="button" 
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if(!newAssignment.title) {
                                            alert("🛑 Please enter an assignment title.");
                                            return;
                                        }
                                        setIsSavingAssignment(true);
                                        try {
                                            const res = await fetch('/api/teacher/create-assignment', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ ...newAssignment, id: editingAssignmentId })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error || 'Failed to save');
                                            
                                            alert(`✅ Assignment ${isEditingAssignment ? 'updated' : 'deployed'} successfully!`);
                                            
                                            if (isEditingAssignment) {
                                                setAssignments(assignments.map(a => a.id === editingAssignmentId ? data.assignment : a));
                                            } else {
                                                setAssignments([data.assignment, ...assignments]);
                                            }
                                            
                                            setShowCreateAssignment(false);
                                            setNewAssignment({ title: '', description: '', reward: '10', dueDate: '', icon: '📝' });
                                            setEditingAssignmentId(null);
                                            setIsEditingAssignment(false);
                                        } catch (err: any) {
                                            alert(`🛑 ${err.message}`);
                                        } finally {
                                            setIsSavingAssignment(false);
                                        }
                                    }}
                                    disabled={isSavingAssignment} 
                                    className="mt-4 bg-brand-purple text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all w-full"
                                >
                                    {isSavingAssignment ? 'Saving...' : `🚀 ${isEditingAssignment ? 'Update' : 'Publish'} Assignment`}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Student Details Modal */}
                {showStudentModal && (
                    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                            <button onClick={() => setShowStudentModal(false)} className="absolute top-8 right-8 text-2xl text-slate-500 hover:text-white transition-colors z-10">✕</button>
                            
                            {studentDetailsError ? (
                                <div className="text-center py-10">
                                    <p className="text-rose-500 font-bold mb-4">🛑 {studentDetailsError}</p>
                                    <button onClick={() => setShowStudentModal(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase">Close</button>
                                </div>
                            ) : !selectedStudent ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Loading Academic Records...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-6 border-b border-slate-800/50 pb-8">
                                        <div className="w-20 h-20 bg-slate-800 rounded-3xl border border-slate-700 flex items-center justify-center text-3xl font-black text-slate-400 shadow-inner">
                                            {selectedStudent.student.name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-white tracking-tight">{selectedStudent.student.name}</h2>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Student Profile • {selectedStudent.student.email}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <p className="text-brand-purple text-[10px] font-black">Enrolled: {new Date(selectedStudent.student.joinedAt).toLocaleDateString()}</p>
                                                {selectedStudent.student.className && (
                                                    <span className="text-[10px] font-black bg-brand-sky/10 text-brand-sky px-2 py-0.5 rounded border border-brand-sky/20 uppercase">
                                                        🎓 {selectedStudent.student.className}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-8">
                                            <div>
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Lesson Progress</h4>
                                                <div className="flex flex-col gap-3">
                                                    {selectedStudent.progress?.length > 0 ? selectedStudent.progress.map((p: any, i: number) => (
                                                        <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{p.icon}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-white">{p.title}</span>
                                                                    <span className="text-[9px] font-bold text-slate-500">{new Date(p.updated_at).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-xs font-black ${p.score > 70 ? 'text-emerald-400' : p.score > 40 ? 'text-amber-400' : 'text-rose-400'}`}>{p.score}% Mastery</span>
                                                                <span className={`text-[8px] font-black uppercase tracking-widest ${p.completed ? 'text-brand-purple' : 'text-slate-500'}`}>{p.completed ? '✓ Completed' : 'In Progress'}</span>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <p className="text-slate-500 text-xs font-bold italic">Walang record ng aralin</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Assigned Tasks</h4>
                                                <div className="flex flex-col gap-3">
                                                    {selectedStudent.assignments?.length > 0 ? selectedStudent.assignments.map((a: any, i: number) => (
                                                        <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{a.icon}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-white">{a.title}</span>
                                                                    <span className="text-[9px] font-bold text-slate-500">{a.reward} ⭐ Stars</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                                    a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                                    a.status === 'late' ? 'bg-rose-500/10 text-rose-400' : 
                                                                    'bg-brand-purple/10 text-brand-purple'
                                                                }`}>{a.status}</span>
                                                                <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}</span>
                                                                {a.proof_url && (
                                                                    <a href={a.proof_url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-brand-sky hover:text-white mt-1.5 uppercase transition-colors underline">🖼️ View Proof</a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <p className="text-slate-500 text-xs font-bold italic">No assignments tracked yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Recent Activity Logs</h4>
                                            <div className="flex flex-col gap-4 relative before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-slate-800">
                                                {selectedStudent.activities?.length > 0 ? selectedStudent.activities.map((a: any, i: number) => (
                                                    <div key={i} className="flex gap-4 relative">
                                                        <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-brand-purple z-10 shrink-0"></div>
                                                        <div className="flex flex-col -mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{a.action}</span>
                                                            <span className="text-xs font-bold text-white mt-0.5 leading-snug">{a.details}</span>
                                                            <span className="text-[9px] font-bold text-slate-600 mt-1">{new Date(a.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-slate-500 text-xs font-bold italic pl-8">No recent activity detected</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Create Bahagi Modal */}
            {showBahagiModal && (
                <TeacherBahagi 
                    isOpen={showBahagiModal}
                    onClose={() => setShowBahagiModal(false)}
                    onCreate={handleCreateBahagi}
                    isLoading={isBahagiLoading}
                />
            )}

            {/* Lesson Editor Modal */}
            {showLessonEditor && selectedBahagiForEdit && (
                <TeacherLessonEditor 
                    isOpen={showLessonEditor}
                    onClose={() => {
                        setShowLessonEditor(false);
                        setSelectedBahagiForEdit(null);
                    }}
                    bahagiId={selectedBahagiForEdit.id}
                    bahagiTitle={selectedBahagiForEdit.title}
                    onSave={async (updatedData) => {
                        // updatedData contains { lessons, assessments, rewards }
                        // We already have selectedBahagiForEdit with the id
                        const updatedBahagi = {
                            ...selectedBahagiForEdit,
                            ...updatedData
                        };
                        setBahagis(bahagis.map(b => b.id === selectedBahagiForEdit.id ? updatedBahagi : b));
                        setShowLessonEditor(false);
                        setSelectedBahagiForEdit(null);
                    }}
                    isLoading={isBahagiLoading}
                />
            )}

            {/* Assignment Completions Modal */}
            {isStatsModalOpen && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsStatsModalOpen(false)} />
                    <div className="relative bg-[#0F172A] border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-linear-to-r from-slate-900/50 to-brand-purple/5">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight">{statAssignmentTitle}</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple shadow-[0_0_10px_#9333ea]"></span>
                                    Student Completion Metrics
                                </p>
                            </div>
                            <button onClick={() => setIsStatsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner border border-white/5">✕</button>
                        </div>
                        
                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {isStatsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-16 h-16 relative">
                                        <div className="absolute inset-0 border-4 border-brand-purple/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <span className="text-slate-400 font-black text-xs uppercase tracking-widest mt-4">Compiling Analytics...</span>
                                </div>
                            ) : selectedAssignmentStats.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-6 pb-4 border-b border-white/5">
                                        <span>Student Identity</span>
                                        <span>Completion Status</span>
                                    </div>
                                    {selectedAssignmentStats.map((completion) => (
                                        <div key={completion.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/3 rounded-4xl hover:bg-white/8 hover:border-brand-purple/30 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-black text-brand-purple shadow-xl border border-white/5">
                                                    {completion.name[0]}
                                                </div>
                                                <div>
                                                    <span className="text-lg font-black text-white block group-hover:text-brand-purple transition-colors mb-0.5">{completion.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{completion.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                                                    <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Done</span>
                                                </div>
                                                {completion.proofUrl && (
                                                    <a href={completion.proofUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-brand-sky hover:text-white uppercase tracking-widest transition-colors py-1 px-2 hover:bg-brand-sky/10 rounded-lg flex items-center gap-1.5">📸 VIEW PROOF</a>
                                                )}
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    {new Date(completion.completedAt).toLocaleDateString()} @ {new Date(completion.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-8">
                                    <div className="w-32 h-32 rounded-full bg-slate-800/50 flex items-center justify-center text-6xl shadow-inner border border-white/5">📊</div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white tracking-tight">Zero Submissions Yet</h4>
                                        <p className="text-slate-500 font-bold text-sm max-w-xs mx-auto leading-relaxed italic">"Mukhang nagpapahinga pa ang ating mga student explorers. Balik na lang maya-maya!"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-900/50 border-t border-white/5 text-center backdrop-blur-sm">
                            <button onClick={() => setIsStatsModalOpen(false)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">Back to Management</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-center">
                        <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner shadow-red-500/20">
                            🚪
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Log Out Securely?</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">
                            Are you sure you want to log out of the teacher panel? You will need to re-authenticate to access this dashboard.
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
        </div>
    );
};

