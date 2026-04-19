'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { InteractiveSuriinPage } from './InteractiveSuriinPage';
import { InteractivePagyamaninPage } from './InteractivePagyamaninPage';
import { LoadingAssessment } from './LoadingAssessment';
import { CompletionCelebration } from './CompletionCelebration';

interface LessonContentViewProps {
  yunitId: string | number;
  bahagiId: string | number;
  studentId: string;
  onComplete: () => void;
  onNextYunit: (yunitId: string | number) => void;
  onBack: () => void;
}

interface LessonData {
  id: number;
  title: string;
  subtitle?: string;
  discussion?: string;
  media_url?: string;
  audio_url?: string;
  bahagi_icon_path?: string;
  bahagi_icon_type?: string;
  completed?: boolean;
  isLocked?: boolean;
}

export const LessonContentView: React.FC<LessonContentViewProps> = ({
  yunitId,
  bahagiId,
  studentId,
  onComplete,
  onNextYunit,
  onBack
}) => {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [allYunits, setAllYunits] = useState<LessonData[]>([]);
  const [bahagiIconPath, setBahagiIconPath] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [showInteractivePage, setShowInteractivePage] = useState(false);
  const [showPagyamaninPage, setShowPagyamaninPage] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all yunits for the bahagi (once)
  useEffect(() => {
    const fetchYunits = async () => {
      try {
        setIsLoading(true);
        console.log('[LessonContentView] Fetching yunits for bahagi:', bahagiId);
        
        const response = await fetch(`/api/student/yunits-progress?bahagiId=${bahagiId}&studentId=${studentId}`);
        const data = await response.json();
        
        console.log('[LessonContentView] Yunits data:', data);
        
        if (data.success && data.data) {
          setAllYunits(data.data);
          
          // Find current yunit index
          const index = data.data.findIndex((y: LessonData) => y.id === Number(yunitId));
          setCurrentIndex(index >= 0 ? index : 0);
          
          // Fetch bahagi icon once
          const firstYunit = data.data[0];
          if (firstYunit?.id) {
            const lessonResponse = await fetch(`/api/rest/yunits/${firstYunit.id}`);
            const lessonData = await lessonResponse.json();
            if (lessonData.success && lessonData.data?.bahagi_icon_path) {
              setBahagiIconPath(lessonData.data.bahagi_icon_path);
            }
          }
        }
      } catch (err) {
        console.error('[LessonContentView] Error fetching yunits:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYunits();
  }, [bahagiId, studentId]);

  // Update current lesson when yunitId changes
  useEffect(() => {
    // Find lesson from already-fetched data
    const currentYunit = allYunits.find((y: LessonData) => y.id === Number(yunitId));
    
    if (currentYunit) {
      // Use cached data - no need to fetch again!
      setLesson({
        ...currentYunit,
        bahagi_icon_path: bahagiIconPath
      });
      
      // Update index
      const index = allYunits.findIndex((y: LessonData) => y.id === Number(yunitId));
      setCurrentIndex(index >= 0 ? index : 0);
      
      // Reset interactive page state when changing yunits
      setShowInteractivePage(false);
      
      // Track that student started this lesson (create progress record if doesn't exist)
      trackLessonStart(yunitId);
    }
  }, [yunitId, allYunits, bahagiIconPath]);

  // Track lesson start to create progress record
  const trackLessonStart = async (lessonId: string | number) => {
    try {
      await fetch('/api/student/lesson/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lessonId
        })
      });
    } catch (err) {
      console.log('Progress tracking failed (non-critical):', err);
    }
  };

  // Mark current lesson as complete in database
  const markLessonComplete = async (lessonId: string | number) => {
    try {
      console.log('[Lesson Complete] Attempting to save:', { lessonId, studentId, timestamp: new Date().toISOString() });
      
      const response = await fetch(`/api/student/lesson/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Lesson Complete] ✅ SUCCESS! Saved completion:', {
        lessonId,
        completed: data.progress?.completed,
        xp: data.rewards?.xp,
        coins: data.rewards?.coins,
        fullData: data
      });
      
      return data;
    } catch (error) {
      console.error('[Lesson Complete] ❌ FAILED:', error);
      return null;
    }
  };

  // Function to start/restart animation and audio
  const startAnimation = () => {
    if (!lesson) return;

    // Reset states
    setDisplayedText('');
    setIsAnimating(true);
    setShowCompleteButton(false);

    // Clear any existing timer
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    // Stop and reset audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Get the content to display (prefer discussion over subtitle)
    const content = lesson.discussion || lesson.subtitle || 'Welcome to this lesson!';
    
    // Start audio if available
    if (lesson.audio_url) {
      const audio = new Audio(lesson.audio_url);
      audioRef.current = audio;
      audio.play().catch(err => console.error('Audio play error:', err));
      
      // Show complete button when audio ends
      audio.addEventListener('ended', () => {
        setShowCompleteButton(true);
      });
    }

    // Animate text
    let currentIndex = 0;
    const typingSpeed = 65; // milliseconds per character

    const timer = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedText(content.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsAnimating(false);
        // Show complete button if no audio or audio already ended
        if (!lesson.audio_url) {
          setShowCompleteButton(true);
        }
      }
    }, typingSpeed);

    animationTimerRef.current = timer;
  };

  // Start text animation and audio when lesson loads
  useEffect(() => {
    if (!lesson) return;

    startAnimation();

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [lesson]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📖</div>
          <p className="text-slate-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-slate-400">Lesson not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const content = lesson.discussion || lesson.subtitle || 'Welcome to this lesson!';

  // Check if this is the Suriin lesson
  const isSuriinLesson = lesson.title?.toLowerCase().includes('suriin') || lesson.subtitle?.toLowerCase().includes('suriin');

  // Check if this is the Pagyamanin lesson with the specific self-introduction text
  const isPagyamaninLesson = lesson.discussion?.includes('Upang mas lalong makilala ang iyong sarili') || 
                             lesson.discussion?.includes('ipakilala ang iyong sarili');

  // Handle completion with loading and celebration (for final lesson)
  const handleComplete = async () => {
    setShowLoading(true);
    
    try {
      // Mark final lesson as complete
      await markLessonComplete(yunitId);
      
      // Show loading for 1.5 seconds, then show celebration
      setTimeout(() => {
        setShowLoading(false);
        setShowCelebration(true);
      }, 1500);
    } catch (error) {
      console.error('[Lesson Complete] Failed to save:', error);
      // Still show celebration even if API fails
      setTimeout(() => {
        setShowLoading(false);
        setShowCelebration(true);
      }, 1500);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    onComplete();
  };

  // Show loading screen
  if (showLoading) {
    return <LoadingAssessment />;
  }

  // Show celebration screen
  if (showCelebration) {
    return (
      <CompletionCelebration
        onContinue={handleCelebrationComplete}
        message="Natapos mo na ang aralin! Magaling!"
      />
    );
  }

  // If Pagyamanin lesson and showing interactive page
  if (isPagyamaninLesson && showPagyamaninPage) {
    return (
      <InteractivePagyamaninPage
        imageUrl={lesson.media_url}
        onBack={() => setShowPagyamaninPage(false)}
        onNext={async () => {
          // Mark current lesson as complete
          await markLessonComplete(yunitId);
          
          const nextYunit = allYunits[currentIndex + 1];
          if (nextYunit) {
            setShowPagyamaninPage(false);
            onNextYunit(nextYunit.id);
          } else {
            setShowPagyamaninPage(false);
            handleComplete();
          }
        }}
      />
    );
  }

  // If Suriin lesson and showing interactive page
  if (isSuriinLesson && showInteractivePage) {
    return (
      <InteractiveSuriinPage
        currentIndex={currentIndex}
        totalLessons={allYunits.length}
        onBack={() => setShowInteractivePage(false)}
        onNext={async () => {
          // Mark current lesson as complete
          await markLessonComplete(yunitId);
          
          const nextYunit = allYunits[currentIndex + 1];
          if (nextYunit) {
            setShowInteractivePage(false);
            onNextYunit(nextYunit.id);
          } else {
            setShowInteractivePage(false);
            handleComplete();
          }
        }}
      />
    );
  }

  return (
    <div className="relative h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 text-slate-400 hover:text-white transition-colors flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 py-2 rounded-lg text-sm"
      >
        ← Back
      </button>

      {/* Main Content Container */}
      <div className="flex items-center justify-center h-full py-16">
        <div className="relative w-full max-w-7xl">
          {/* Blackboard */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-green-900 to-green-950 rounded-3xl shadow-2xl border-8 border-amber-900 p-8"
            style={{
              backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Lesson Title at Top */}
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-black text-white mb-4 text-center drop-shadow-lg"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            >
              {lesson.title}
            </motion.h1>

            {/* Progress Indicator */}
            {allYunits.length > 0 && (
              <div className="text-center mb-4">
                <span className="text-white/60 text-sm font-semibold">
                  Aralin {currentIndex + 1} ng {allYunits.length}
                </span>
              </div>
            )}

            {/* Content Area with Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Text Content - Takes 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-green-950/50 rounded-2xl p-6 max-h-[500px] overflow-y-auto relative backdrop-blur-sm border-2 border-white/10">
                  {/* Chalk Text Animation */}
                  <motion.div
                    className="text-white text-xl md:text-2xl lg:text-3xl leading-relaxed whitespace-pre-wrap font-medium"
                    style={{
                      fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive",
                      textShadow: '2px 2px 3px rgba(0,0,0,0.4)'
                    }}
                  >
                    {displayedText}
                    {isAnimating && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-3 h-8 bg-white ml-1"
                      />
                    )}
                  </motion.div>

                  {/* Audio Controls */}
                  {lesson.audio_url && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={startAnimation}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-green-900/30 hover:bg-green-900/50 px-4 py-2 rounded-lg group"
                        title="Click to replay lesson"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🔊</span>
                        <span className="text-sm">Click to replay</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Media Display - Hide for Pagyamanin lesson as it shows on the next interactive page */}
                {lesson.media_url && !isPagyamaninLesson && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-4"
                  >
                    <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                      <img
                        src={lesson.media_url}
                        alt="Lesson media"
                        className="w-full rounded-lg shadow-lg"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Teacher Chibi - Takes 1 column */}
              <div className="lg:col-span-1 flex justify-center items-start">
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                  className="relative"
                >
                  {/* Teacher Image - Use Bahagi Icon */}
                  <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                    <Image
                      src={lesson.bahagi_icon_path || '/Character/NLLCTeacher.png'}
                      alt="Teacher"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>

                  {/* Floating Animation */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 -z-10"
                  />
                </motion.div>
              </div>
            </div>

            {/* Navigation Buttons */}
            {showCompleteButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center gap-4"
              >
                {/* Previous Button - Show if not first yunit */}
                {currentIndex > 0 && (
                  <button
                    onClick={() => {
                      const prevYunit = allYunits[currentIndex - 1];
                      if (prevYunit) {
                        onNextYunit(prevYunit.id);
                      }
                    }}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-base uppercase tracking-widest transition-all shadow-lg hover:scale-105"
                  >
                    ← Bumalik
                  </button>
                )}

                {/* Next Button - Show if not last yunit */}
                {currentIndex < allYunits.length - 1 && (
                  <button
                    onClick={async () => {
                      // If Suriin lesson, show interactive page first
                      if (isSuriinLesson) {
                        setShowInteractivePage(true);
                      // If Pagyamanin lesson, show interactive page first
                      } else if (isPagyamaninLesson) {
                        setShowPagyamaninPage(true);
                      } else {
                        // Mark current lesson as complete before moving to next
                        await markLessonComplete(yunitId);
                        
                        const nextYunit = allYunits[currentIndex + 1];
                        if (nextYunit) {
                          onNextYunit(nextYunit.id);
                        }
                      }
                    }}
                    className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-base uppercase tracking-widest transition-all shadow-lg hover:shadow-brand-purple/50 hover:scale-105"
                  >
                    Susunod →
                  </button>
                )}

                {/* Complete Button - Show only on last yunit */}
                {currentIndex === allYunits.length - 1 && (
                  <button
                    onClick={() => {
                      // If Suriin lesson, show interactive page first
                      if (isSuriinLesson) {
                        setShowInteractivePage(true);
                      // If Pagyamanin lesson, show interactive page first
                      } else if (isPagyamaninLesson) {
                        setShowPagyamaninPage(true);
                      } else {
                        handleComplete();
                      }
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-base uppercase tracking-widest transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105"
                  >
                    Tapusin
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-pulse">📚</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-pulse delay-1000">✏️</div>
    </div>
  );
};
