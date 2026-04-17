'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { AssessmentAnswerSubmission } from './AssessmentAnswerSubmission';

interface StudentYunitViewProps {
  classId: string;
  bahagiId: string;
  studentId: string;
  onBack?: () => void;
}

export const StudentYunitView: React.FC<StudentYunitViewProps> = ({
  classId,
  bahagiId,
  studentId,
  onBack
}) => {
  const [yunits, setYunits] = useState<any[]>([]);
  const [selectedYunit, setSelectedYunit] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, any>>({});

  // Fetch yunits in this bahagi
  useEffect(() => {
    const fetchYunits = async () => {
      try {
        const response = await apiClient.yunit.fetchByBahagi(parseInt(bahagiId));
        if (response.success && response.data) {
          setYunits(response.data.yunits || response.data);
        }
      } catch (err) {
        console.error('Error fetching yunits:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYunits();
  }, [bahagiId]);

  // Fetch assessments for selected yunit
  useEffect(() => {
    if (!selectedYunit) return;

    const fetchAssessments = async () => {
      try {
        const response = await apiClient.assessment.fetch({ yunit_id: selectedYunit.id });
        if (response.success && response.data) {
          setAssessments(response.data.assessments || response.data);
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
      }
    };

    fetchAssessments();
  }, [selectedYunit]);

  // Calculate progress
  const calculateProgress = () => {
    const totalAssessments = assessments.length;
    const completedAssessments = assessments.filter(a => progress[a.id]).length;
    return totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;
  };

  const handleAssessmentComplete = (assessmentId: string, result: any) => {
    setProgress(prev => ({
      ...prev,
      [assessmentId]: result
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-purple rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">Loading yunit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              ← Back
            </button>
          )}
          <h2 className="text-3xl font-black text-white">📚 Lesson</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lessons List */}
        <div className="col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 sticky top-6">
            <h3 className="text-lg font-black text-white mb-4">📖 Lessons</h3>
            <div className="space-y-2">
              {yunits.map((yunit: any) => (
                <button
                  key={yunit.id}
                  onClick={() => {
                    setSelectedYunit(yunit);
                    setSelectedAssessment(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl font-bold text-sm transition-all ${
                    selectedYunit?.id === yunit.id
                      ? 'bg-brand-purple text-white'
                      : 'bg-slate-800/30 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-black text-white">{yunit.title}</div>
                  <div className="text-xs mt-1 opacity-75">{yunit.discussion?.substring(0, 30) || 'No description'}...</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-2 space-y-6">
          {selectedYunit ? (
            <>
              {/* Lesson Content */}
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
                <h3 className="text-2xl font-black text-white mb-4">{selectedYunit.title}</h3>
                <p className="text-slate-300 font-bold text-sm mb-6 leading-relaxed">
                  {selectedYunit.discussion}
                </p>

                {/* Media Display */}
                {selectedYunit.media_url && (
                  <div className="mb-6">
                    {selectedYunit.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={selectedYunit.media_url}
                        alt={selectedYunit.title}
                        className="w-full rounded-xl max-h-96 object-cover"
                      />
                    ) : selectedYunit.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        src={selectedYunit.media_url}
                        controls
                        className="w-full rounded-xl"
                      />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {assessments.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-slate-400">ASSIGNMENTS PROGRESS</p>
                    <p className="text-sm font-black text-brand-sky">{calculateProgress()}%</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-brand-sky h-full transition-all"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Assessments List */}
              {assessments.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
                  <h3 className="text-lg font-black text-white mb-4">📋 Assignments</h3>
                  <div className="space-y-3">
                    {assessments.map((assessment: any) => {
                      const isCompleted = progress[assessment.id];
                      return (
                        <button
                          key={assessment.id}
                          onClick={() => setSelectedAssessment(assessment)}
                          className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between ${
                            selectedAssessment?.id === assessment.id
                              ? 'bg-brand-purple/20 border-brand-purple'
                              : isCompleted
                              ? 'bg-green-900/20 border-green-700/50'
                              : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
                          }`}
                        >
                          <div>
                            <div className="font-black text-white text-sm">{assessment.title}</div>
                            <div className="text-xs text-slate-400 mt-1">⭐ {assessment.points} points</div>
                          </div>
                          <div className="text-2xl">
                            {isCompleted
                              ? isCompleted.isCorrect
                                ? '✅'
                                : '❌'
                              : '○'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assessment Detail */}
              {selectedAssessment && (
                <div>
                  <h3 className="text-xl font-black text-white mb-4">Answer the Assignment</h3>
                  <AssessmentAnswerSubmission
                    assessment={selectedAssessment}
                    yunitId={selectedYunit.id}
                    studentId={studentId}
                    onComplete={(result) => handleAssessmentComplete(selectedAssessment.id, result)}
                    allowRetake={true}
                    maxAttempts={3}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg font-black text-slate-400">Select a lesson to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
