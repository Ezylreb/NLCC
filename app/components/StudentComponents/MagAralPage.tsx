'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ClassView } from './ClassView';
import { BahagiView } from './BahagiView';
import { YunitView } from './YunitView';
import { AssessmentScreen } from './AssessmentScreen';
import { RewardModal } from './RewardModal';
import { TeacherLessonsView } from './TeacherLessonsView';

type ViewType = 'lessons' | 'classes' | 'bahagis' | 'yunits' | 'assessment';

interface MagAralPageProps {
  studentId: string;
  studentName: string;
  onNavigate?: (view: string) => void;
}

interface TeacherInfo {
  teacherId: string | null;
  teacherName: string | null;
  classId: string | null;
  className: string | null;
  isAssigned: boolean;
}

export const MagAralPage: React.FC<MagAralPageProps> = ({
  studentId,
  studentName,
  onNavigate
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('classes');
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(true);

  // Fetch student's teacher info on component mount
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const res = await apiClient.student.getDetails(studentId);
        if (res.success) {
          setTeacherInfo(res.data);
          // If student has a teacher assigned, show the teacher lessons view
          if (res.data?.isAssigned) {
            setCurrentView('lessons');
          }
        }
      } catch (err) {
        console.error('Failed to fetch teacher info:', err);
      } finally {
        setIsLoadingTeacher(false);
      }
    };

    if (studentId) {
      fetchTeacherInfo();
    }
  }, [studentId]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedBahagiId, setSelectedBahagiId] = useState<string | number | null>(null);
  const [selectedYunitId, setSelectedYunitId] = useState<string | number | null>(null);

  // Reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentView('bahagis');
  };

  const handleSelectLesson = (bahagiId: string) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('bahagis');
  };

  const handleSelectBahagi = (bahagiId: string | number) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('yunits');
  };

  const handleStartAssessment = (yunitId: string | number) => {
    setSelectedYunitId(yunitId);
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = (result: any) => {
    setRewardData(result);
    setShowRewardModal(true);
  };

  const handleCloseReward = () => {
    setShowRewardModal(false);
    if (rewardData?.success && rewardData?.progress?.is_passed) {
      // Go back to yunits view after successful completion
      setCurrentView('yunits');
    }
  };

  const goBack = () => {
    if (currentView === 'lessons') {
      setCurrentView('lessons');
    } else if (currentView === 'bahagis') {
      if (teacherInfo?.isAssigned) {
        setCurrentView('lessons');
        setSelectedClassId(null);
      } else {
        setCurrentView('classes');
        setSelectedClassId(null);
      }
    } else if (currentView === 'yunits') {
      setCurrentView('bahagis');
      setSelectedBahagiId(null);
    } else if (currentView === 'assessment') {
      setCurrentView('yunits');
      setSelectedYunitId(null);
    }
  };

  // Show loading state while fetching teacher info
  if (isLoadingTeacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Teacher Lessons View - shown when student has a teacher assigned */}
      {currentView === 'lessons' && teacherInfo?.isAssigned && teacherInfo?.teacherId && (
        <TeacherLessonsView
          studentId={studentId}
          studentName={studentName}
          teacherId={teacherInfo.teacherId}
          teacherName={teacherInfo.teacherName || 'Your Teacher'}
          className={teacherInfo.className || 'Your Class'}
          onSelectLesson={handleSelectLesson}
          onBack={() => onNavigate?.('dashboard')}
        />
      )}

      {/* Class View - fallback for students without teacher assignment */}
      {currentView === 'classes' && (
        <ClassView
          studentId={studentId}
          studentName={studentName}
          onSelectClass={handleSelectClass}
          onBack={() => onNavigate?.('dashboard')}
        />
      )}

      {currentView === 'bahagis' && (selectedClassId || selectedBahagiId) && (
        <BahagiView
          studentId={studentId}
          classId={(selectedBahagiId as string) || selectedClassId || ''}
          onSelectBahagi={handleSelectBahagi}
          onBack={goBack}
        />
      )}

      {currentView === 'yunits' && selectedBahagiId && (
        <YunitView
          studentId={studentId}
          bahagiId={selectedBahagiId}
          onStartAssessment={handleStartAssessment}
          onBack={goBack}
        />
      )}

      {currentView === 'assessment' && selectedYunitId && selectedBahagiId && (
        <AssessmentScreen
          studentId={studentId}
          yunitId={selectedYunitId}
          bahagiId={selectedBahagiId}
          onComplete={handleAssessmentComplete}
          onBack={goBack}
        />
      )}

      <RewardModal
        isOpen={showRewardModal}
        isPassed={rewardData?.isPassed || false}
        scorePercentage={rewardData?.scorePercentage || 0}
        xpEarned={rewardData?.xpEarned || 0}
        coinsEarned={rewardData?.coinsEarned || 0}
        message={rewardData?.message || ''}
        onClose={handleCloseReward}
      />
    </>
  );
};
