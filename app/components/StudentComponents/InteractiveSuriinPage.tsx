'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface InteractiveSuriinPageProps {
  currentIndex: number;
  totalLessons: number;
  onBack: () => void;
  onNext: () => void;
}

export const InteractiveSuriinPage: React.FC<InteractiveSuriinPageProps> = ({
  currentIndex,
  totalLessons,
  onBack,
  onNext
}) => {
  const [activeCharacter, setActiveCharacter] = useState<'boy' | 'girl'>('boy');
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boyText = `Ako si Mark Cruz. Ako ay lalaki. Ako ay limang taong gulang. Ipinanganak ako noong Marso 4, 2015. Gusto ko ang mangga. Hindi ko gusto ang ampalaya.`;
  
  const girlText = `Ako si Len Santos. Ako ay babae. Ako ay limang taong gulang. Ipinanganak ako noong Mayo 2, 2015. Gusto ko ang fried chicken. Hindi ko gusto ang kendi.`;

  const texts = {
    boy: boyText,
    girl: girlText
  };

  const audioFiles = {
    boy: '/audio/boy1.wav',
    girl: '/audio/Girl1.wav'
  };

  const images = {
    boy: '/Character/NLLCStudentM2.png',
    girl: '/Character/NLLCStudentF2.png'
  };

  // Start animation and audio - using ref pattern to avoid stale closures
  const startCharacterAnimationRef = useRef<((character: 'boy' | 'girl') => void) | null>(null);
  
  const startCharacterAnimation = useCallback((character: 'boy' | 'girl') => {
    setActiveCharacter(character);
    setDisplayedText('');
    setIsAnimating(true);

    // Stop any existing audio/animation
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null; // Clear previous listener
    }
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    // Play audio
    const audio = new Audio(audioFiles[character]);
    audioRef.current = audio;
    
    // Add event listener for when audio ends
    audio.onended = () => {
      // Auto-play next character after current finishes
      if (character === 'boy') {
        setTimeout(() => {
          if (startCharacterAnimationRef.current) {
            startCharacterAnimationRef.current('girl');
          }
        }, 1000); // 1 second delay before girl speaks
      }
    };
    
    audio.play().catch(err => console.error('Audio playback failed:', err));

    // Animate text
    const content = texts[character];
    let currentIndex = 0;
    const typingSpeed = 65;

    const timer = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedText(content.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsAnimating(false);
      }
    }, typingSpeed);

    animationTimerRef.current = timer;
  }, []);
  
  // Store the function in ref
  startCharacterAnimationRef.current = startCharacterAnimation;

  // Auto-start with boy on mount
  useEffect(() => {
    startCharacterAnimation('boy');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current = null;
      }
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [startCharacterAnimation]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Nature Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-sky-400 via-green-400 to-emerald-500"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(251, 191, 36, 0.2) 0%, transparent 30%)
          `
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full opacity-60 blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-300 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-300 rounded-full opacity-40 blur-2xl"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 text-white hover:text-white/80 transition-colors flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-lg"
      >
        ← Back
      </button>

      {/* Title and Progress */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
          Suriin
        </h1>
        <p className="text-white/90 font-bold text-lg drop-shadow">
          Aralin {currentIndex + 1} ng {totalLessons}
        </p>
      </div>

      {/* Main Content */}
      <div className="relative h-full flex items-center justify-center p-8 pt-32 pb-32">
        <div className="w-full max-w-7xl space-y-12">
          {/* Boy Character - Bubble on Right */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-6 justify-start"
          >
            {/* Character */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
              <Image
                src={images.boy}
                alt="Mark"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Speech Bubble - Right side */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`relative bg-white rounded-3xl p-6 shadow-2xl max-w-xl flex-1 transition-all ${
                activeCharacter === 'boy' ? 'ring-4 ring-blue-500 scale-105' : 'opacity-70'
              }`}
            >
              {/* Speech Bubble Tail - Pointing Left */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white transform rotate-45"></div>
              
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-1 text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                  {activeCharacter === 'boy' ? displayedText : texts.boy}
                  {activeCharacter === 'boy' && isAnimating && (
                    <span className="inline-block w-1 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                  )}
                </div>
                
                {/* Speaker Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCharacterAnimation('boy');
                  }}
                  className="flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  title="Replay audio"
                >
                  🔊
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Girl Character - Bubble on Left */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-6 justify-end"
          >
            {/* Speech Bubble - Left side */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`relative bg-white rounded-3xl p-6 shadow-2xl max-w-xl flex-1 transition-all ${
                activeCharacter === 'girl' ? 'ring-4 ring-pink-500 scale-105' : 'opacity-70'
              }`}
            >
              {/* Speech Bubble Tail - Pointing Right */}
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white transform rotate-45"></div>
              
              <div className="relative z-10 flex items-start gap-3">
                {/* Speaker Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCharacterAnimation('girl');
                  }}
                  className="flex-shrink-0 w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  title="Replay audio"
                >
                  🔊
                </button>
                
                <div className="flex-1 text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                  {activeCharacter === 'girl' ? displayedText : texts.girl}
                  {activeCharacter === 'girl' && isAnimating && (
                    <span className="inline-block w-1 h-5 bg-pink-500 ml-1 animate-pulse"></span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Character */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
              <Image
                src={images.girl}
                alt="Len"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
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
