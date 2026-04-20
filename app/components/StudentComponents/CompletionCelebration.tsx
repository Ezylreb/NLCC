'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CompletionCelebrationProps {
  onContinue: () => void;
  message?: string;
  xpEarned?: number;
  coinsEarned?: number;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  onContinue,
  message = "Mahusay! Natapos mo na ang aralin!",
  xpEarned = 0,
  coinsEarned = 0,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Show celebration after a brief delay
    const timer = setTimeout(() => setShowCelebration(true), 300);

    const audio = new Audio('/audio/success.wav');
    audioRef.current = audio;
    audio.play().catch(err => console.log('Audio play failed:', err));

    // Auto-continue after 3 seconds
    const autoContinue = setTimeout(() => {
      onContinue();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoContinue);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onContinue]);

  // Generate confetti particles
  const confettiCount = 50;
  const confetti = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-purple-900/95 via-blue-900/95 to-pink-900/95 backdrop-blur-sm">
      {/* Confetti */}
      {confetti.map((item) => (
        <motion.div
          key={item.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${item.left}%`,
            top: '-10%',
            backgroundColor: item.color
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, 360, 720],
            x: [0, Math.random() * 100 - 50]
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            ease: 'easeIn'
          }}
        />
      ))}

      {/* Celebration Content */}
      {showCelebration && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center z-10 px-8"
        >
          {/* Star Animation */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="text-9xl mb-6"
          >
            ⭐
          </motion.div>

          {/* Success Message */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl"
          >
            Mahusay!
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl text-white/90 font-bold mb-8"
          >
            {message}
          </motion.p>

          {/* Reward Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="flex items-center justify-center gap-6 mb-8"
          >
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-yellow-400">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-yellow-400 font-black text-lg">+{xpEarned} XP</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-blue-400">
              <div className="text-4xl mb-2">🪙</div>
              <div className="text-blue-400 font-black text-lg">+{coinsEarned} Coins</div>
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onContinue}
            className="px-8 py-4 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-105"
          >
            Magpatuloy
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
