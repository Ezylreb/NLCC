'use client';

import React, { memo } from 'react';
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
  quarter?: string | null;
  week_number?: number | null;
  module_number?: string | null;
  onStart: () => void;
  onMatuto?: () => void;
}

const LessonCardComponent: React.FC<LessonCardProps> = ({
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
  quarter,
  week_number,
  module_number,
  onStart,
  onMatuto,
}) => {
  const progressPercentage = totalYunits > 0 ? Math.round((passedYunits / totalYunits) * 100) : 0;
  const displayPercentage = passedYunits > 0 && progressPercentage < 5 ? 5 : progressPercentage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -2 }}
      className={`group relative rounded-2xl overflow-hidden border transition-all ${
        isUnlocked
          ? 'border-slate-700/80 bg-slate-800/60 hover:border-purple-500/30'
          : 'border-slate-700/50 bg-slate-900/40 opacity-60'
      }`}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-slate-300 font-semibold text-sm">Complete previous lesson first</p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-3 left-3 z-10">
          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-bold">
            ✅ Completed
          </div>
        </div>
      )}

      <div className="p-6 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-black text-white mb-1">Bahagi {bahagiNumber}</h3>
          <p className="text-base text-slate-400 mb-1">{title}</p>
          {description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{description}</p>}

          {(quarter || week_number || module_number) && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {quarter && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-400">
                  {quarter} Q
                </span>
              )}
              {week_number && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-400">
                  Week {week_number}
                </span>
              )}
              {module_number && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-900/30 text-purple-400">
                  {module_number}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                key={`progress-${passedYunits}-${totalYunits}`}
                initial={{ width: 0 }}
                animate={{ width: `${displayPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-purple-500 rounded-full"
                style={{ minWidth: passedYunits > 0 ? '5%' : '0%' }}
              />
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${Math.max(displayPercentage - 2, 0)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-300 shadow-lg shadow-purple-500/50"
              />
            </div>
            <span className="text-sm text-slate-400 font-semibold shrink-0 w-10 text-right">
              {progressPercentage}%
            </span>
          </div>

          <div className="flex items-center justify-between mb-6 gap-3">
            <p className="text-xs text-slate-400">
              {passedYunits} / {totalYunits} na-tapos · {yunitCount} yunit
            </p>
            <span className="text-sm font-black text-amber-400 whitespace-nowrap">
              ⚡ +{xpReward * totalYunits} XP
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
              whileTap={{ scale: isUnlocked ? 0.97 : 1 }}
              disabled={!isUnlocked}
              onClick={onMatuto}
              className={`px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                isUnlocked
                  ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              📖 Matuto
            </motion.button>

            <motion.button
              whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
              whileTap={{ scale: isUnlocked ? 0.97 : 1 }}
              disabled={!isUnlocked}
              onClick={onStart}
              className={`px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                isUnlocked
                  ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Magpatuloy
            </motion.button>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="relative bg-slate-700/80 border border-slate-600/50 rounded-2xl px-4 py-2.5 max-w-50">
            <p className="text-sm text-white font-medium text-center">Hello, tara na matuto!</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-700/80 border-r border-b border-slate-600/50 rotate-45" />
          </div>

          <div className="w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl || '/Character/NLLCTeachHalf1.png'}
              alt="Guide"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const LessonCard = memo(LessonCardComponent);
