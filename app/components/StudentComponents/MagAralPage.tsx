'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ClassView } from './ClassView';
import { BahagiView } from './BahagiView';
import { YunitView } from './YunitView';
import { LessonContentView } from './LessonContentView';
import { AssessmentScreen } from './AssessmentScreen';
import { AdaptiveQuizScreen } from './AdaptiveQuizScreen';
import { RewardModal } from './RewardModal';
import { TeacherLessonsView } from './TeacherLessonsView';

type ViewType = 'lessons' | 'classes' | 'bahagis' | 'yunits' | 'lessonContent' | 'assessment' | 'adaptiveQuiz';

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
  // Initialize view and selections from localStorage
  const getInitialView = (): ViewType => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('magAralView');
      if (savedView && ['lessons', 'classes', 'bahagis', 'yunits', 'lessonContent', 'assessment', 'adaptiveQuiz'].includes(savedView)) {
        return savedView as ViewType;
      }
    }
    return 'classes';
  };

  const getInitialClassId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('magAralClassId');
    }
    return null;
  };

  const getInitialBahagiId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('magAralBahagiId');
    }
    return null;
  };

  const getInitialYunitId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('magAralYunitId');
    }
    return null;
  };

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(true);
  const [yunitViewKey, setYunitViewKey] = useState(0); // For forcing YunitView refresh
  const [lessonsViewKey, setLessonsViewKey] = useState(0); // For forcing TeacherLessonsView refresh

  // Reset to classes view on first mount (ensure clean state)
  useEffect(() => {
    setCurrentView('classes');
    localStorage.removeItem('magAralBahagiId'); // Clear old bahagi selection
  }, []); // Run only once on mount

  // Fetch student's teacher info on component mount
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        console.log('🔍 [MagAralPage] Fetching teacher info for student:', studentId);
        const res = await apiClient.student.getDetails(studentId);
        console.log('🔍 [MagAralPage] Teacher info response:', res);
        
        if (res.success) {
          console.log('🔍 [MagAralPage] Teacher info data:', res.data);
          setTeacherInfo(res.data);
          // Always start with classes view - let user choose which class
        } else {
          console.error('🔍 [MagAralPage] Failed to get teacher info:', res.error);
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
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(getInitialClassId);
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedTeacherName, setSelectedTeacherName] = useState<string | null>(null);
  const [selectedBahagiId, setSelectedBahagiId] = useState<string | number | null>(getInitialBahagiId);
  const [selectedYunitId, setSelectedYunitId] = useState<string | number | null>(getInitialYunitId);
  const [pendingNextYunitId, setPendingNextYunitId] = useState<string | number | null>(null);

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('magAralView', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem('magAralClassId', selectedClassId);
    } else {
      localStorage.removeItem('magAralClassId');
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedBahagiId) {
      localStorage.setItem('magAralBahagiId', selectedBahagiId.toString());
    } else {
      localStorage.removeItem('magAralBahagiId');
    }
  }, [selectedBahagiId]);

  useEffect(() => {
    if (selectedYunitId) {
      localStorage.setItem('magAralYunitId', selectedYunitId.toString());
    } else {
      localStorage.removeItem('magAralYunitId');
    }
  }, [selectedYunitId]);

  // Reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);

  const handleSelectClass = (classId: string, teacherId: string, className: string, teacherName: string) => {
    setSelectedClassId(classId);
    setSelectedClassTeacherId(teacherId);
    setSelectedClassName(className);
    setSelectedTeacherName(teacherName);
    setCurrentView('lessons');
  };

  const handleSelectLesson = (bahagiId: string) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('yunits');
  };

  const handleSelectBahagi = (bahagiId: string | number) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('yunits');
  };

  const handleStartAssessment = (yunitId: string | number) => {
    setSelectedYunitId(yunitId);
    setCurrentView('lessonContent');
  };

  const handleLessonComplete = () => {
    // Move from lesson content to assessment (called after last yunit with no assessment)
    // Go back to yunits view with celebration already shown
    setYunitViewKey(prev => prev + 1);
    setCurrentView('yunits');
  };

  const handleShowAssessment = (yunitId: string | number, nextYunitId?: string | number) => {
    // Show assessment for the current yunit, remembering where to go next
    setSelectedYunitId(yunitId);
    setPendingNextYunitId(nextYunitId || null);
    setCurrentView('assessment');
  };

  const handleStartQuiz = (bahagiId: string) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('adaptiveQuiz');
  };

  const handleNextYunit = (yunitId: string | number) => {
    // Navigate to next yunit in the sequence
    setSelectedYunitId(yunitId);
  };

  const handleAssessmentComplete = (result: any) => {
    setRewardData(result);
    setShowRewardModal(true);
  };

  const handleCloseReward = () => {
    setShowRewardModal(false);
    if (rewardData?.success && rewardData?.progress?.is_passed) {
      // If there's a pending next yunit, navigate to it
      if (pendingNextYunitId) {
        setSelectedYunitId(pendingNextYunitId);
        setPendingNextYunitId(null);
        setCurrentView('lessonContent');
      } else {
        // Refresh YunitView when returning after assessment completion
        setYunitViewKey(prev => prev + 1);
        // Go back to yunits view after successful completion
        setCurrentView('yunits');
      }
    } else {
      // Failed assessment - go back to yunits view
      setPendingNextYunitId(null);
      setYunitViewKey(prev => prev + 1);
      setCurrentView('yunits');
    }
  };

  const goBack = () => {
    if (currentView === 'lessons') {
      setCurrentView('classes');
      setSelectedClassId(null);
      setSelectedClassTeacherId(null);
      setSelectedClassName(null);
      setSelectedTeacherName(null);
    } else if (currentView === 'yunits') {
      // Refresh TeacherLessonsView when going back from yunits
      setLessonsViewKey(prev => prev + 1);
      setCurrentView('lessons');
      setSelectedBahagiId(null);
    } else if (currentView === 'lessonContent') {
      // Refresh YunitView when going back from lesson content
      setYunitViewKey(prev => prev + 1);
      setCurrentView('yunits');
    } else if (currentView === 'assessment') {
      setCurrentView('lessonContent');
    } else if (currentView === 'adaptiveQuiz') {
      setLessonsViewKey(prev => prev + 1);
      setCurrentView('lessons');
      setSelectedBahagiId(null);
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
      {currentView === 'lessons' && selectedClassTeacherId && (
        <TeacherLessonsView
          key={lessonsViewKey}
          studentId={studentId}
          studentName={studentName}
          teacherId={selectedClassTeacherId}
          teacherName={selectedTeacherName || 'Your Teacher'}
          className={selectedClassName || 'Your Class'}
          onSelectLesson={handleSelectLesson}
          onStartQuiz={handleStartQuiz}
          onBack={() => setCurrentView('classes')}
        />
      )}

      {currentView === 'lessons' && !selectedClassTeacherId && (
        <div className="p-8 text-center">
          <p className="text-red-400">Walang napiling klase</p>
          <button onClick={() => setCurrentView('classes')} className="mt-4 px-4 py-2 bg-brand-purple rounded-lg text-white">Bumalik sa mga Klase</button>
        </div>
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

      {/* Removed BahagiView - it's a duplicate of TeacherLessonsView */}
      
      {currentView === 'yunits' && selectedBahagiId && (
        <YunitView
          key={yunitViewKey}
          studentId={studentId}
          bahagiId={selectedBahagiId}
          onStartAssessment={handleStartAssessment}
          onBack={goBack}
        />
      )}

      {currentView === 'lessonContent' && selectedYunitId && selectedBahagiId && (
        <LessonContentView
          yunitId={selectedYunitId}
          bahagiId={selectedBahagiId}
          studentId={studentId}
          onComplete={handleLessonComplete}
          onNextYunit={handleNextYunit}
          onShowAssessment={handleShowAssessment}
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

      {currentView === 'adaptiveQuiz' && selectedBahagiId && (
        <AdaptiveQuizScreen
          studentId={studentId}
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
