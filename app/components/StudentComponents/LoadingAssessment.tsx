'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const LoadingAssessment: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        {/* Animated Book Icon */}
        <motion.div
          animate={{
            rotateY: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-8xl mb-8"
        >
          📚
        </motion.div>

        {/* Loading Text */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl md:text-4xl font-black text-white mb-4"
        >
          Naghahanda ng Assessment...
        </motion.h2>

        {/* Loading Dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-4 h-4 bg-purple-500 rounded-full"
            />
          ))}
        </div>

        {/* Encouraging Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-slate-300 text-lg"
        >
          Maghanda ka na para sa mga tanong! 💪
        </motion.p>
      </div>
    </div>
  );
};
