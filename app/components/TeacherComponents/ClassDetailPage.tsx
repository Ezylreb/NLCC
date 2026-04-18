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
    onDeleteLesson
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

    // Fetch yunits for a bahagi
    const fetchYunitsForBahagi = async (bahagiId: number) => {
        setIsLoadingYunits(true);
        try {
            const response = await apiClient.yunit.fetchByBahagi(bahagiId);
            if (response.data?.yunits) {
                setBahagiYunits(prev => ({
                    ...prev,
                    [bahagiId]: response.data.yunits || []
                }));
            }
        } catch (err) {
            console.error('Error fetching yunits:', err);
        } finally {
            setIsLoadingYunits(false);
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
        try {
            const result = await apiClient.yunit.create({
                bahagi_id: data.bahagiId,
                title: data.title,
                description: data.description,
                discussion: data.discussion,
                media_url: data.mediaUrl
            });

            if (result.success) {
                alert('✅ Yunit created successfully!');
                setShowYunitForm(false);
                // Refresh yunits
                fetchYunitsForBahagi(data.bahagiId);
            } else {
                alert(`❌ Error: ${result.error || 'Failed to create yunit'}`);
            }
        } catch (err: any) {
            console.error('Error creating yunit:', err);
            alert('❌ Failed to create yunit');
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
                alert('✅ Bahagi updated successfully!');
                setShowEditBahagiForm(false);
                // Refresh the bahagi list after successful edit
                if (onRefreshBahagi) {
                    await onRefreshBahagi();
                }
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
                        {bahagi.length} Bahagi{bahagi.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {bahagi.length > 0 ? (
                    <div className="space-y-4">
                        {bahagi.map((b) => (
                            <div key={b.id}>
                                <EnhancedBahagiCardV2
                                    id={b.id}
                                    title={b.title}
                                    description={b.description}
                                    iconPath={b.icon_path}
                                    iconType={b.icon_type}
                                    isArchived={b.is_archived}
                                    lessonCount={bahagiYunits[b.id]?.length || 0}
                                    assessmentCount={bahagiAssessments[b.id]?.length || 0}
                                    expanded={expandedBahagiId === b.id}
                                    onToggleExpand={() => handleToggleBahagiExpand(b.id)}
                                    onEdit={() => handleEditBahagi(b.id)}
                                    onArchive={() => handleArchiveBahagi(b.id)}
                                    onDelete={() => handleDeleteBahagi(b.id)}
                                    onAddYunit={() => handleCreateYunit(b)}
                                    userId={teacherId || ''}
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
                                                            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-start justify-between"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-white">{yunit.title}</p>
                                                                <p className="text-xs text-slate-400 mt-1">{yunit.subtitle}</p>
                                                                <div className="flex gap-2 mt-2">
                                                                    <span
                                                                        className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                                                                            yunit.is_published
                                                                                ? 'bg-green-900/30 text-green-400'
                                                                                : 'bg-orange-900/30 text-orange-400'
                                                                        }`}
                                                                    >
                                                                        {yunit.is_published ? '✓ Published' : '○ Draft'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="px-2 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded transition-all"
                                                                    onClick={() => handleEditYunit(yunit)}
                                                                    title="Edit Yunit"
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
