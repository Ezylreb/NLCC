'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RewardModalProps {
  isOpen: boolean;
  isPassed: boolean;
  isRetake?: boolean;
  scorePercentage: number;
  xpEarned: number;
  coinsEarned: number;
  message: string;
  continueLabel?: string;
  onClaimRewards?: () => void;
  onContinue: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  isPassed,
  isRetake = false,
  scorePercentage,
  xpEarned,
  coinsEarned,
  message,
  continueLabel = 'Magpatuloy',
  onClaimRewards,
  onContinue
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen || !isPassed) {
      return;
    }

    const audio = new Audio('/audio/success.wav');
    audioRef.current = audio;
    audio.play().catch(() => {
      // Ignore autoplay restrictions until the next user interaction.
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isOpen, isPassed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className={`relative p-8 rounded-2xl max-w-md w-full mx-4 text-center space-y-6 ${
          isPassed
            ? 'bg-linear-to-b from-green-900 to-slate-900 border-2 border-green-500'
            : 'bg-linear-to-b from-orange-900 to-slate-900 border-2 border-orange-500'
        }`}
      >
        {/* Celebration Animation */}
        {isPassed && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -200, opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.1 }}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '100%'
                }}
              >
                {['🎉', '✨', '⭐', '🎊'][i % 4]}
              </motion.div>
            ))}
          </div>
        )}

        {/* Result Icon */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
          className="text-7xl"
        >
          {isPassed ? '🎉' : '💪'}
        </motion.div>

        {/* Title */}
        <div>
          <h2 className={`text-3xl font-black ${isPassed ? 'text-green-300' : 'text-orange-300'}`}>
            {isPassed ? (isRetake ? 'Natapos Mong Muli' : 'Excellent Work!') : 'Good Effort!'}
          </h2>
          <p className="text-slate-300 mt-2">{message}</p>
        </div>

        {/* Score */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Score</p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5 }}
            className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2"
          >
            <div
              className={`h-full ${
                isPassed
                  ? 'bg-linear-to-r from-green-500 to-green-400'
                  : 'bg-linear-to-r from-orange-500 to-orange-400'
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </motion.div>
          <p className={`text-2xl font-black ${isPassed ? 'text-green-300' : 'text-orange-300'}`}>
            {scorePercentage}%
          </p>
        </div>

        {/* Rewards */}
        {isPassed && !isRetake && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">Rewards</p>
            <div className="flex gap-4 justify-center">
              <div className="flex-1 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <p className="text-4xl">⭐</p>
                <p className="text-xl font-black text-yellow-300 mt-2">+{xpEarned} XP</p>
              </div>
              <div className="flex-1 bg-amber-900/30 border border-amber-700 rounded-lg p-4">
                <p className="text-4xl">🪙</p>
                <p className="text-xl font-black text-amber-300 mt-2">+{coinsEarned}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isPassed ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              {isRetake
                ? 'Practice retake ito. Wala nang bagong XP o coins, pero naitala ang panibagong pagsubok mo.'
                : 'Kunin ang iyong gantimpala para makita ang progreso ng iyong mga misyon, o magpatuloy agad sa susunod na Yunit.'}
            </p>
            {!isRetake && (
              <button
                onClick={onClaimRewards}
                className="w-full py-3 rounded-lg font-bold text-slate-950 bg-yellow-400 hover:bg-yellow-300 transition-all"
              >
                Kunin
              </button>
            )}
            <button
              onClick={onContinue}
              className="w-full py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-all"
            >
              {continueLabel}
            </button>
          </div>
        ) : (
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all"
          >
            🔄 Try Again
          </button>
        )}
      </motion.div>
    </div>
  );
};
