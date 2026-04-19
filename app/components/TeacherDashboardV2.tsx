'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { TeacherSidebar } from './TeacherComponents/TeacherSidebar';
import { TeacherOverviewPage } from './TeacherComponents/TeacherOverviewPage';
import { TeacherClassesPage } from './TeacherComponents/TeacherClassesPage';
import { TeacherProfilePage } from './TeacherComponents/TeacherProfilePage';
import { ClassDetailPage } from './TeacherComponents/ClassDetailPage';
import { CreateBahagiForm } from './TeacherComponents/CreateBahagiForm';
import { CreateLessonForm } from './TeacherComponents/CreateLessonForm';
import { CreateYunitForm } from './TeacherComponents/CreateYunitForm';
import { CreateAssessmentForm } from './TeacherComponents/CreateAssessmentForm';

interface TeacherDashboardV2Props {
    onLogout: () => void;
    user: { firstName: string; lastName: string; id?: string; email?: string } | null;
}

export const TeacherDashboardV2: React.FC<TeacherDashboardV2Props> = ({ onLogout, user }) => {
    // Restore active tab from sessionStorage or default to 'overview'
    // If there's a selected class, force 'classes' tab
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'profile'>(() => {
        if (typeof window !== 'undefined') {
            const hasSelectedClass = sessionStorage.getItem('teacher_selected_class_id');
            if (hasSelectedClass) {
                return 'classes'; // Force classes tab if restoring a class view
            }
            const savedTab = sessionStorage.getItem('teacher_active_tab');
            return (savedTab as 'overview' | 'classes' | 'profile') || 'overview';
        }
        return 'overview';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Data states
    const [stats, setStats] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [weeklyChart, setWeeklyChart] = useState<any[]>([]);
    const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Class Detail states (restore from sessionStorage on reload)
    const [selectedClassId, setSelectedClassId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('teacher_selected_class_id');
        }
        return null;
    });
    const [selectedClassName, setSelectedClassName] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('teacher_selected_class_name') || '';
        }
        return '';
    });
    const [classBahagi, setClassBahagi] = useState<any[]>([]);
    const [classLessons, setClassLessons] = useState<any[]>([]);
    const [isLoadingBahagi, setIsLoadingBahagi] = useState(false);

    // Form states
    const [showBahagiForm, setShowBahagiForm] = useState(false);
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [showYunitForm, setShowYunitForm] = useState(false);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [selectedBahagiId, setSelectedBahagiId] = useState<number | null>(null);
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
            // Fetch teacher stats
            const statsResponse = await apiClient.teacherStats.getStats(user.id);
            
            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data.stats || []);
                setStudents(statsResponse.data.students || []);
                setClasses(statsResponse.data.classes || []);
                setWeeklyChart(statsResponse.data.weeklyChart || []);
                setMonthlyChart(statsResponse.data.monthlyChart || []);
            } else {
                console.warn('Stats API error:', statsResponse.error);
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

    // Save active tab to sessionStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('teacher_active_tab', activeTab);
        }
    }, [activeTab]);

    // Restore class detail view on page reload
    useEffect(() => {
        const restoreClassView = async () => {
            // Only restore if:
            // 1. We have a selected class ID from sessionStorage
            // 2. We're on the classes tab
            // 3. Classes have been loaded
            // 4. Bahagi haven't been loaded yet (to avoid re-fetching)
            if (selectedClassId && selectedClassName && activeTab === 'classes' && classes.length > 0 && classBahagi.length === 0) {
                console.log('[RESTORE] Restoring class view for:', selectedClassName);
                setIsLoadingBahagi(true);
                try {
                    // Fetch bahagi for the restored class
                    const bahagiResult = await apiClient.bahagi.fetchAll(user?.id, selectedClassName);
                    
                    if (bahagiResult?.success) {
                        console.log('[RESTORE] Loaded bahagi:', bahagiResult.data);
                        setClassBahagi(bahagiResult.data || []);
                    } else {
                        console.warn('[RESTORE] Failed to fetch bahagi:', bahagiResult?.error);
                    }
                } catch (err) {
                    console.error('[RESTORE] Error fetching class data:', err);
                } finally {
                    setIsLoadingBahagi(false);
                }
            }
        };
        
        restoreClassView();
    }, [selectedClassId, selectedClassName, activeTab, classes, user?.id]);

    // Handle class creation
    const handleCreateClass = async (className: string) => {
        try {
            const response = await apiClient.class.create({
                name: className,
                teacher_id: user?.id || ''
            });
            
            if (response.success && response.data) {
                const newClass = response.data.class || response.data;
                setClasses([newClass, ...classes]);
                alert('✅ Class created successfully! Students will be automatically enrolled.');
            } else {
                alert(`❌ Error: ${response.error || 'Failed to create class'}`);
            }
        } catch (err) {
            console.error('Error creating class:', err);
            alert('❌ Failed to create class. Check browser console for details.');
        }
    };

    // Handle opening a class
    const handleOpenClass = async (classId: string) => {
        const selectedClass = classes.find(c => c.id === classId);
        if (selectedClass) {
            setActiveTab('classes'); // Ensure we're on the classes tab
            setSelectedClassId(classId);
            setSelectedClassName(selectedClass.name);
            // Persist to sessionStorage
            sessionStorage.setItem('teacher_selected_class_id', classId);
            sessionStorage.setItem('teacher_selected_class_name', selectedClass.name);
            // Load Bahagi for this class
            setIsLoadingBahagi(true);
            try {
                console.log('[handleOpenClass] Fetching bahagi for:', {
                    teacherId: user?.id,
                    className: selectedClass.name
                });
                
                // Fetch bahagi filtered by teacher and className
                const bahagiResult = await apiClient.bahagi.fetchAll(user?.id, selectedClass.name);

                console.log('[handleOpenClass] Bahagi result:', bahagiResult);

                // Handle bahagi response
                if (bahagiResult?.success) {
                    console.log(`Loaded ${bahagiResult.data?.length || 0} bahagi for class ${selectedClass.name}`);
                    setClassBahagi(bahagiResult.data || []);
                } else {
                    console.warn('Failed to fetch bahagi:', bahagiResult?.error);
                    setClassBahagi([]);
                }
                
                // Clear lessons (we'll show bahagi with nested yunits instead)
                setClassLessons([]);
            } catch (err) {
                console.error('Error fetching class data:', err);
                setClassBahagi([]);
                setClassLessons([]);
            } finally {
                setIsLoadingBahagi(false);
            }
        }
    };

    // Handle going back from class detail
    const handleBackFromClassDetail = () => {
        setSelectedClassId(null);
        setSelectedClassName('');
        setClassBahagi([]);
        setClassLessons([]);
        // Clear from sessionStorage
        sessionStorage.removeItem('teacher_selected_class_id');
        sessionStorage.removeItem('teacher_selected_class_name');
    };

    // Handle archiving a class
    const handleArchiveClass = async (classId: string) => {
        try {
            const response = await apiClient.class.archiveClass(classId);
            
            if (response.success) {
                alert('✅ Class archived successfully!');
                // Refresh dashboard data to update class lists
                await fetchData();
            } else {
                alert(`❌ Error: ${response.error || 'Failed to archive class'}`);
            }
        } catch (err) {
            console.error('Error archiving class:', err);
            alert('❌ Failed to archive class. Check browser console for details.');
        }
    };

    // Handle restoring an archived class
    const handleRestoreClass = async (classId: string) => {
        try {
            const response = await apiClient.class.restoreClass(classId);
            
            if (response.success) {
                alert('✅ Class restored successfully!');
                // Refresh dashboard data to update class lists
                await fetchData();
            } else {
                alert(`❌ Error: ${response.error || 'Failed to restore class'}`);
            }
        } catch (err) {
            console.error('Error restoring class:', err);
            alert('❌ Failed to restore class. Check browser console for details.');
        }
    };

    // Handle creating bahagi (show modal)
    const handleCreateBahagi = () => {
        setShowBahagiForm(true);
    };

    // Handle profile update
    const handleUpdateProfile = async (data: { firstName: string; lastName: string; email: string }) => {
        if (!user?.id) {
            alert('❌ User ID not found');
            return;
        }

        try {
            const response = await apiClient.user.updateOwnProfile(user.id, {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email
            });

            if (response.success && response.data) {
                alert('✅ Profile updated successfully!');
                
                // Update local user state to reflect changes in the UI
                const savedUser = localStorage.getItem('nllc_user');
                if (savedUser) {
                    const userObj = JSON.parse(savedUser);
                    userObj.firstName = data.firstName;
                    userObj.lastName = data.lastName;
                    userObj.email = data.email;
                    localStorage.setItem('nllc_user', JSON.stringify(userObj));
                }
                
                // Save current tab to persist after reload
                sessionStorage.setItem('teacher_active_tab', 'profile');
                
                // Force page reload to update all user references
                window.location.reload();
            } else {
                alert(`❌ Error: ${response.error || 'Failed to update profile'}`);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('❌ Failed to update profile. Check browser console for details.');
        }
    };

    // Handle refreshing bahagi list after edit
    const handleRefreshBahagi = async () => {
        if (!selectedClassId || !selectedClassName) return;
        console.log('[REFRESH BAHAGI] Starting refresh for class:', selectedClassName);
        console.log('[REFRESH BAHAGI] Timestamp:', new Date().toISOString());
        setIsLoadingBahagi(true);
        try {
            const bahagiResult = await apiClient.bahagi.fetchAll(user?.id, selectedClassName);
            
            console.log('[REFRESH BAHAGI] Full response:', bahagiResult);
            console.log('[REFRESH BAHAGI] Response timestamp:', new Date().toISOString());
            
            if (bahagiResult?.success) {
                const newBahagi = bahagiResult.data || [];
                console.log('[REFRESH BAHAGI] Fetched bahagi count:', newBahagi.length);
                console.log('[REFRESH BAHAGI] Bahagi data:', JSON.stringify(newBahagi, null, 2));
                console.log('[REFRESH BAHAGI] Current classBahagi before update:', classBahagi.length);
                
                // Force new array reference to trigger re-render
                setClassBahagi([...newBahagi]);
                
                // Verify state update happened
                setTimeout(() => {
                    console.log('[REFRESH BAHAGI] State updated, should trigger re-render');
                }, 100);
                
                console.log('✅ Bahagi list refreshed successfully');
            } else {
                console.error('[REFRESH BAHAGI] Failed:', bahagiResult?.error);
            }
        } catch (err) {
            console.error('[REFRESH BAHAGI] Error:', err);
            console.error('[REFRESH BAHAGI] Error timestamp:', new Date().toISOString());
        } finally {
            setIsLoadingBahagi(false);
        }
    };

    // Handle bahagi form submission
    const handleBahagiSubmit = async (data: any) => {
        try {
            const bahagiData = {
                title: data.title,
                quarter: data.quarter,
                week_number: data.week_number,
                module_number: data.module_number,
                classId: selectedClassId || data.classId,
                className: selectedClassName || data.className,
                teacher_id: user?.id || ''
            };

            console.log('[handleBahagiSubmit] Sending data:', bahagiData);

            const response = await apiClient.bahagi.create(bahagiData);

            console.log('[handleBahagiSubmit] Response:', response);

            if (response && response.bahagi) {
                setShowBahagiForm(false);
                // Small delay to ensure database commit
                await new Promise(resolve => setTimeout(resolve, 500));
                // Refresh bahagi list to show the newly created one
                await handleRefreshBahagi();
                alert('✅ Bahagi created successfully!');
            } else {
                console.error('[handleBahagiSubmit] Unexpected response:', response);
                alert(`❌ Error: Failed to create bahagi`);
            }
        } catch (err: any) {
            console.error('[handleBahagiSubmit] Exception:', err);
            alert(`❌ Failed to create bahagi: ${err.message || 'Unknown error'}`);
        }
    };

    // Handle creating lesson (show modal)
    const handleCreateLesson = () => {
        setShowLessonForm(true);
    };

    // Handle lesson form submission
    const handleLessonSubmit = async (data: any) => {
        try {
            const response = await apiClient.lesson.addItem('0', {
                ...data,
                teacher_id: user?.id,
                class_name: selectedClassName
            });

            if (response.success) {
                alert('✅ Lesson created successfully!');
                setShowLessonForm(false);
                // TODO: Refresh Bahagi view
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (err) {
            console.error('Error creating lesson:', err);
            alert('❌ Failed to create lesson');
        }
    };

    // Handle creating yunit (for Bahagi)
    const handleCreateYunit = (bahagiId: number) => {
        setSelectedBahagiId(bahagiId);
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
            console.log('[handleYunitSubmit] Creating yunit with data:', data);
            
            // Call the bahagi lessons endpoint
            const response = await fetch(`/api/teacher/bahagi/${data.bahagiId}/lessons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: data.title,
                    subtitle: data.subtitle || data.description,
                    discussion: data.discussion,
                    media_url: data.media_url,
                    audio_url: data.audio_url,
                    lesson_order: data.lesson_order
                })
            });

            const result = await response.json();
            
            console.log('[handleYunitSubmit] Response:', result);

            if (response.ok && result.lesson) {
                setShowYunitForm(false);
                setSelectedBahagiId(null);
                // Small delay to ensure database commit
                await new Promise(resolve => setTimeout(resolve, 500));
                // Refresh bahagi list to show the new yunit count
                await handleRefreshBahagi();
                alert('✅ Yunit created successfully!');
            } else {
                alert(`❌ Error: ${result.error || 'Failed to create yunit'}`);
            }
        } catch (err: any) {
            console.error('[handleYunitSubmit] Exception:', err);
            alert(`❌ Failed to create yunit: ${err.message || 'Unknown error'}`);
        }
    };

    // Handle assessment form submission
    const handleAssessmentSubmit = async (data: any) => {
        try {
            const response = await apiClient.assessment.create({
                ...data,
                yunit_id: 0,
                bahagi_id: 0,
                teacher_id: user?.id
            });

            if (response.success) {
                alert('✅ Assessment created successfully!');
                setShowAssessmentForm(false);
                // Refresh lessons
                // TODO: Refresh class lessons
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (err) {
            console.error('Error creating assessment:', err);
            alert('❌ Failed to create assessment');
        }
    };

    // Handle deleting lesson
    const handleDeleteLesson = async (lessonId: string) => {
        try {
            const response = await apiClient.lesson.deleteLesson(lessonId);

            if (response.success) {
                alert('✅ Lesson deleted successfully!');
                // TODO: Refresh Bahagi view
            } else {
                alert(`❌ Error: ${response.error}`);
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
            const response = await apiClient.yunit.deleteYunit(parseInt(yunitId));

            if (response.success) {
                alert('✅ Yunit deleted successfully!');
                // TODO: Refresh Bahagi view
            } else {
                alert(`❌ Error: ${response.error}`);
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
            const response = await apiClient.assessment.deleteAssessment(parseInt(assessmentId));

            if (response.success) {
                alert('✅ Assessment deleted successfully!');
                // TODO: Refresh Bahagi view
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (err) {
            console.error('Error deleting assessment:', err);
            alert('❌ Failed to delete assessment');
        }
    };

    // Handle logout
    const handleLogout = () => {
        setShowLogoutModal(false);
        // Clear all session storage related to teacher dashboard
        sessionStorage.removeItem('teacher_active_tab');
        sessionStorage.removeItem('teacher_selected_class_id');
        sessionStorage.removeItem('teacher_selected_class_name');
        onLogout();
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex selection:bg-brand-purple text-slate-200 relative overflow-hidden">
            {/* Sidebar */}
            <TeacherSidebar
                activeTab={activeTab}
                onTabChange={(tab: 'overview' | 'classes' | 'profile') => {
                    setActiveTab(tab);
                    setSelectedClassId(null); // Clear class detail view when switching tabs
                    // Clear from sessionStorage when switching tabs
                    sessionStorage.removeItem('teacher_selected_class_id');
                    sessionStorage.removeItem('teacher_selected_class_name');
                }}
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
                            teacherId={user?.id}
                            onBack={handleBackFromClassDetail}
                            onCreateBahagi={handleCreateBahagi}
                            onRefreshBahagi={handleRefreshBahagi}
                            onCreateLesson={handleCreateLesson}
                            onCreateYunit={handleCreateYunit}
                            onCreateAssessment={handleCreateAssessment}
                            onEditLesson={handleEditLesson}
                            onEditYunit={handleEditYunit}
                            onEditAssessment={handleEditAssessment}
                            onDeleteYunit={handleDeleteYunit}
                            onDeleteAssessment={handleDeleteAssessment}
                            bahagi={classBahagi}
                            lessons={classLessons}
                            onDeleteLesson={handleDeleteLesson}
                            isLoadingBahagi={isLoadingBahagi}
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
                                    onArchiveClass={handleArchiveClass}
                                    onRestoreClass={handleRestoreClass}
                                />
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <TeacherProfilePage
                                    user={user}
                                    onUpdate={handleUpdateProfile}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Bahagi Form Modal */}
            {showBahagiForm && selectedClassId && (
                <CreateBahagiForm
                    isOpen={showBahagiForm}
                    onClose={() => setShowBahagiForm(false)}
                    onSubmit={handleBahagiSubmit}
                    classId={selectedClassId}
                    className={selectedClassName}
                />
            )}

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
            {showYunitForm && selectedBahagiId && (
                <CreateYunitForm
                    isOpen={showYunitForm}
                    onClose={() => {
                        setShowYunitForm(false);
                        setSelectedBahagiId(null);
                    }}
                    onSubmit={handleYunitSubmit}
                    bahagiId={selectedBahagiId}
                    bahagiTitle={classBahagi.find(b => b.id === selectedBahagiId)?.title || ''}
                />
            )}

            {/* Assessment Form Modal */}
            {showAssessmentForm && selectedBahagiId && (
                <CreateAssessmentForm
                    isOpen={showAssessmentForm}
                    onClose={() => {
                        setShowAssessmentForm(false);
                        setSelectedBahagiId(null);
                    }}
                    onSubmit={handleAssessmentSubmit}
                    bahagiId={selectedBahagiId}
                    bahagiTitle={classBahagi.find(b => b.id === selectedBahagiId)?.title || ''}
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
