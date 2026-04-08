'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type AssessmentType = 'multiple-choice' | 'audio' | 'drag-drop' | 'matching';

interface Lesson {
  id?: string;
  title: string;
  subtitle: string;
  discussion: string;
  order: number;
}

interface Assessment {
  id?: string;
  type: AssessmentType;
  title: string;
  content: any;
  order: number;
}

interface Reward {
  id?: string;
  type: 'xp' | 'coins';
  amount: number;
}

interface TeacherLessonEditorProps {
  bahagiId: string;
  bahagiTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { lessons: Lesson[], assessments: Assessment[], rewards: Reward[] }) => Promise<void>;
  isLoading?: boolean;
}

export const TeacherLessonEditor: React.FC<TeacherLessonEditorProps> = ({
  bahagiId,
  bahagiTitle,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rewards, setRewards] = useState<Reward>({ type: 'xp', amount: 0 });
  const [activeTab, setActiveTab] = useState<'lessons' | 'assessments' | 'rewards'>('lessons');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('multiple-choice');

  const addLesson = () => {
    const newLesson: Lesson = {
      title: '',
      subtitle: '',
      discussion: '',
      order: lessons.length
    };
    setEditingLesson(newLesson);
    setShowAddLesson(true);
  };

  const saveLessoni = () => {
    if (!editingLesson?.title) return;
    if (editingLesson.id) {
      setLessons(lessons.map(l => l.id === editingLesson.id ? editingLesson : l));
    } else {
      setLessons([...lessons, { ...editingLesson, order: lessons.length }]);
    }
    setEditingLesson(null);
    setShowAddLesson(false);
  };

  const deleteLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const addAssessment = () => {
    const newAssessment: Assessment = {
      type: assessmentType,
      title: '',
      content: {},
      order: assessments.length
    };
    setAssessments([...assessments, newAssessment]);
    setShowAddAssessment(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        lessons,
        assessments,
        rewards: [rewards]
      });
    } catch (err) {
      console.error('Error saving content:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
        >
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex items-start justify-center min-h-screen py-8 px-4">
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-linear-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl w-full max-w-5xl shadow-2xl"
              >
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-linear-to-b from-slate-900 to-slate-800/50 p-8 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white">📚 {bahagiTitle}</h2>
                    <p className="text-slate-400 text-sm mt-1">Add lessons, assessments, and rewards</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-2xl text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10 px-8 flex gap-6">
                  {[
                    { id: 'lessons' as const, label: '📖 Lessons', icon: '📖' },
                    { id: 'assessments' as const, label: '✏️ Assessments', icon: '✏️' },
                    { id: 'rewards' as const, label: '🎁 Rewards', icon: '🎁' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${
                        activeTab === tab.id
                          ? 'border-brand-purple text-white'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[calc(90vh-300px)] overflow-y-auto">
                  {/* Lessons Tab */}
                  {activeTab === 'lessons' && (
                    <div className="space-y-6">
                      {lessons.length > 0 && (
                        <div className="space-y-3">
                          {lessons.map((lesson, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-start"
                            >
                              <div>
                                <h4 className="font-bold text-white">{lesson.title || `Lesson ${idx + 1}`}</h4>
                                <p className="text-sm text-slate-400 mt-1">{lesson.subtitle}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteLesson(idx)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                ✕
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {showAddLesson && editingLesson && (
                        <div className="bg-slate-950 border border-brand-purple/30 rounded-xl p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-white mb-2">Lesson Title *</label>
                            <input
                              type="text"
                              value={editingLesson.title}
                              onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })}
                              placeholder="e.g., Introduction to Animals"
                              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-purple outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white mb-2">Subtitle</label>
                            <input
                              type="text"
                              value={editingLesson.subtitle}
                              onChange={e => setEditingLesson({ ...editingLesson, subtitle: e.target.value })}
                              placeholder="Short summary"
                              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-purple outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white mb-2">Discussion *</label>
                            <textarea
                              value={editingLesson.discussion}
                              onChange={e => setEditingLesson({ ...editingLesson, discussion: e.target.value })}
                              placeholder="Detailed lesson content from Librong gabay"
                              rows={5}
                              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-purple outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveLessoni}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                            >
                              ✅ Save Lesson
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddLesson(false);
                                setEditingLesson(null);
                              }}
                              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!showAddLesson && (
                        <button
                          type="button"
                          onClick={addLesson}
                          className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                        >
                          ➕ Add Lesson
                        </button>
                      )}
                    </div>
                  )}

                  {/* Assessments Tab */}
                  {activeTab === 'assessments' && (
                    <div className="space-y-6">
                      {assessments.length > 0 && (
                        <div className="space-y-3">
                          {assessments.map((assessment, idx) => (
                            <motion.div
                              key={idx}
                              className="bg-white/5 border border-white/10 rounded-xl p-4"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-bold text-blue-300 mb-2">
                                    {assessment.type === 'multiple-choice' && '🔘 Multiple Choice'}
                                    {assessment.type === 'audio' && '🎤 Audio Input'}
                                    {assessment.type === 'drag-drop' && '🎯 Drag & Drop'}
                                    {assessment.type === 'matching' && '🔗 Matching'}
                                  </span>
                                  <h4 className="font-bold text-white">{assessment.title || `${assessment.type} Assessment`}</h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAssessments(assessments.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ✕
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {!showAddAssessment && (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-400 font-bold">Select assessment type:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { type: 'multiple-choice' as AssessmentType, label: '🔘 Multiple Choice', desc: 'Select one correct answer' },
                              { type: 'audio' as AssessmentType, label: '🎤 Audio Input', desc: 'Student records audio' },
                              { type: 'drag-drop' as AssessmentType, label: '🎯 Drag & Drop', desc: 'Drag items to correct position' },
                              { type: 'matching' as AssessmentType, label: '🔗 Matching', desc: 'Match pairs' }
                            ].map(opt => (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() => {
                                  setAssessmentType(opt.type);
                                  setShowAddAssessment(true);
                                }}
                                className="p-4 bg-white/5 border border-white/10 hover:border-brand-purple/50 rounded-xl text-left transition-all hover:bg-white/10"
                              >
                                <div className="font-bold text-white">{opt.label}</div>
                                <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rewards Tab */}
                  {activeTab === 'rewards' && (
                    <div className="space-y-6">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="font-bold text-white text-lg">Reward Points</h3>
                        
                        <div>
                          <label className="block text-sm font-bold text-white mb-2">⭐ XP Points</label>
                          <input
                            type="number"
                            value={rewards.type === 'xp' ? rewards.amount : 0}
                            onChange={e => {
                              if (rewards.type === 'xp') {
                                setRewards({ ...rewards, amount: parseInt(e.target.value) || 0 });
                              }
                            }}
                            placeholder="e.g., 100"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-purple outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-2">💰 Coins</label>
                          <input
                            type="number"
                            placeholder="e.g., 50"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-purple outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-6 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-linear-to-r from-brand-purple to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? '💾 Saving...' : '✅ Save & Close'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
