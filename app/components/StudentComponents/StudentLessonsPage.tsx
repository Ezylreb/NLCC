'use client';

import React, { useState, useEffect } from 'react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  status: string;
  yunits: any[];
  assessments: any[];
  created_at: string;
}

interface StudentLessonsPageProps {
  studentId: string;
  studentName: string;
  classId?: string;
  onSelectLesson?: (lesson: Lesson) => void;
}

export const StudentLessonsPage: React.FC<StudentLessonsPageProps> = ({
  studentId,
  studentName,
  classId,
  onSelectLesson
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonDetail, setShowLessonDetail] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [studentId, classId]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/student/get-lessons', window.location.origin);
      url.searchParams.append('studentId', studentId);
      if (classId) url.searchParams.append('classId', classId);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons || []);
      } else {
        console.error('Failed to fetch lessons');
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonDetail(true);
    if (onSelectLesson) {
      onSelectLesson(lesson);
    }
  };

  if (showLessonDetail && selectedLesson) {
    return (
      <LessonDetailView
        lesson={selectedLesson}
        studentId={studentId}
        onBack={() => {
          setShowLessonDetail(false);
          setSelectedLesson(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="text-slate-400">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">Mag-Aral</h2>
        <p className="text-slate-500 text-sm">Available lessons for your class</p>
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-slate-400 text-lg font-bold">No lessons available yet</p>
          <p className="text-slate-500 text-sm mt-2">Check back soon! Your teacher is preparing lessons.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleLessonSelect(lesson)}
              className="text-left group"
            >
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-brand-purple/50 hover:bg-slate-800 transition-all cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{lesson.icon || '📚'}</div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                    {lesson.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-2 group-hover:text-brand-purple transition-colors">
                  {lesson.title}
                </h3>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {lesson.description || lesson.category}
                </p>

                <div className="flex gap-3 text-xs">
                  {lesson.yunits.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>📖</span>
                      <span>{lesson.yunits.length} units</span>
                    </div>
                  )}
                  {lesson.assessments.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>✅</span>
                      <span>{lesson.assessments.length} tests</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Lesson Detail View Component
interface LessonDetailViewProps {
  lesson: Lesson;
  studentId: string;
  onBack: () => void;
}

const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, studentId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'assessment'>('content');
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-700/50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-2xl hover:text-brand-purple transition-colors"
          >
            ←
          </button>
          <div>
            <div className="text-4xl mb-2">{lesson.icon}</div>
            <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{lesson.category}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-4 px-6 font-bold text-sm transition-all ${
            activeTab === 'content'
              ? 'border-b-2 border-brand-purple text-brand-purple'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📖 Learning Materials ({lesson.yunits.length})
        </button>
        <button
          onClick={() => setActiveTab('assessment')}
          className={`flex-1 py-4 px-6 font-bold text-sm transition-all ${
            activeTab === 'assessment'
              ? 'border-b-2 border-brand-purple text-brand-purple'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ✅ Assessments ({lesson.assessments.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {lesson.yunits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No learning materials yet</p>
              </div>
            ) : (
              lesson.yunits.map((yunit) => (
                <div
                  key={yunit.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-brand-purple/30 transition-all"
                >
                  <h3 className="font-black text-white mb-2">{yunit.title}</h3>
                  <p className="text-sm text-slate-300 mb-3">{yunit.content}</p>
                  {yunit.media_url && (
                    <a
                      href={yunit.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-purple hover:text-brand-purple/80 font-bold"
                    >
                      📎 View Media →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="space-y-4">
            {lesson.assessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No assessments yet</p>
              </div>
            ) : (
              lesson.assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-brand-purple/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-white">{assessment.title}</h3>
                    <span className="text-xs bg-brand-purple/20 text-brand-purple px-2 py-1 rounded-full font-bold">
                      +{assessment.reward} ⭐
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 capitalize">{assessment.type}</p>
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setShowAssessment(true);
                    }}
                    className="text-xs bg-brand-purple hover:bg-brand-purple/80 text-white px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Start Assessment →
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
