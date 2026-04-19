'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LessonCard } from './LessonCard';
import { apiClient } from '@/lib/api-client';

interface TeacherLessonsViewProps {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  className: string;
  onSelectLesson: (bahagiId: string) => void;
  onBack: () => void;
}

interface Lesson {
  id: string;
  bahagiNumber: number;
  title: string;
  description: string;
  imageUrl: string;
  yunitCount: number;
  yunits: any[];
  passedYunits: number;
  totalYunits: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  xpReward: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const TeacherLessonsView: React.FC<TeacherLessonsViewProps> = ({
  studentId,
  studentName,
  teacherId,
  teacherName,
  className,
  onSelectLesson,
  onBack
}) => {
  console.log('🎓 [TeacherLessonsView] Rendered with props:', {
    studentId,
    teacherId,
    teacherName,
    className
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📚 Fetching teacher lessons for:', { studentId, teacherId });
        console.log('📚 Timestamp:', new Date().toISOString());
        const result = await apiClient.student.getTeacherLessons(studentId, teacherId);

        console.log('📚 Teacher lessons response:', result);

        if (!result.success && result.error) {
          throw new Error(result.error);
        }

        // Handle both response formats (wrapped in data or direct)
        const data = result.data || result;
        console.log('📚 Lesson titles received:', data.lessons?.map((l: any) => ({ id: l.id, title: l.title })));
        console.log('📚 Progress data:', data.lessons?.map((l: any) => ({ 
          title: l.title, 
          passedYunits: l.passedYunits, 
          totalYunits: l.totalYunits,
          progress: `${l.passedYunits}/${l.totalYunits}` 
        })));
        setLessons(data.lessons || []);
        setCompletedCount(data.completedLessons || 0);

        // Calculate total XP available
        const total = (data.lessons || []).reduce((sum: number, lesson: any) => {
          return sum + (lesson.xpReward * lesson.totalYunits);
        }, 0);
        setTotalXp(total);
        
        console.log('📚 Loaded lessons:', data.lessons?.length || 0);
      } catch (err: any) {
        console.error('Failed to fetch teacher lessons:', err);
        setError(err.message || 'Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId && teacherId) {
      fetchLessons();
    }
  }, [studentId, teacherId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-slate-950 to-slate-900">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            📚
          </motion.div>
          <p className="text-slate-400 text-lg">Loading your lessons...</p>
          <p className="text-slate-600 text-sm mt-2">Preparing content from {teacherName}</p>
          <p className="text-slate-700 text-xs mt-1">Teacher ID: {teacherId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-950 to-slate-900 p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-red-400 text-lg font-semibold mb-2">{error}</p>
          <p className="text-slate-500 text-sm mb-4">
            Make sure your teacher has created lessons for your grade level.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-950 to-slate-900 p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-300 text-lg font-semibold mb-2">No lessons available</p>
          <p className="text-slate-500 text-sm mb-4">
            Your teacher hasn't created any lessons for your grade level yet. Check back later!
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 to-slate-900 p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-12"
      >
        <button
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Mag-Aral 📚</h1>
          <p className="text-slate-400">Welcome back, <span className="text-brand-purple font-bold">{studentName}</span>!</p>
          <p className="text-slate-500 text-sm mt-2">
            Learning from <span className="font-semibold text-white">{teacherName}</span> in <span className="font-semibold text-white">{className}</span>
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Lessons', value: lessons.length, icon: '📖' },
            { label: 'Completed', value: completedCount, icon: '✅' },
            { label: 'In Progress', value: lessons.length - completedCount, icon: '⏳' },
            { label: 'Available XP', value: totalXp, icon: '⚡' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-sm text-slate-400 font-semibold mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Lessons Grid */}
      <div className="max-w-7xl mx-auto">
        {lessons.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-white mb-2">No lessons yet</h3>
            <p className="text-slate-400 max-w-sm">
              Your teacher hasn't posted any lessons yet. Check back soon for new content!
            </p>
            <button
              onClick={onBack}
              className="mt-8 px-6 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg font-semibold transition-all"
            >
              Go Back
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson, idx) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <LessonCard
                  bahagiNumber={lesson.bahagiNumber}
                  yunitCount={lesson.yunitCount}
                  title={lesson.title}
                  description={lesson.description}
                  imageUrl={lesson.imageUrl}
                  passedYunits={lesson.passedYunits}
                  totalYunits={lesson.totalYunits}
                  isCompleted={lesson.isCompleted}
                  isUnlocked={lesson.isUnlocked}
                  xpReward={lesson.xpReward}
                  difficulty={lesson.difficulty}
                  onStart={() => onSelectLesson(lesson.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
