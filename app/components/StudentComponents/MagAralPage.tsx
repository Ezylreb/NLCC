'use client';

import React, { useState } from 'react';
import { ClassView } from './ClassView';
import { BahagiView } from './BahagiView';
import { YunitView } from './YunitView';
import { AssessmentScreen } from './AssessmentScreen';
import { RewardModal } from './RewardModal';

type ViewType = 'classes' | 'bahagis' | 'yunits' | 'assessment';

interface MagAralPageProps {
  studentId: string;
  studentName: string;
  onNavigate?: (view: string) => void;
}

export const MagAralPage: React.FC<MagAralPageProps> = ({
  studentId,
  studentName,
  onNavigate
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('classes');
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
    if (currentView === 'bahagis') {
      setCurrentView('classes');
      setSelectedClassId(null);
    } else if (currentView === 'yunits') {
      setCurrentView('bahagis');
      setSelectedBahagiId(null);
    } else if (currentView === 'assessment') {
      setCurrentView('yunits');
      setSelectedYunitId(null);
    }
  };

  return (
    <>
      {currentView === 'classes' && (
        <ClassView
          studentId={studentId}
          studentName={studentName}
          onSelectClass={handleSelectClass}
          onBack={() => onNavigate?.('dashboard')}
        />
      )}

      {currentView === 'bahagis' && selectedClassId && (
        <BahagiView
          studentId={studentId}
          classId={selectedClassId}
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
