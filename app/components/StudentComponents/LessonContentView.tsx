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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const topicAudioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
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

  // Extract plain text from discussion (handles JSON topics or legacy text)
  const extractDisplayText = (discussion?: string, subtitle?: string): string => {
    if (!discussion) return subtitle || 'Welcome to this lesson!';
    try {
      const parsed = JSON.parse(discussion);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: any) => {
          let text = '';
          if (t.title) text += t.title + '\n\n';
          if (t.content) {
            const div = typeof document !== 'undefined' ? document.createElement('div') : null;
            if (div) {
              div.innerHTML = t.content;
              text += div.textContent || div.innerText || t.content;
            } else {
              text += t.content.replace(/<[^>]*>/g, '');
            }
          }
          if (t.quotes && t.quotes.length > 0) {
            text += '\n\n' + t.quotes.map((q: any) => {
              const qText = typeof q === 'string' ? q : q.text || '';
              return `"${qText}"`;
            }).join('\n');
          }
          return text;
        }).join('\n\n');
      }
    } catch { /* legacy plain text */ }
    return discussion;
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

    // Get the content to display (parse JSON topics if needed)
    const content = extractDisplayText(lesson.discussion, lesson.subtitle);
    
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

  // Parse discussion — could be JSON topics array or legacy plain text
  let parsedTopics: { title: string; content: string; images: string[]; audio: string; quotes: { text: string; audio: string }[] }[] = [];
  const content = extractDisplayText(lesson.discussion, lesson.subtitle);
  try {
    const parsed = JSON.parse(lesson.discussion || '');
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsedTopics = parsed.map((t: any) => ({
        ...t,
        quotes: (t.quotes || []).map((q: any) =>
          typeof q === 'string' ? { text: q, audio: '' } : { text: q.text || '', audio: q.audio || '' }
        ),
      }));
    }
  } catch {
    // Legacy plain text — use as-is
  }

  // Check if this is the Suriin lesson
  const isSuriinLesson = lesson.title?.toLowerCase().includes('suriin') || lesson.subtitle?.toLowerCase().includes('suriin');

  // Check if this is the Pagyamanin lesson with the specific self-introduction text
  const isPagyamaninLesson = content?.includes('Upang mas lalong makilala ang iyong sarili') || 
                             content?.includes('ipakilala ang iyong sarili');

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
    <div className="relative h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-lg font-semibold"
      >
        ← Bumalik
      </button>

      {/* Main Layout: Card + Teacher Avatar */}
      <div className="flex items-start justify-center gap-6 w-full">
        {/* Content Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-10 shadow-xl h-[calc(100vh-8rem)] flex flex-col overflow-y-auto"
        >
          {/* Header: Module Info + Slide Counter */}
          <div className="flex items-start justify-between mb-2">
            <p className="text-slate-400 text-sm">
              Yunit {currentIndex + 1}
            </p>
            {allYunits.length > 0 && (
              <span className="text-brand-purple font-semibold text-sm">
                {currentIndex + 1}/{allYunits.length} Slides
              </span>
            )}
          </div>

          {/* Lesson Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-brand-purple mb-6">
            {lesson.title}
          </h1>

          {/* Topic Content */}
          <div className="mb-6 space-y-6">
            {parsedTopics.length > 0 ? (
              /* Structured topic rendering */
              parsedTopics.map((topic, idx) => {
                const audioId = `topic-${idx}`;
                return (
                  <div key={idx} className="space-y-3">
                    {topic.title && (
                      <h3 className="text-lg font-bold text-white">{topic.title}</h3>
                    )}
                    {topic.content && (
                      <div
                        className="text-slate-200 text-base leading-relaxed prose prose-invert max-w-none [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_hr]:border-slate-600"
                        dangerouslySetInnerHTML={{ __html: topic.content }}
                      />
                    )}
                    {/* Topic audio toggle */}
                    {topic.audio && (
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            const el = topicAudioRefs.current[audioId];
                            if (!el) return;
                            if (playingAudioId === audioId) {
                              el.pause();
                              el.currentTime = 0;
                              setPlayingAudioId(null);
                            } else {
                              // Stop any other playing audio
                              Object.entries(topicAudioRefs.current).forEach(([k, a]) => {
                                if (a && k !== audioId) { a.pause(); a.currentTime = 0; }
                              });
                              el.play().catch(() => {});
                              setPlayingAudioId(audioId);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            playingAudioId === audioId
                              ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30'
                              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{playingAudioId === audioId ? '🔊' : '🔇'}</span>
                          {playingAudioId === audioId ? 'Naka-on ang Audio' : 'I-play ang Audio'}
                        </button>
                        <audio
                          ref={el => { topicAudioRefs.current[audioId] = el; }}
                          src={topic.audio}
                          onEnded={() => setPlayingAudioId(null)}
                          className="hidden"
                        />
                      </div>
                    )}
                    {/* Side by side: images + quotes */}
                    {((topic.images && topic.images.length > 0) || (topic.quotes && topic.quotes.length > 0)) && (
                      <div className="flex items-start gap-0">
                        {/* Image column */}
                        {topic.images && topic.images.length > 0 && (
                          <div className="shrink-0">
                            {topic.images.map((img, ii) => (
                              <div key={ii}>
                                <img src={img} alt={`${topic.title || 'Topic'} image ${ii + 1}`} className="w-56 h-auto object-contain" />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Callout bubble */}
                        {topic.quotes && topic.quotes.length > 0 && (
                          <div className="relative flex-1 ml-2">
                            {/* Triangle pointer */}
                            {topic.images && topic.images.length > 0 && (
                              <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-700/80" />
                            )}
                            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 space-y-3">
                              {topic.quotes.map((q, qi) => {
                                const qAudioId = `quote-${idx}-${qi}`;
                                return (
                                  <div key={qi} className="space-y-1.5">
                                    <p className="text-slate-200 text-sm leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                                    <button
                                      disabled={!q.audio}
                                      onClick={() => {
                                        if (!q.audio) return;
                                        const el = topicAudioRefs.current[qAudioId];
                                        if (!el) return;
                                        if (playingAudioId === qAudioId) {
                                          el.pause();
                                          el.currentTime = 0;
                                          setPlayingAudioId(null);
                                        } else {
                                          Object.entries(topicAudioRefs.current).forEach(([k, a]) => {
                                            if (a && k !== qAudioId) { a.pause(); a.currentTime = 0; }
                                          });
                                          el.play().catch(() => {});
                                          setPlayingAudioId(qAudioId);
                                        }
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        !q.audio
                                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                          : playingAudioId === qAudioId
                                            ? 'bg-brand-purple/80 text-white'
                                            : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                                      }`}
                                    >
                                      <span>{playingAudioId === qAudioId ? '🔊' : '🔇'}</span>
                                      {!q.audio ? 'Walang Audio' : playingAudioId === qAudioId ? 'Naka-on' : 'I-play'}
                                    </button>
                                    {q.audio && (
                                      <audio
                                        ref={el => { topicAudioRefs.current[qAudioId] = el; }}
                                        src={q.audio}
                                        onEnded={() => setPlayingAudioId(null)}
                                        className="hidden"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Legacy plain text with typing animation */
              <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap break-words">
                {displayedText}
                {isAnimating && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-0.5 h-5 bg-white ml-1 align-middle"
                  />
                )}
              </div>
            )}
          </div>

          {/* Media Content Section */}
          <div className="space-y-4 flex-1">
            {/* Image + Audio Row — only for legacy content */}
            {parsedTopics.length === 0 && (
              <div className="flex flex-col md:flex-row gap-4">
                {/* Bahagi Icon / Character Image */}
                {lesson.bahagi_icon_path && (
                  <div className="shrink-0">
                    <div className="relative w-40 h-48 bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
                      <Image
                        src={lesson.bahagi_icon_path}
                        alt="Character"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Audio Controls — legacy only */}
                {lesson.audio_url && (
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={startAnimation}
                      className="flex items-center gap-3 bg-slate-700/60 hover:bg-slate-700 transition-colors px-5 py-3 rounded-xl group"
                      title="Click to replay"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">🔊</span>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">{lesson.title}</p>
                        <p className="text-slate-400 text-xs">Click to replay</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content Labels — only for legacy (non-topic) content */}
            {parsedTopics.length === 0 && (lesson.media_url || lesson.audio_url) && (
              <div className="text-slate-400 text-sm space-y-0.5">
                <p className="font-semibold text-slate-300">Media Content:</p>
                {lesson.media_url && <p>Image Content</p>}
                {(lesson.discussion || lesson.subtitle) && <p>Text Content</p>}
                {lesson.audio_url && <p>Audio Content</p>}
              </div>
            )}

            {/* Lesson Media Image — only for legacy content or explicit cover */}
            {lesson.media_url && !isPagyamaninLesson && parsedTopics.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/30">
                  <img
                    src={lesson.media_url}
                    alt="Lesson media"
                    className="w-full max-h-80 object-contain rounded-lg"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Button - Inside Card Bottom */}
          <div className="flex items-center justify-center gap-4 pt-6 mt-auto">
              {currentIndex > 0 && (
                <button
                  onClick={() => {
                    const prevYunit = allYunits[currentIndex - 1];
                    if (prevYunit) {
                      onNextYunit(prevYunit.id);
                    }
                  }}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
                >
                  ← Bumalik
                </button>
              )}

              {currentIndex < allYunits.length - 1 && (
                <button
                  onClick={async () => {
                    if (isSuriinLesson) {
                      setShowInteractivePage(true);
                    } else if (isPagyamaninLesson) {
                      setShowPagyamaninPage(true);
                    } else {
                      await markLessonComplete(yunitId);
                      const nextYunit = allYunits[currentIndex + 1];
                      if (nextYunit) {
                        onNextYunit(nextYunit.id);
                      }
                    }
                  }}
                  className="px-8 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-brand-purple/40 hover:scale-105"
                >
                  Magpatuloy
                </button>
              )}

              {currentIndex === allYunits.length - 1 && (
                <button
                  onClick={() => {
                    if (isSuriinLesson) {
                      setShowInteractivePage(true);
                    } else if (isPagyamaninLesson) {
                      setShowPagyamaninPage(true);
                    } else {
                      handleComplete();
                    }
                  }}
                  className="px-8 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-brand-purple/40 hover:scale-105"
                >
                  Magpatuloy
                </button>
              )}
            </div>
        </motion.div>

        {/* Teacher Avatar - Side */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
          className="hidden lg:block shrink-0"
        >
          <div className="relative w-52 h-72">
            <Image
              src="/Character/NLLCTeachHalf1.png"
              alt="Teacher"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>
      </div>


    </div>
  );
};
