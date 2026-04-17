'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface Yunit {
  id: string | number;
  title: string;
  content?: string;
  isPassed: boolean;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  assessmentCount: number;
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
        const response = await apiClient.yunit.fetchByBahagi(Number(bahagiId));
        
        if (response.data?.yunits) {
          setYunits(response.data.yunits);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (err: any) {
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
        <p className="text-slate-500 text-sm mt-2">Select a lesson to start learning</p>
      </div>

      {/* Yunits List */}
      {yunits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400">No lessons available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {yunits.map((yunit, idx) => (
            <motion.button
              key={yunit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onStartAssessment(yunit.id)}
              className="w-full text-left p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-brand-purple hover:bg-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">
                      {yunit.isPassed ? '✅' : '📖'}
                    </span>
                    <h3 className="font-bold text-white group-hover:text-brand-purple transition-colors flex-1">
                      {yunit.title}
                    </h3>
                  </div>

                  {/* Status Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 ml-8">
                    <span>📝 {yunit.assessmentCount} assessment{yunit.assessmentCount !== 1 ? 's' : ''}</span>
                    
                    {yunit.isPassed && (
                      <>
                        <span>⭐ {yunit.score}%</span>
                        <span className="text-yellow-400">⭐ +{yunit.xpEarned} XP</span>
                        <span className="text-yellow-500">🪙 +{yunit.coinsEarned}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg text-brand-purple group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </motion.button>
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
