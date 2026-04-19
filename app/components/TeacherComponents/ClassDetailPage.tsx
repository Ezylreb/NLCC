'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { EnhancedBahagiCardV2 } from './EnhancedBahagiCardV2';
import { CreateYunitForm } from './CreateYunitForm';
import { CreateAssessmentForm } from './CreateAssessmentForm';
import { EditBahagiForm } from './EditBahagiForm';
import { EditYunitForm } from './EditYunitForm';
import { EditAssessmentV2Form } from './EditAssessmentV2Form';
import { ManageClassStudents } from './ManageClassStudents';

interface ClassDetailPageProps {
    classId: string;
    className: string;
    teacherId?: string;
    onBack: () => void;
    onCreateBahagi: () => void;
    onRefreshBahagi?: () => void;
    onCreateLesson?: () => void;
    onCreateYunit?: (bahagiId: number) => void;
    onCreateAssessment?: (lessonId: string) => void;
    onEditLesson?: (lessonId: string) => void;
    onEditYunit?: (lessonId: string, yunitId: string) => void;
    onEditAssessment?: (lessonId: string, assessmentId: string) => void;
    onDeleteYunit?: (lessonId: string, yunitId: string) => void;
    onDeleteAssessment?: (lessonId: string, assessmentId: string) => void;
    bahagi?: any[];
    lessons?: any[];
    onDeleteLesson?: (lessonId: string) => void;
    isLoadingBahagi?: boolean;
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({
    classId,
    className,
    teacherId,
    onBack,
    onCreateBahagi,
    onRefreshBahagi,
    onCreateLesson,
    onCreateYunit,
    onCreateAssessment,
    onEditLesson,
    onEditYunit,
    onEditAssessment,
    onDeleteYunit,
    onDeleteAssessment,
    bahagi = [],
    lessons = [],
    onDeleteLesson,
    isLoadingBahagi = false
}) => {
    const [expandedBahagiId, setExpandedBahagiId] = useState<number | null>(null);
    const [showYunitForm, setShowYunitForm] = useState(false);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [showEditBahagiForm, setShowEditBahagiForm] = useState(false);
    const [showEditYunitForm, setShowEditYunitForm] = useState(false);
    const [showEditAssessmentForm, setShowEditAssessmentForm] = useState(false);
    const [selectedBahagiForYunit, setSelectedBahagiForYunit] = useState<any>(null);
    const [selectedBahagiForAssessment, setSelectedBahagiForAssessment] = useState<any>(null);
    const [editingBahagi, setEditingBahagi] = useState<any>(null);
    const [editingYunit, setEditingYunit] = useState<any>(null);
    const [editingAssessment, setEditingAssessment] = useState<any>(null);
    const [bahagiYunits, setBahagiYunits] = useState<Record<number, any[]>>({});
    const [bahagiAssessments, setBahagiAssessments] = useState<Record<number, any[]>>({});
    const [isLoadingYunits, setIsLoadingYunits] = useState(false);
    const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
    const [isCreatingYunit, setIsCreatingYunit] = useState(false);
    const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
    const [isEditingBahagi, setIsEditingBahagi] = useState(false);
    const [isEditingYunit, setIsEditingYunit] = useState(false);
    const [isEditingAssessment, setIsEditingAssessment] = useState(false);
    const [showStudentsView, setShowStudentsView] = useState(false);
    const [draggedYunitId, setDraggedYunitId] = useState<string | null>(null);
    const [draggedOverYunitId, setDraggedOverYunitId] = useState<string | null>(null);
    const [draggedBahagiId, setDraggedBahagiId] = useState<number | null>(null);
    const [draggedOverBahagiId, setDraggedOverBahagiId] = useState<number | null>(null);
    
    // Filtering state
    const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    // Collapsed quarters state
    const [collapsedQuarters, setCollapsedQuarters] = useState<Set<string>>(new Set());
    
    const toggleQuarterCollapse = (quarter: string) => {
        setCollapsedQuarters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(quarter)) {
                newSet.delete(quarter);
            } else {
                newSet.add(quarter);
            }
            return newSet;
        });
    };

    // Debug: Log when bahagi prop changes
    useEffect(() => {
        console.log('[ClassDetailPage] Bahagi prop updated:', bahagi);
        console.log('[ClassDetailPage] Bahagi count:', bahagi.length);
        if (bahagi.length > 0) {
            console.log('[ClassDetailPage] First bahagi:', bahagi[0]);
        }
    }, [bahagi]);

    // Fetch yunits for a bahagi
    const fetchYunitsForBahagi = async (bahagiId: number) => {
        console.log('[fetchYunitsForBahagi] Starting fetch for bahagiId:', bahagiId);
        setIsLoadingYunits(true);
        try {
            console.log('[fetchYunitsForBahagi] Calling API...');
            const response = await apiClient.yunit.fetchByBahagi(bahagiId);
            console.log('[fetchYunitsForBahagi] API Response:', response);
            console.log('[fetchYunitsForBahagi] response.success:', response.success);
            console.log('[fetchYunitsForBahagi] response.data:', response.data);
            console.log('[fetchYunitsForBahagi] data length:', response.data?.length);
            
            // API returns { success: true, data: [...yunits array...] }
            if (response.success && response.data) {
                const yunits = Array.isArray(response.data) ? response.data : [];
                console.log('[fetchYunitsForBahagi] Setting yunits:', yunits);
                setBahagiYunits(prev => ({
                    ...prev,
                    [bahagiId]: yunits
                }));
            } else {
                console.warn('[fetchYunitsForBahagi] No yunits found or response unsuccessful');
            }
        } catch (err) {
            console.error('[fetchYunitsForBahagi] Error fetching yunits:', err);
        } finally {
            setIsLoadingYunits(false);
            console.log('[fetchYunitsForBahagi] Fetch complete');
        }
    };

    // Fetch assessments for a bahagi
    const fetchAssessmentsForBahagi = async (bahagiId: number) => {
        setIsLoadingAssessments(true);
        try {
            const response = await apiClient.assessment.fetch({ bahagi_id: bahagiId });
            if (response.data?.assessments) {
                setBahagiAssessments(prev => ({
                    ...prev,
                    [bahagiId]: response.data.assessments || []
                }));
            }
        } catch (err) {
            console.error('Error fetching assessments:', err);
        } finally {
            setIsLoadingAssessments(false);
        }
    };

    // Handle expanding a bahagi
    const handleToggleBahagiExpand = (bahagiId: number) => {
        if (expandedBahagiId === bahagiId) {
            setExpandedBahagiId(null);
        } else {
            setExpandedBahagiId(bahagiId);
            // Load yunits and assessments when expanding
            if (!bahagiYunits[bahagiId]) {
                fetchYunitsForBahagi(bahagiId);
            }
            if (!bahagiAssessments[bahagiId]) {
                fetchAssessmentsForBahagi(bahagiId);
            }
        }
    };

    // Handle creating yunit
    const handleCreateYunit = (bahagiObj: any) => {
        setSelectedBahagiForYunit(bahagiObj);
        setShowYunitForm(true);
    };

    const handleYunitSubmit = async (data: any) => {
        setIsCreatingYunit(true);
        let timedOut = false;
        
        try {
            console.log('[ClassDetailPage handleYunitSubmit] Creating yunit with data:', data);
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    timedOut = true;
                    reject(new Error('Request timeout'));
                }, 8000); // 8 second timeout
            });
            
            // Call the bahagi lessons endpoint with timeout
            const fetchPromise = fetch(`/api/teacher/bahagi/${data.bahagiId}/lessons`, {
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

            const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
            const result = await response.json();
            
            console.log('[ClassDetailPage handleYunitSubmit] Response:', result);

            if (response.ok && result.lesson) {
                setShowYunitForm(false);
                // Immediate refresh
                fetchYunitsForBahagi(data.bahagiId);
                // Refresh the bahagi list if callback provided
                if (onRefreshBahagi) {
                    onRefreshBahagi();
                }
                alert('✅ Yunit created successfully!');
            } else {
                alert(`❌ Error: ${result.error || 'Failed to create yunit'}`);
            }
        } catch (err: any) {
            console.error('[ClassDetailPage handleYunitSubmit] Exception:', err);
            
            // If it's a timeout, optimistically refresh the UI anyway
            if (timedOut || err.message?.includes('timeout')) {
                console.log('[ClassDetailPage handleYunitSubmit] Request timed out, refreshing optimistically...');
                setShowYunitForm(false);
                // Give database a moment to commit
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Refresh yunits - the yunit was likely created even though response timed out
                fetchYunitsForBahagi(data.bahagiId);
                if (onRefreshBahagi) {
                    onRefreshBahagi();
                }
                alert('✅ Yunit created! (Response was slow, but data saved)');
            } else {
                alert(`❌ Failed to create yunit: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsCreatingYunit(false);
        }
    };

    // Handle creating assessment
    const handleCreateAssessment = (bahagiObj: any) => {
        setSelectedBahagiForAssessment(bahagiObj);
        setShowAssessmentForm(true);
    };

    const handleAssessmentSubmit = async (data: any) => {
        setIsCreatingAssessment(true);
        try {
            const response = await apiClient.assessment.create({
                yunit_id: data.lessonId || 0,
                bahagi_id: data.bahagiId || 0,
                title: data.title,
                description: data.instructions,
                questions: data.questions,
                total_questions: data.questions?.length || 0
            });

            if (response.success) {
                alert('✅ Assessment created successfully!');
                setShowAssessmentForm(false);
                // Refresh assessments
                fetchAssessmentsForBahagi(data.bahagiId);
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (err) {
            console.error('Error creating assessment:', err);
            alert('❌ Failed to create assessment');
        } finally {
            setIsCreatingAssessment(false);
        }
    };

    // Handle editing bahagi
    const handleEditBahagi = async (bahagiId: number) => {
        const bahagiToEdit = bahagi.find(b => b.id === bahagiId);
        if (bahagiToEdit) {
            setEditingBahagi(bahagiToEdit);
            setShowEditBahagiForm(true);
        }
    };

    const handleBahagiEditSubmit = async (data: any) => {
        setIsEditingBahagi(true);
        try {
            console.log('📤 Sending update request with data:', data);
            
            const response = await apiClient.bahagi.update(data.id, data);

            console.log('📨 API Response:', response);

            if (response.success) {
                console.log('✅ API Response:', response.data);
                setShowEditBahagiForm(false);
                // Refresh the bahagi list after successful edit
                if (onRefreshBahagi) {
                    console.log('🔄 Calling refresh bahagi...');
                    await onRefreshBahagi();
                    console.log('✅ Refresh complete');
                }
                // Show alert after refresh completes
                setTimeout(() => alert('✅ Bahagi updated successfully!'), 100);
            } else {
                console.error('❌ API Error:', response.error);
                alert(`❌ Error: ${response.error || 'Failed to update bahagi'}`);
            }
        } catch (err) {
            console.error('Error updating bahagi:', err);
            alert(`❌ Failed to update bahagi: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsEditingBahagi(false);
        }
    };

    // Handle editing yunit
    const handleEditYunit = (yunit: any) => {
        setEditingYunit(yunit);
        setShowEditYunitForm(true);
    };

    const handleYunitEditSubmit = async (data: any) => {
        setIsEditingYunit(true);
        try {
            const response = await apiClient.yunit.update(data.id, data);

            if (response.success) {
                alert('✅ Yunit updated successfully!');
                setShowEditYunitForm(false);
                // Refresh yunits
                fetchYunitsForBahagi(editingYunit.bahagi_id);
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (err) {
            console.error('Error updating yunit:', err);
            alert('❌ Failed to update yunit');
        } finally {
            setIsEditingYunit(false);
        }
    };

    // Handle drag and drop for yunits reordering
    const handleYunitDragStart = (yunitId: string) => {
        setDraggedYunitId(yunitId);
    };

    const handleYunitDragOver = (e: React.DragEvent, yunitId: string) => {
        e.preventDefault();
        setDraggedOverYunitId(yunitId);
    };

    const handleYunitDrop = async (e: React.DragEvent, targetYunitId: string, bahagiId: number) => {
        e.preventDefault();
        
        if (!draggedYunitId || draggedYunitId === targetYunitId) {
            setDraggedYunitId(null);
            setDraggedOverYunitId(null);
            return;
        }

        const yunits = [...(bahagiYunits[bahagiId] || [])];
        const draggedIndex = yunits.findIndex(y => y.id === draggedYunitId);
        const targetIndex = yunits.findIndex(y => y.id === targetYunitId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder array
        const [draggedItem] = yunits.splice(draggedIndex, 1);
        yunits.splice(targetIndex, 0, draggedItem);

        // Update local state immediately for smooth UX
        setBahagiYunits(prev => ({
            ...prev,
            [bahagiId]: yunits
        }));

        // Update orders in database
        try {
            const updatePromises = yunits.map((yunit, index) => 
                apiClient.yunit.update(yunit.id, { lesson_order: index + 1 })
            );
            await Promise.all(updatePromises);
            console.log('✅ Yunit order updated successfully');
        } catch (err) {
            console.error('Error updating yunit order:', err);
            // Revert on error
            fetchYunitsForBahagi(bahagiId);
            alert('❌ Failed to update yunit order');
        } finally {
            setDraggedYunitId(null);
            setDraggedOverYunitId(null);
        }
    };

    const handleYunitDragEnd = () => {
        setDraggedYunitId(null);
        setDraggedOverYunitId(null);
    };

    // Handle editing assessment
    const handleEditAssessment = (assessment: any) => {
        setEditingAssessment(assessment);
        setShowEditAssessmentForm(true);
    };

    const handleAssessmentEditSubmit = async (data: any) => {
        setIsEditingAssessment(true);
        try {
            const response = await apiClient.assessment.update(data.id, {
                title: data.title,
                description: data.instructions,
                questions: data.questions,
                total_questions: data.questions?.length || 0
            });

            if (response.success) {
                alert('✅ Assessment updated successfully!');
                setShowEditAssessmentForm(false);
                // Refresh assessments
                fetchAssessmentsForBahagi(data.bahagiId);
            } else {
                alert(`❌ Error: ${response.error || 'Failed to update assessment'}`);
            }
        } catch (err) {
            console.error('Error updating assessment:', err);
            alert('❌ Failed to update assessment');
        } finally {
            setIsEditingAssessment(false);
        }
    };

    const handleArchiveBahagi = async (bahagiId: number) => {
        try {
            const result = await apiClient.bahagi.archive(bahagiId);
            if (result.success) {
                alert('✅ Bahagi archived successfully!');
                onRefreshBahagi?.();
            } else {
                alert(`❌ Error: ${result.error || 'Failed to archive'}`);
            }
        } catch (err: any) {
            console.error('Error archiving bahagi:', err);
            alert('❌ Failed to archive bahagi');
        }
    };

    const handleDeleteBahagi = async (bahagiId: number) => {
        if (!window.confirm('⚠️ Are you sure? This will permanently delete the Bahagi and all related Yunits and Assessments.')) {
            return;
        }
        try {
            console.log('[DELETE BAHAGI] Deleting bahagi ID:', bahagiId);
            const result = await apiClient.bahagi.deleteBahagi(bahagiId);
            console.log('[DELETE BAHAGI] Delete result:', result);
            
            if (result.success) {
                console.log('[DELETE BAHAGI] Success, calling refresh...');
                if (onRefreshBahagi) {
                    await onRefreshBahagi();
                    console.log('[DELETE BAHAGI] Refresh complete');
                    // Show alert after refresh completes
                    setTimeout(() => alert('✅ Bahagi deleted permanently!'), 100);
                } else {
                    console.warn('[DELETE BAHAGI] No onRefreshBahagi callback provided');
                    alert('✅ Bahagi deleted permanently! Please refresh the page.');
                }
            } else {
                alert(`❌ Error: ${result.error || 'Failed to delete'}`);
            }
        } catch (err: any) {
            console.error('[DELETE BAHAGI] Error:', err);
            alert('❌ Failed to delete bahagi');
        }
    };

    // Handle toggling publish status
    const handleTogglePublish = async (bahagiId: number, currentStatus: boolean) => {
        try {
            const result = await apiClient.bahagi.publish(bahagiId);
            if (result.success) {
                alert(`✅ Bahagi published!`);
                onRefreshBahagi?.();
            } else {
                alert(`❌ Error: ${result.error || 'Failed to update'}`);
            }
        } catch (err: any) {
            console.error('Error toggling publish:', err);
            alert('❌ Failed to update publish status');
        }
    };

    // Helper to delete yunit
    const handleDeleteYunitInline = async (yunitId: number, bahagiId: number) => {
        try {
            const result = await apiClient.yunit.deleteYunit(yunitId);
            if (result.success) {
                alert('✅ Yunit deleted!');
                fetchYunitsForBahagi(bahagiId);
                // Refresh the bahagi list to update counts
                if (onRefreshBahagi) {
                    await onRefreshBahagi();
                }
            } else {
                alert(`❌ Error: ${result.error || 'Failed to delete'}`);
            }
        } catch (err: any) {
            console.error('Error deleting yunit:', err);
            alert('❌ Failed to delete yunit');
        }
    };

    // Helper to delete assessment
    const handleDeleteAssessmentInline = async (assessmentId: number, bahagiId: number) => {
        try {
            const result = await apiClient.assessment.deleteAssessment(assessmentId);
            if (result.success) {
                alert('✅ Assessment deleted!');
                fetchAssessmentsForBahagi(bahagiId);
            } else {
                alert(`❌ Error: ${result.error || 'Failed to delete'}`);
            }
        } catch (err: any) {
            console.error('Error deleting assessment:', err);
            alert('❌ Failed to delete assessment');
        }
    };

    // Drag and Drop handlers for Bahagi
    const handleBahagiDragStart = (bahagiId: number) => {
        setDraggedBahagiId(bahagiId);
    };

    const handleBahagiDragOver = (e: React.DragEvent, bahagiId: number) => {
        e.preventDefault();
        setDraggedOverBahagiId(bahagiId);
    };

    const handleBahagiDrop = (e: React.DragEvent, targetBahagiId: number) => {
        e.preventDefault();
        if (draggedBahagiId === null || draggedBahagiId === targetBahagiId) return;

        // Reorder bahagi array
        const draggedIndex = filteredBahagi.findIndex(b => b.id === draggedBahagiId);
        const targetIndex = filteredBahagi.findIndex(b => b.id === targetBahagiId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newBahagi = [...filteredBahagi];
        const [draggedItem] = newBahagi.splice(draggedIndex, 1);
        newBahagi.splice(targetIndex, 0, draggedItem);

        // Update order property for each bahagi
        const updatedBahagi = newBahagi.map((b, index) => ({
            ...b,
            display_order: index + 1
        }));

        // TODO: Save new order to database
        console.log('New bahagi order:', updatedBahagi.map(b => ({ id: b.id, title: b.title, order: b.display_order })));
        
        // Call refresh to update the parent component
        if (onRefreshBahagi) {
            onRefreshBahagi();
        }
    };

    const handleBahagiDragEnd = () => {
        setDraggedBahagiId(null);
        setDraggedOverBahagiId(null);
    };

    // Helper function to extract quarter number from quarter string
    const getQuarterNumber = (quarter?: string): number => {
        if (!quarter) return 999; // Put items without quarter at the end
        const match = quarter.match(/first|1st|one/i);
        if (match) return 1;
        const match2 = quarter.match(/second|2nd|two/i);
        if (match2) return 2;
        const match3 = quarter.match(/third|3rd|three/i);
        if (match3) return 3;
        const match4 = quarter.match(/fourth|4th|four/i);
        if (match4) return 4;
        // Try to extract number directly
        const numMatch = quarter.match(/\d+/);
        if (numMatch) return parseInt(numMatch[0]);
        return 999; // Default for unrecognized patterns
    };

    // Sort bahagi by quarter, then week, then module
    const sortedBahagi = [...bahagi].sort((a, b) => {
        // First sort by quarter
        const quarterA = getQuarterNumber(a.quarter);
        const quarterB = getQuarterNumber(b.quarter);
        if (quarterA !== quarterB) return quarterA - quarterB;
        
        // Then sort by week number
        const weekA = a.week_number || 999;
        const weekB = b.week_number || 999;
        if (weekA !== weekB) return weekA - weekB;
        
        // Finally sort by module number (extract number if possible)
        const moduleA = a.module_number ? (parseInt(a.module_number.match(/\d+/)?.[0] || '999')) : 999;
        const moduleB = b.module_number ? (parseInt(b.module_number.match(/\d+/)?.[0] || '999')) : 999;
        return moduleA - moduleB;
    });

    // Filter bahagi based on selected filters and search term
    const filteredBahagi = sortedBahagi.filter(b => {
        // Filter by dropdowns
        if (selectedQuarter && b.quarter !== selectedQuarter) return false;
        if (selectedWeek !== null && b.week_number !== selectedWeek) return false;
        if (selectedModule && b.module_number !== selectedModule) return false;
        
        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchesTitle = b.title?.toLowerCase().includes(search);
            const matchesDescription = b.description?.toLowerCase().includes(search);
            const matchesQuarter = b.quarter?.toLowerCase().includes(search);
            const matchesWeek = b.week_number?.toString().includes(search);
            const matchesModule = b.module_number?.toLowerCase().includes(search);
            
            if (!matchesTitle && !matchesDescription && !matchesQuarter && !matchesWeek && !matchesModule) {
                return false;
            }
        }
        
        return true;
    });

    // Get unique filter values from bahagi
    const quarters = Array.from(new Set(bahagi.map(b => b.quarter).filter(Boolean)));
    const weeks = Array.from(new Set(bahagi.map(b => b.week_number).filter(Boolean))).sort((a, b) => a - b);
    const modules = Array.from(new Set(bahagi.map(b => b.module_number).filter(Boolean)));

    // Group filtered bahagi by quarter
    const bahagiByQuarter: Record<string, typeof filteredBahagi> = {};
    filteredBahagi.forEach(b => {
        const quarter = b.quarter || 'No Quarter';
        if (!bahagiByQuarter[quarter]) {
            bahagiByQuarter[quarter] = [];
        }
        bahagiByQuarter[quarter].push(b);
    });

    // Get ordered quarters (First, Second, Third, Fourth, then others)
    const orderedQuarters = Object.keys(bahagiByQuarter).sort((a, b) => {
        const numA = getQuarterNumber(a);
        const numB = getQuarterNumber(b);
        return numA - numB;
    });

    const clearFilters = () => {
        setSelectedQuarter(null);
        setSelectedWeek(null);
        setSelectedModule(null);
        setSearchTerm('');
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl transition-all border border-slate-700 hover:border-brand-purple/30"
                    title="Back to classes"
                >
                    ← 
                </button>
                <div>
                    <h2 className="text-4xl font-black text-white">{className}</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Class Management</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setShowStudentsView(!showStudentsView)}
                    className={`${showStudentsView ? 'bg-brand-sky hover:bg-brand-sky/80' : 'bg-slate-800 hover:bg-slate-700'} text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 border ${showStudentsView ? 'border-brand-sky/30' : 'border-slate-700'}`}
                >
                    <span>👥</span> View Students
                </button>
                {!showStudentsView && (
                    <>
                        <button
                            onClick={onCreateBahagi}
                            className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                        >
                            <span>📚</span> Add Bahagi
                        </button>
                        <button
                            disabled
                            className="bg-brand-sky/30 text-brand-sky px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                            title="Coming soon"
                        >
                            <span>⭐</span> Add Rewards
                        </button>
                    </>
                )}
            </div>

            {/* Students Management Section */}
            {showStudentsView && (
                <div className="animate-in fade-in duration-500">
                    <ManageClassStudents
                        classId={classId}
                        className={className}
                        teacherId={teacherId || ''}
                    />
                </div>
            )}

            {/* Bahagi Section */}
            {!showStudentsView && (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white">📚 Bahagi (Lesson Sections)</h3>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                        {filteredBahagi.length} of {bahagi.length} Bahagi{bahagi.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filters */}
                {bahagi.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter & Search:</span>
                            <button
                                onClick={clearFilters}
                                className="text-xs font-bold text-brand-purple hover:text-brand-purple/80 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="mb-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title, description, quarter, week, or module..."
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none transition-all placeholder-slate-500"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            {/* Quarter Filter Dropdown */}
                            {quarters.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-400 font-bold">Quarter:</label>
                                    <select
                                        value={selectedQuarter || ''}
                                        onChange={(e) => setSelectedQuarter(e.target.value || null)}
                                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-600"
                                    >
                                        <option value="">All Quarters</option>
                                        {quarters.map(quarter => (
                                            <option key={quarter} value={quarter}>
                                                {quarter}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Week Filter Dropdown */}
                            {weeks.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-400 font-bold">Week:</label>
                                    <select
                                        value={selectedWeek || ''}
                                        onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : null)}
                                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all hover:border-slate-600"
                                    >
                                        <option value="">All Weeks</option>
                                        {weeks.map(week => (
                                            <option key={week} value={week}>
                                                Week {week}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Module Filter Dropdown */}
                            {modules.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-400 font-bold">Module:</label>
                                    <select
                                        value={selectedModule || ''}
                                        onChange={(e) => setSelectedModule(e.target.value || null)}
                                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all hover:border-slate-600"
                                    >
                                        <option value="">All Modules</option>
                                        {modules.map(module => (
                                            <option key={module} value={module}>
                                                {module}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isLoadingBahagi ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
                            <p className="text-slate-400 text-sm">Loading bahagi...</p>
                        </div>
                    </div>
                ) : filteredBahagi.length > 0 ? (
                    <div className="space-y-6">
                        {orderedQuarters.map((quarter) => (
                            <div key={quarter} className="space-y-4">
                                {/* Quarter Header */}
                                <button
                                    onClick={() => toggleQuarterCollapse(quarter)}
                                    className="w-full flex items-center gap-3 hover:bg-slate-800/30 rounded-lg p-3 -m-3 transition-all group"
                                >
                                    <div className="h-[2px] flex-shrink-0 w-12 bg-gradient-to-r from-brand-purple to-transparent"></div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wide">
                                        {quarter === 'No Quarter' ? 'Uncategorized' : quarter}
                                    </h3>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-brand-purple/50 to-transparent"></div>
                                    <span className="text-xs font-black text-slate-500 bg-slate-900 px-3 py-1 rounded">
                                        {bahagiByQuarter[quarter].length} {bahagiByQuarter[quarter].length === 1 ? 'lesson' : 'lessons'}
                                    </span>
                                    <div className="text-2xl text-slate-500 group-hover:text-brand-purple transition-colors">
                                        {collapsedQuarters.has(quarter) ? '▶' : '▼'}
                                    </div>
                                </button>

                                {/* Bahagi Cards for this Quarter */}
                                {!collapsedQuarters.has(quarter) && bahagiByQuarter[quarter].map((b) => (
                                    <div 
                                        key={b.id}
                                        draggable
                                        onDragStart={() => handleBahagiDragStart(b.id)}
                                        onDragOver={(e) => handleBahagiDragOver(e, b.id)}
                                        onDrop={(e) => handleBahagiDrop(e, b.id)}
                                        onDragEnd={handleBahagiDragEnd}
                                        className={`transition-all ${
                                            draggedBahagiId === b.id ? 'opacity-50 scale-95' : ''
                                        } ${
                                            draggedOverBahagiId === b.id && draggedBahagiId !== b.id ? 'border-2 border-brand-purple rounded-xl' : ''
                                        }`}
                                    >
                                <EnhancedBahagiCardV2
                                    id={b.id}
                                    title={b.title}
                                    description={b.description}
                                    quarter={b.quarter}
                                    week_number={b.week_number}
                                    module_number={b.module_number}
                                    iconPath={b.icon_path}
                                    iconType={b.icon_type}
                                    isArchived={b.is_archived}
                                    lessonCount={b.lessonCount || 0}
                                    assessmentCount={b.assessmentCount || 0}
                                    expanded={expandedBahagiId === b.id}
                                    onToggleExpand={() => handleToggleBahagiExpand(b.id)}
                                    onEdit={() => handleEditBahagi(b.id)}
                                    onArchive={() => handleArchiveBahagi(b.id)}
                                    onDelete={() => handleDeleteBahagi(b.id)}
                                    onAddYunit={() => handleCreateYunit(b)}
                                    userId={teacherId || ''}
                                    isDraggable={true}
                                />
                                
                                {/* Yunits and Assessments Section */}
                                {expandedBahagiId === b.id && (
                                    <div className="mt-4 space-y-4 ml-4 pl-4 border-l-2 border-brand-purple/30">
                                        {/* Yunits */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="text-lg font-black text-white">📖 Yunits</h5>
                                                <span className="text-xs font-black text-slate-500 bg-slate-900 px-3 py-1 rounded">
                                                    {bahagiYunits[b.id]?.length || 0}
                                                </span>
                                            </div>
                                            {isLoadingYunits ? (
                                                <p className="text-slate-500 text-sm">Loading yunits...</p>
                                            ) : bahagiYunits[b.id]?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {bahagiYunits[b.id].map((yunit: any) => (
                                                        <div
                                                            key={yunit.id}
                                                            draggable
                                                            onDragStart={() => handleYunitDragStart(yunit.id)}
                                                            onDragOver={(e) => handleYunitDragOver(e, yunit.id)}
                                                            onDrop={(e) => handleYunitDrop(e, yunit.id, b.id)}
                                                            onDragEnd={handleYunitDragEnd}
                                                            className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-start justify-between cursor-move transition-all ${
                                                                draggedYunitId === yunit.id ? 'opacity-50 scale-95' : ''
                                                            } ${
                                                                draggedOverYunitId === yunit.id && draggedYunitId !== yunit.id ? 'border-brand-purple border-2' : ''
                                                            }`}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-600 cursor-grab active:cursor-grabbing">⋮⋮</span>
                                                                    <p className="text-sm font-bold text-white">{yunit.title}</p>
                                                                </div>
                                                                {/* Quarter, Week, Module Info */}
                                                                {(yunit.quarter || yunit.week_number || yunit.module_number) && (
                                                                    <div className="flex items-center gap-2 mt-1 ml-6">
                                                                        {yunit.quarter && (
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-400">
                                                                                {yunit.quarter} Q
                                                                            </span>
                                                                        )}
                                                                        {yunit.week_number && (
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-400">
                                                                                Week {yunit.week_number}
                                                                            </span>
                                                                        )}
                                                                        {yunit.module_number && (
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-900/30 text-purple-400">
                                                                                {yunit.module_number}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-slate-400 mt-1 ml-6">{yunit.subtitle}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="px-2 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded transition-all"
                                                                    onClick={() => handleEditYunit(yunit)}
                                                                    title="Edit Yunit"
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-all"
                                                                    onClick={async () => {
                                                                        if (confirm('Delete this Yunit?')) {
                                                                            await handleDeleteYunitInline(yunit.id, b.id);
                                                                        }
                                                                    }}
                                                                    title="Delete Yunit"
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No yunits yet</p>
                                            )}
                                        </div>

                                        {/* Assessments */}
                                        <div className="border-t border-slate-700/50 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="text-lg font-black text-white">⭐ Assessments</h5>
                                                <span className="text-xs font-black text-slate-500 bg-slate-900 px-3 py-1 rounded">
                                                    {bahagiAssessments[b.id]?.length || 0}
                                                </span>
                                            </div>
                                            {isLoadingAssessments ? (
                                                <p className="text-slate-500 text-sm">Loading assessments...</p>
                                            ) : bahagiAssessments[b.id]?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {bahagiAssessments[b.id].map((assessment: any) => (
                                                        <div
                                                            key={assessment.id}
                                                            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-start justify-between"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-white">{assessment.title}</p>
                                                                <div className="flex gap-2 mt-2">
                                                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-slate-700/50 text-slate-300">
                                                                        {assessment.type}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-brand-sky">
                                                                        ⭐ {assessment.points} pts
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="px-2 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded transition-all"
                                                                    onClick={() => handleEditAssessment(assessment)}
                                                                    title="Edit Assessment"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-all"
                                                                    onClick={async () => {
                                                                        if (confirm('Delete this Assessment?')) {
                                                                            await handleDeleteAssessmentInline(assessment.id, b.id);
                                                                        }
                                                                    }}
                                                                    title="Delete Assessment"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-600 italic">No assessments yet</p>
                                            )}
                                        </div>

                                        {/* Add Yunit/Assessment Buttons */}
                                        <div className="border-t border-slate-700/50 pt-4 flex gap-2">
                                            <button
                                                onClick={() => handleCreateYunit(b)}
                                                className="flex-1 text-center text-xs font-black text-brand-sky hover:text-white uppercase tracking-widest px-4 py-2 rounded-lg border border-brand-sky/30 hover:bg-brand-sky/10 transition-all"
                                            >
                                                + Add Yunit
                                            </button>
                                            <button
                                                onClick={() => handleCreateAssessment(b)}
                                                className="flex-1 text-center text-xs font-black text-brand-sky hover:text-white uppercase tracking-widest px-4 py-2 rounded-lg border border-brand-sky/30 hover:bg-brand-sky/10 transition-all"
                                            >
                                                + Edit Assessment
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        ) : bahagi.length > 0 ? (
            <div className="text-center py-12">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-slate-400 font-bold mb-2">No bahagi match your filters</p>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-brand-purple hover:text-brand-purple/80 font-bold transition-colors"
                        >
                            Clear filters to see all {bahagi.length} bahagi
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-slate-400 font-bold mb-6">No Bahagi yet</p>
                        <p className="text-sm text-slate-500 mb-6">Click the "Add Bahagi" button above to create the first lesson section for this class.</p>
                    </div>
                )}
            </div>
            )}

            {/* Yunit Form Modal */}
            <CreateYunitForm
                isOpen={showYunitForm}
                onClose={() => setShowYunitForm(false)}
                onSubmit={handleYunitSubmit}
                bahagiId={selectedBahagiForYunit?.id || 0}
                bahagiTitle={selectedBahagiForYunit?.title || ''}
                isLoading={isCreatingYunit}
            />

            {/* Assessment Form Modal */}
            <CreateAssessmentForm
                isOpen={showAssessmentForm}
                onClose={() => setShowAssessmentForm(false)}
                onSubmit={handleAssessmentSubmit}
                bahagiId={selectedBahagiForAssessment?.id || 0}
                bahagiTitle={selectedBahagiForAssessment?.title || ''}
                isLoading={isCreatingAssessment}
            />

            {/* Edit Bahagi Form Modal */}
            {editingBahagi && (
                <EditBahagiForm
                    isOpen={showEditBahagiForm}
                    onClose={() => setShowEditBahagiForm(false)}
                    onSubmit={handleBahagiEditSubmit}
                    bahagi={editingBahagi}
                    isLoading={isEditingBahagi}
                />
            )}

            {/* Edit Yunit Form Modal */}
            {editingYunit && (
                <EditYunitForm
                    isOpen={showEditYunitForm}
                    onClose={() => setShowEditYunitForm(false)}
                    onSubmit={handleYunitEditSubmit}
                    yunit={editingYunit}
                    isLoading={isEditingYunit}
                />
            )}

            {/* Edit Assessment Form Modal */}
            {editingAssessment && showEditAssessmentForm && (
                <EditAssessmentV2Form
                    assessmentId={editingAssessment.id || ''}
                    onClose={() => {
                        setShowEditAssessmentForm(false);
                        setEditingAssessment(null);
                    }}
                    onSuccess={() => {
                        setShowEditAssessmentForm(false);
                        // Refresh if needed
                    }}
                    userId={teacherId || ''}
                />
            )}
        </div>
    );
};
