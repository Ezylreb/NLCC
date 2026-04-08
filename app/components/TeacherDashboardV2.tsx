'use client';

import React, { useState, useEffect } from 'react';
import { TeacherSidebar } from './TeacherComponents/TeacherSidebar';
import { TeacherOverviewPage } from './TeacherComponents/TeacherOverviewPage';
import { TeacherClassesPage } from './TeacherComponents/TeacherClassesPage';
import { TeacherProfilePage } from './TeacherComponents/TeacherProfilePage';
import { ClassDetailPage } from './TeacherComponents/ClassDetailPage';
import { CreateLessonForm } from './TeacherComponents/CreateLessonForm';
import { CreateYunitForm } from './TeacherComponents/CreateYunitForm';
import { CreateAssessmentForm } from './TeacherComponents/CreateAssessmentForm';

interface TeacherDashboardV2Props {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; email?: string } | null;
}

export const TeacherDashboardV2: React.FC<TeacherDashboardV2Props> = ({ onLogout, user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'profile'>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Data states
    const [stats, setStats] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [weeklyChart, setWeeklyChart] = useState<any[]>([]);
    const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Class Detail states
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedClassName, setSelectedClassName] = useState<string>('');
    const [classLessons, setClassLessons] = useState<any[]>([]);

    // Form states
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [showYunitForm, setShowYunitForm] = useState(false);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Fetch dashboard data
    const fetchData = async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }
        setIsSyncing(true);
        try {
            // Fetch teacher stats with proper error handling
            const statsRes = await fetch(`/api/teacher/stats?teacherId=${user.id}&v=${Date.now()}`);
            
            if (statsRes.ok) {
                try {
                    const data = await statsRes.json();
                    setStats(data.stats || []);
                    setStudents(data.students || []);
                    setClasses(data.classes || []);
                    setWeeklyChart(data.weeklyChart || []);
                    setMonthlyChart(data.monthlyChart || []);
                } catch (jsonError) {
                    console.error('Failed to parse stats response:', jsonError);
                    setStats([]);
                    setStudents([]);
                    setClasses([]);
                    setWeeklyChart([]);
                    setMonthlyChart([]);
                }
            } else {
                console.warn('Stats API returned status:', statsRes.status);
                setStats([]);
                setStudents([]);
                setClasses([]);
                setWeeklyChart([]);
                setMonthlyChart([]);
            }
        } catch (error) {
            console.error('Network error fetching dashboard data:', error);
            // Set default empty data
            setStats([]);
            setStudents([]);
            setClasses([]);
            setWeeklyChart([]);
            setMonthlyChart([]);
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    // Handle class creation
    const handleCreateClass = async (className: string) => {
        try {
            const res = await fetch('/api/teacher/create-class', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: className,
                    teacherId: user?.id
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                setClasses([data.class, ...classes]);
                alert('✅ Class created successfully!');
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error || 'Failed to create class'}`);
            }
        } catch (err) {
            console.error('Error creating class:', err);
            alert('❌ Failed to create class');
        }
    };

    // Handle opening a class
    const handleOpenClass = async (classId: string) => {
        const selectedClass = classes.find(c => c.id === classId);
        if (selectedClass) {
            setSelectedClassId(classId);
            setSelectedClassName(selectedClass.name);
            // Load lessons for this class
            try {
                const res = await fetch(`/api/teacher/class-lessons?classId=${classId}`);
                if (res.ok) {
                    const data = await res.json();
                    setClassLessons(data.lessons || []);
                } else {
                    console.warn('Failed to fetch lessons');
                    setClassLessons([]);
                }
            } catch (err) {
                console.error('Error fetching lessons:', err);
                setClassLessons([]);
            }
        }
    };

    // Handle going back from class detail
    const handleBackFromClassDetail = () => {
        setSelectedClassId(null);
        setSelectedClassName('');
        setClassLessons([]);
    };

    // Handle creating lesson (show modal)
    const handleCreateLesson = () => {
        setShowLessonForm(true);
    };

    // Handle lesson form submission
    const handleLessonSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/teacher/create-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    teacherId: user?.id,
                    className: selectedClassName
                })
            });

            if (res.ok) {
                const newLesson = await res.json();
                alert('✅ Lesson created successfully!');
                setShowLessonForm(false);
                // Add the new lesson to classLessons
                setClassLessons([newLesson.lesson, ...classLessons]);
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error creating lesson:', err);
            alert('❌ Failed to create lesson');
        }
    };

    // Handle creating yunit
    const handleCreateYunit = (lessonId: string) => {
        setSelectedLessonId(lessonId);
        setShowYunitForm(true);
    };

    // Handle creating assessment
    const handleCreateAssessment = (lessonId: string) => {
        setSelectedLessonId(lessonId);
        setShowAssessmentForm(true);
    };

    // Handle yunit form submission
    const handleYunitSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/teacher/create-yunit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    teacherId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Yunit created successfully!');
                setShowYunitForm(false);
                // Refresh lessons
                // TODO: Refresh class lessons
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error creating yunit:', err);
            alert('❌ Failed to create yunit');
        }
    };

    // Handle assessment form submission
    const handleAssessmentSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/teacher/create-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    teacherId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Assessment created successfully!');
                setShowAssessmentForm(false);
                // Refresh lessons
                // TODO: Refresh class lessons
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error creating assessment:', err);
            alert('❌ Failed to create assessment');
        }
    };

    // Handle deleting lesson
    const handleDeleteLesson = async (lessonId: string) => {
        try {
            const res = await fetch('/api/teacher/delete-lesson', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    teacherId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Lesson deleted successfully!');
                // Remove from classLessons
                setClassLessons(classLessons.filter(l => l.id !== lessonId));
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error deleting lesson:', err);
            alert('❌ Failed to delete lesson');
        }
    };

    // Handle editing lesson
    const handleEditLesson = (lessonId: string) => {
        alert('Edit lesson modal will be implemented');
        // TODO: Show edit lesson modal
    };

    // Handle editing yunit
    const handleEditYunit = (lessonId: string, yunitId: string) => {
        alert('Edit yunit modal will be implemented');
        // TODO: Show edit yunit modal
    };

    // Handle deleting yunit
    const handleDeleteYunit = async (lessonId: string, yunitId: string) => {
        try {
            const res = await fetch('/api/teacher/delete-yunit', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    yunitId,
                    teacherId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Yunit deleted successfully!');
                // Update classLessons
                const updatedLessons = classLessons.map(lesson => {
                    if (lesson.id === lessonId) {
                        return {
                            ...lesson,
                            yunits: lesson.yunits?.filter((y: any) => y.id !== yunitId) || []
                        };
                    }
                    return lesson;
                });
                setClassLessons(updatedLessons);
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error deleting yunit:', err);
            alert('❌ Failed to delete yunit');
        }
    };

    // Handle editing assessment
    const handleEditAssessment = (lessonId: string, assessmentId: string) => {
        alert('Edit assessment modal will be implemented');
        // TODO: Show edit assessment modal
    };

    // Handle deleting assessment
    const handleDeleteAssessment = async (lessonId: string, assessmentId: string) => {
        try {
            const res = await fetch('/api/teacher/delete-assessment', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    assessmentId,
                    teacherId: user?.id
                })
            });

            if (res.ok) {
                alert('✅ Assessment deleted successfully!');
                // Update classLessons
                const updatedLessons = classLessons.map(lesson => {
                    if (lesson.id === lessonId) {
                        return {
                            ...lesson,
                            assessments: lesson.assessments?.filter((a: any) => a.id !== assessmentId) || []
                        };
                    }
                    return lesson;
                });
                setClassLessons(updatedLessons);
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error deleting assessment:', err);
            alert('❌ Failed to delete assessment');
        }
    };

    // Handle logout
    const handleLogout = () => {
        setShowLogoutModal(false);
        onLogout();
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex selection:bg-brand-purple text-slate-200 relative overflow-hidden">
            {/* Sidebar */}
            <TeacherSidebar
                activeTab={activeTab}
                onTabChange={(tab: 'overview' | 'classes' | 'profile') => setActiveTab(tab)}
                user={user}
                isSidebarOpen={isSidebarOpen}
                onSidebarClose={() => setIsSidebarOpen(false)}
                onLogout={() => setShowLogoutModal(true)}
            />

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
                                {selectedClassId ? selectedClassName : activeTab} 
                                <span className="text-brand-purple"> Dashboard</span>
                            </h2>
                            <p className="hidden sm:block text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                Academic Year 2025-2026
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 custom-scrollbar relative">
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none">
                            <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                        </div>
                    )}

                    {/* Class Detail View */}
                    {selectedClassId ? (
                        <ClassDetailPage
                            classId={selectedClassId}
                            className={selectedClassName}
                            onBack={handleBackFromClassDetail}
                            onCreateLesson={handleCreateLesson}
                            onCreateYunit={handleCreateYunit}
                            onCreateAssessment={handleCreateAssessment}
                            onEditLesson={handleEditLesson}
                            onEditYunit={handleEditYunit}
                            onEditAssessment={handleEditAssessment}
                            onDeleteYunit={handleDeleteYunit}
                            onDeleteAssessment={handleDeleteAssessment}
                            lessons={classLessons}
                            onDeleteLesson={handleDeleteLesson}
                        />
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <TeacherOverviewPage
                                    stats={stats}
                                    weeklyChart={weeklyChart}
                                    monthlyChart={monthlyChart}
                                    students={students}
                                    user={user}
                                />
                            )}

                            {/* Classes Tab */}
                            {activeTab === 'classes' && (
                                <TeacherClassesPage
                                    classes={classes}
                                    onOpenClass={handleOpenClass}
                                    onCreateClass={handleCreateClass}
                                    onArchiveClass={() => {}}
                                />
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <TeacherProfilePage
                                    user={user}
                                    onUpdate={() => {}}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Lesson Form Modal */}
            {showLessonForm && selectedClassId && (
                <CreateLessonForm
                    isOpen={showLessonForm}
                    onClose={() => setShowLessonForm(false)}
                    onSubmit={handleLessonSubmit}
                    classId={selectedClassId}
                />
            )}

            {/* Yunit Form Modal */}
            {showYunitForm && selectedLessonId && (
                <CreateYunitForm
                    isOpen={showYunitForm}
                    onClose={() => {
                        setShowYunitForm(false);
                        setSelectedLessonId(null);
                    }}
                    onSubmit={handleYunitSubmit}
                    classId={selectedClassId || ''}
                    lessonId={selectedLessonId}
                />
            )}

            {/* Assessment Form Modal */}
            {showAssessmentForm && selectedLessonId && (
                <CreateAssessmentForm
                    isOpen={showAssessmentForm}
                    onClose={() => {
                        setShowAssessmentForm(false);
                        setSelectedLessonId(null);
                    }}
                    onSubmit={handleAssessmentSubmit}
                    classId={selectedClassId || ''}
                    lessonId={selectedLessonId}
                />
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden text-center">
                        <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner shadow-red-500/20">
                            🚪
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Log Out?</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8">
                            Are you sure you want to log out? You will need to re-authenticate to access the teacher dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-3 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleLogout}
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
