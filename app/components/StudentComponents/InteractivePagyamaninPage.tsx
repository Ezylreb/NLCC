'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface InteractivePagyamaninPageProps {
  onBack: () => void;
  onNext: () => void;
  imageUrl?: string;
}

export const InteractivePagyamaninPage: React.FC<InteractivePagyamaninPageProps> = ({
  onBack,
  onNext,
  imageUrl
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Split into lines for better highlighting with fill-in-the-blank format
  const lines = [
    'Ako si _________________________.',
    'Ako ay isang ________________.',
    'Ako ay ____ taong gulang.',
    'Ako ay ipinanganak noong ______________.',
    'Ang paborito kong pagkain ay __________.',
    'Ayaw kong kumain ng ______________.'
  ];

  const audioFile = '/audio/sundanan.wav';

  const playAudio = useCallback(() => {
    // Clear any existing audio and timers
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
    }
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
    }

    const audio = new Audio(audioFile);
    audioRef.current = audio;
    setIsPlaying(true);
    setCurrentLineIndex(1); // Start with first line highlighted

    // Highlight lines progressively
    const lineDuration = 2000; // 2 seconds per line
    let lineCount = 1; // Start at 1 since first line is already highlighted
    
    const highlightTimer = setInterval(() => {
      lineCount++;
      setCurrentLineIndex(lineCount);
      
      if (lineCount >= lines.length) {
        clearInterval(highlightTimer);
      }
    }, lineDuration);

    highlightTimerRef.current = highlightTimer;

    audio.onended = () => {
      setIsPlaying(false);
      if (highlightTimerRef.current) {
        clearInterval(highlightTimerRef.current);
      }
      // Keep all lines highlighted after audio ends
      setCurrentLineIndex(lines.length);
    };

    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
      if (highlightTimerRef.current) {
        clearInterval(highlightTimerRef.current);
      }
    });
  }, [lines.length]);

  // Auto-play on mount
  useEffect(() => {
    playAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current = null;
      }
      if (highlightTimerRef.current) {
        clearInterval(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, [playAudio]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Nature Background - Same as Suriin page */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-sky-400 via-green-400 to-emerald-500"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)
          `
        }}
      />

      {/* Decorative Blurred Circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-300/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-green-300/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2"
        >
          Pagyamanin
        </motion.h1>
        <motion.p
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/90 font-bold text-lg drop-shadow"
        >
          Aralin 3 ng 4
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="relative h-full flex items-center justify-center p-8 pt-32 pb-32">
        <div className="w-full max-w-7xl flex items-center gap-8">
          {/* Left Side - Uploaded Image with Blinking Animation */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <motion.div 
              className="relative w-64 h-64 md:w-80 md:h-80 bg-white/90 rounded-3xl shadow-2xl overflow-hidden"
              animate={{ 
                opacity: [1, 0.7, 1],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Pagyamanin"
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-lg">No image available</span>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Side - Speech Bubble */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 max-w-2xl"
          >
            <div className="relative bg-white rounded-3xl p-6 shadow-2xl">
              {/* Speech Bubble Tail - Pointing Left */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white transform rotate-45"></div>

              <div className="relative z-10 flex flex-col gap-3">
                {/* Text with Line-by-Line Highlighting */}
                <div className="text-slate-800 text-lg md:text-xl font-medium leading-relaxed space-y-2">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 p-2 rounded-lg ${
                        index < currentLineIndex
                          ? 'bg-yellow-300 text-slate-900 font-semibold transform scale-105'
                          : 'text-slate-800'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {/* Speaker Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="self-end w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  title="Replay audio"
                >
                  🔊
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-8">
        <button
          onClick={onBack}
          className="px-8 py-4 bg-white/90 hover:bg-white text-slate-800 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-2"
        >
          ← Bumalik
        </button>
        <button
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-2"
        >
          Susunod →
        </button>
      </div>
    </div>
  );
};
