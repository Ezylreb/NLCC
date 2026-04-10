'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LessonCardProps {
  bahagiNumber: number;
  yunitCount: number;
  title: string;
  description?: string;
  imageUrl?: string;
  passedYunits: number;
  totalYunits: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  xpReward: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onStart: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  bahagiNumber,
  yunitCount,
  title,
  description,
  imageUrl,
  passedYunits,
  totalYunits,
  isCompleted,
  isUnlocked,
  xpReward,
  difficulty,
  onStart
}) => {
  const difficultyColors = {
    beginner: 'from-emerald-500 to-teal-500',
    intermediate: 'from-amber-500 to-orange-500',
    advanced: 'from-rose-500 to-red-500'
  };

  const progressPercentage = totalYunits > 0 ? (passedYunits / totalYunits) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -4 }}
      className={`group relative rounded-2xl overflow-hidden border transition-all ${
        isUnlocked
          ? 'border-slate-600 hover:border-brand-purple/50 bg-slate-800/50 hover:bg-slate-800/80'
          : 'border-slate-700 bg-slate-900/30 opacity-60'
      } backdrop-blur-sm`}
    >
      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-slate-300 font-semibold text-sm">Complete previous lesson first</p>
          </div>
        </div>
      )}

      <div className="p-6 h-full flex flex-col">
        {/* Top Section: Bahagi & Yunit Info + Libro Gabay Button */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              Bahagi {bahagiNumber}, Yunit 1
            </h3>
            <p className="text-sm text-slate-500">
              {passedYunits} of {totalYunits} units completed
            </p>
          </div>
          <button
            disabled={!isUnlocked}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              isUnlocked
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            📖 Libro
          </button>
        </div>

        {/* Image/Icon Section */}
        <div className="mb-4 h-32 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-slate-600/50">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-5xl text-slate-600">📚</div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-black text-white mb-2 line-clamp-2 group-hover:text-brand-purple transition-colors">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${difficultyColors[difficulty]}`}
            />
          </div>
        </div>

        {/* Difficulty Badge & XP */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${difficultyColors[difficulty]} text-white uppercase tracking-widest`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
          <span className="text-sm font-black text-amber-400 flex items-center gap-1">
            ⚡ +{xpReward * totalYunits}XP
          </span>
        </div>

        {/* Buttons Section */}
        <div className="space-y-3 mt-auto">
          {/* Simulan Button */}
          <motion.button
            whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
            whileTap={{ scale: isUnlocked ? 0.98 : 1 }}
            disabled={!isUnlocked}
            onClick={onStart}
            className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
              isUnlocked
                ? 'bg-gradient-to-r from-brand-purple to-brand-sky text-white hover:shadow-xl hover:shadow-purple-500/30 active:scale-95'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isCompleted ? '✅ Completed' : '🚀 Simulan +10XP'}
          </motion.button>

          {/* Assignment & Rewards Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={!isUnlocked}
              className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isUnlocked
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              📋 Assignment
            </button>
            <button
              disabled={!isUnlocked}
              className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isUnlocked
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              🎁 Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Completion Badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-500/50 border-2 border-emerald-300"
          >
            ✨
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
