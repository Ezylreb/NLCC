'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Yunit {
  id: string | number;
  title: string;
  subtitle?: string;
  discussion?: string;
  media_url?: string;
  audio_url?: string;
  completed: boolean;
  xp_earned: number;
  coins_earned: number;
  assessment_count: number;
  isLocked: boolean;
  completion_date?: string;
}

interface YunitViewProps {
  studentId: string;
  bahagiId: string | number;
  onStartAssessment: (yunitId: string | number) => void;
  onBack: () => void;
}

export const YunitView: React.FC<YunitViewProps> = ({
  studentId,
  bahagiId,
  onStartAssessment,
  onBack
}) => {
  const [yunits, setYunits] = useState<Yunit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYunits = async () => {
      try {
        setIsLoading(true);
        console.log('[YunitView] Fetching yunits with progress for bahagiId:', bahagiId, 'studentId:', studentId);
        
        const response = await fetch(`/api/student/yunits-progress?bahagiId=${bahagiId}&studentId=${studentId}`);
        const data = await response.json();
        
        console.log('[YunitView] API response:', data);
        
        if (data.success && data.data) {
          setYunits(data.data);
          console.log('[YunitView] Loaded', data.data.length, 'yunits with lock status');
        } else {
          throw new Error(data.error || 'Failed to fetch yunits');
        }
      } catch (err: any) {
        console.error('[YunitView] Error fetching yunits:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYunits();
  }, [studentId, bahagiId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📖</div>
          <p className="text-slate-400">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Phases
        </button>
        <h2 className="text-3xl font-black text-white">Lessons</h2>
        <p className="text-slate-500 text-sm mt-2">Complete lessons in order to unlock the next one</p>
      </div>

      {/* Yunits Grid */}
      {yunits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400">No lessons available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {yunits.map((yunit, idx) => (
            <motion.div
              key={yunit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="relative"
            >
              <button
                onClick={() => !yunit.isLocked && onStartAssessment(yunit.id)}
                disabled={yunit.isLocked}
                className={`w-full h-full p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                  yunit.isLocked
                    ? 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60'
                    : yunit.completed
                    ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-slate-800 border-slate-700 hover:border-brand-purple hover:shadow-lg hover:shadow-brand-purple/20'
                }`}
              >
                {/* Lock Overlay */}
                {yunit.isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl z-10">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🔒</div>
                      <p className="text-sm text-slate-400 font-bold">Complete previous lesson</p>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">
                      {yunit.completed ? '✅' : yunit.isLocked ? '🔒' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-lg leading-tight mb-1 ${
                        yunit.isLocked ? 'text-slate-500' : 'text-white group-hover:text-brand-purple'
                      }`}>
                        {yunit.title}
                      </h3>
                      {yunit.subtitle && (
                        <p className="text-xs text-slate-400 line-clamp-2">{yunit.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="space-y-2">
                    {yunit.completed ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold">
                          ✓ Completed
                        </span>
                        {yunit.xp_earned > 0 && (
                          <span className="text-yellow-400 font-bold">
                            ⭐ +{yunit.xp_earned} XP
                          </span>
                        )}
                        {yunit.coins_earned > 0 && (
                          <span className="text-yellow-500 font-bold">
                            🪙 +{yunit.coins_earned}
                          </span>
                        )}
                      </div>
                    ) : !yunit.isLocked ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-brand-purple/20 text-brand-purple rounded-lg font-bold text-xs">
                          Ready to Start
                        </span>
                      </div>
                    ) : null}

                    {/* Media Indicators */}
                    {!yunit.isLocked && (yunit.media_url || yunit.audio_url) && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {yunit.media_url && <span>📸 Image</span>}
                        {yunit.audio_url && <span>🎵 Audio</span>}
                      </div>
                    )}
                  </div>

                  {/* Start Arrow */}
                  {!yunit.isLocked && !yunit.completed && (
                    <div className="flex justify-end">
                      <span className="text-brand-purple group-hover:translate-x-1 transition-transform text-xl">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};
