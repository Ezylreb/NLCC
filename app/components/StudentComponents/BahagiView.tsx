'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface Bahagi {
  id: string | number;
  title: string;
  description: string;
  image_url?: string;
  yunitCount: number;
  passedYunits: number;
  isUnlocked: boolean;
  allPassed: boolean;
}

interface BahagiViewProps {
  studentId: string;
  classId: string;
  onSelectBahagi: (bahagiId: string | number) => void;
  onBack: () => void;
}

export const BahagiView: React.FC<BahagiViewProps> = ({
  studentId,
  classId,
  onSelectBahagi,
  onBack
}) => {
  const [bahagis, setBahagis] = useState<Bahagi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBahagis = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.bahagi.fetchAll();
        
        if (response.data?.bahagis) {
          setBahagis(response.data.bahagis);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBahagis();
  }, [studentId, classId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🧩</div>
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
          ← Back to Classes
        </button>
        <h2 className="text-3xl font-black text-white">Mag-Aral</h2>
        <p className="text-slate-500 text-sm mt-2">Choose a phase (Bahagi) to start learning</p>
      </div>

      {/* Bahagis Grid */}
      {bahagis.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400">No lessons available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bahagis.map((bahagi, idx) => (
            <motion.div
              key={bahagi.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <button
                onClick={() => {
                  if (bahagi.isUnlocked) {
                    onSelectBahagi(bahagi.id);
                  }
                }}
                disabled={!bahagi.isUnlocked}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                  bahagi.isUnlocked
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-brand-purple hover:from-slate-700 hover:to-slate-800 cursor-pointer group'
                    : 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {bahagi.isUnlocked ? '🔓' : '🔒'}
                      </span>
                      <h3 className="font-black text-lg text-white group-hover:text-brand-purple transition-colors">
                        {bahagi.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">{bahagi.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span>{bahagi.passedYunits} / {bahagi.yunitCount}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(bahagi.passedYunits / bahagi.yunitCount) * 100}%`
                        }}
                        className="h-full bg-gradient-to-r from-brand-purple to-brand-sky"
                      />
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>📚 {bahagi.yunitCount} lessons</span>
                      {bahagi.allPassed && (
                        <span className="text-green-400 font-bold">✓ Completed</span>
                      )}
                    </div>
                    {bahagi.isUnlocked && (
                      <span className="text-lg text-brand-purple group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {!bahagi.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-300">🔒 Locked</p>
                    <p className="text-xs text-slate-500 mt-1">Complete previous phase</p>
                  </div>
                </div>
              )}
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
