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
  const getStoredValue = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  // Cache for lessons data to avoid re-fetching
  const [lessonsCache, setLessonsCache] = useState<any>(null);
  const [classesCache, setClassesCache] = useState<any>(null);
  const [yunitsCache, setYunitsCache] = useState<Record<string, any>>({});

  // Initialize view from localStorage or default
  const getInitialView = (): ViewType => {
    const savedView = getStoredValue('magAralView');
    if (savedView && ['lessons', 'classes', 'bahagis', 'yunits', 'lessonContent', 'assessment', 'adaptiveQuiz'].includes(savedView)) {
      return savedView as ViewType;
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

  // Fetch student's teacher info and pre-fetch lessons on component mount
  useEffect(() => {
    const fetchTeacherInfoAndLessons = async () => {
      try {
        const res = await apiClient.student.getDetails(studentId);
        
        if (res.success) {
          setTeacherInfo(res.data);
          
          // Pre-fetch lessons if teacher is assigned (but stay on classes view)
          if (res.data?.isAssigned && res.data?.teacherId) {
            // Fetch lessons in background for faster access later
            const lessonsRes = await apiClient.student.getTeacherLessons(studentId, res.data.teacherId);
            if (lessonsRes.success) {
              setLessonsCache(lessonsRes);
            }
          }
          
          const savedView = getInitialView();
          setCurrentView(savedView);
        } else {
          setCurrentView('classes'); // Fallback to classes view
        }
      } catch (err) {
        console.error('Failed to fetch teacher info:', err);
        setCurrentView('classes'); // Fallback to classes view
      } finally {
        setIsLoadingTeacher(false);
      }
    };

    if (studentId) {
      fetchTeacherInfoAndLessons();
    }
  }, [studentId]);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(getInitialClassId);
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState<string | null>(() => getStoredValue('magAralClassTeacherId'));
  const [selectedClassName, setSelectedClassName] = useState<string | null>(() => getStoredValue('magAralClassName'));
  const [selectedTeacherName, setSelectedTeacherName] = useState<string | null>(() => getStoredValue('magAralTeacherName'));
  const [selectedBahagiId, setSelectedBahagiId] = useState<string | number | null>(getInitialBahagiId);
  const [selectedYunitId, setSelectedYunitId] = useState<string | number | null>(getInitialYunitId);

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

  useEffect(() => {
    if (selectedClassTeacherId) {
      localStorage.setItem('magAralClassTeacherId', selectedClassTeacherId);
    } else {
      localStorage.removeItem('magAralClassTeacherId');
    }
  }, [selectedClassTeacherId]);

  useEffect(() => {
    if (selectedClassName) {
      localStorage.setItem('magAralClassName', selectedClassName);
    } else {
      localStorage.removeItem('magAralClassName');
    }
  }, [selectedClassName]);

  useEffect(() => {
    if (selectedTeacherName) {
      localStorage.setItem('magAralTeacherName', selectedTeacherName);
    } else {
      localStorage.removeItem('magAralTeacherName');
    }
  }, [selectedTeacherName]);

  useEffect(() => {
    if (!teacherInfo?.isAssigned) {
      return;
    }

    if (!selectedClassId && teacherInfo.classId) {
      setSelectedClassId(teacherInfo.classId);
    }

    if (!selectedClassTeacherId && teacherInfo.teacherId) {
      setSelectedClassTeacherId(teacherInfo.teacherId);
    }

    if (!selectedClassName && teacherInfo.className) {
      setSelectedClassName(teacherInfo.className);
    }

    if (!selectedTeacherName && teacherInfo.teacherName) {
      setSelectedTeacherName(teacherInfo.teacherName);
    }
  }, [teacherInfo, selectedClassId, selectedClassTeacherId, selectedClassName, selectedTeacherName]);

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

  const handleSelectLesson = async (bahagiId: string) => {
    const key = String(bahagiId);
    setSelectedBahagiId(bahagiId);
    setCurrentView('yunits');
    
    // Only fetch if not already cached
    if (!yunitsCache[key]) {
      try {
        const response = await fetch(`/api/student/yunits-progress?bahagiId=${bahagiId}&studentId=${studentId}`);
        const data = await response.json();
        
        if (data.success) {
          setYunitsCache(prev => ({
            ...prev,
            [key]: data
          }));
        }
      } catch (err) {
        console.error('Failed to fetch yunits:', err);
      }
    }
  };

  const handleSelectBahagi = (bahagiId: string | number) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('yunits');
  };

  const handleStartAssessment = (yunitId: string | number) => {
    setSelectedYunitId(yunitId);
    setCurrentView('lessonContent');
  };

  const handleStartQuiz = (bahagiId: string) => {
    setSelectedBahagiId(bahagiId);
    setCurrentView('adaptiveQuiz');
  };

  const handleLessonComplete = () => {
    // Move from lesson content to assessment (called after last yunit)
    setCurrentView('assessment');
  };

  const handleNextYunit = (yunitId: string | number) => {
    // Navigate to next yunit in the sequence
    setSelectedYunitId(yunitId);
  };

  const handleLessonCompleted = () => {
    // Don't invalidate cache - keep the data to prevent skeleton screens
    // Progress will be updated on next navigation or refresh
    // This provides a smoother UX without loading states
  };

  const handleAssessmentComplete = (result: any) => {
    setRewardData(result);
    setShowRewardModal(true);
  };

  const handleCloseReward = () => {
    setShowRewardModal(false);
    
    // Refresh YunitView to show updated progress
    setYunitViewKey(prev => prev + 1);
    
    // Invalidate yunits cache for this specific bahagi to fetch fresh data
    if (selectedBahagiId) {
      setYunitsCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedBahagiId.toString()];
        return newCache;
      });
    }
    
    // Go back to yunits view after assessment
    setCurrentView('yunits');
  };

  const goBack = () => {
    if (currentView === 'lessons') {
      setCurrentView('classes');
      setSelectedClassId(null);
      setSelectedClassTeacherId(null);
      setSelectedClassName(null);
      setSelectedTeacherName(null);
    } else if (currentView === 'yunits') {
      // Don't refresh lessons - use cache for instant navigation
      setCurrentView('lessons');
      setSelectedBahagiId(null);
    } else if (currentView === 'lessonContent') {
      // Go back to yunits view without clearing cache
      // This prevents skeleton screens when navigating back
      setCurrentView('yunits');
    } else if (currentView === 'assessment') {
      setCurrentView('lessonContent');
    } else if (currentView === 'adaptiveQuiz') {
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
          cachedData={lessonsCache}
          onYunitsCached={(bahagiId, data) => {
            const key = String(bahagiId);
            setYunitsCache(prev => ({
              ...prev,
              [key]: data
            }));
          }}
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
          cachedData={classesCache}
          onDataFetched={(data) => setClassesCache(data)}
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
          cachedData={yunitsCache[String(selectedBahagiId)]}
          onDataFetched={(data) => {
            setYunitsCache(prev => ({
              ...prev,
              [selectedBahagiId.toString()]: data
            }));
          }}
          onStartAssessment={handleStartAssessment}
          onBack={goBack}
        />
      )}

      {currentView === 'lessonContent' && selectedYunitId && selectedBahagiId && (
        <LessonContentView
          yunitId={selectedYunitId}
          bahagiId={selectedBahagiId}
          studentId={studentId}
          cachedYunits={yunitsCache[String(selectedBahagiId)]?.data}
          onComplete={handleLessonComplete}
          onNextYunit={handleNextYunit}
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
