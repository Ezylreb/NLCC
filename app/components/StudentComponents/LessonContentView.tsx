'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { InteractiveSuriinPage } from './InteractiveSuriinPage';
import { InteractivePagyamaninPage } from './InteractivePagyamaninPage';
import { CompletionCelebration } from './CompletionCelebration';
import { LESSON_COMPLETION_XP } from '@/lib/constants/xp-rewards';

interface LessonContentViewProps {
  yunitId: string | number;
  bahagiId: string | number;
  studentId: string;
  cachedYunits?: LessonData[];
  onComplete: (options?: { nextYunitId?: string | number | null }) => void;
  onNextYunit: (yunitId: string | number) => void;
  onShowAssessment: (yunitId: string | number, nextYunitId?: string | number) => void;
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
  assessment_count?: number;
}

export const LessonContentView: React.FC<LessonContentViewProps> = ({
  yunitId,
  bahagiId,
  studentId,
  cachedYunits,
  onComplete,
  onNextYunit,
  onShowAssessment,
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionRewards, setCompletionRewards] = useState({ xp: 0, coins: 0 });
  const [pendingNextYunitId, setPendingNextYunitId] = useState<string | number | null>(null);
  const [shouldOpenAssessment, setShouldOpenAssessment] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isYunitAudioPlaying, setIsYunitAudioPlaying] = useState(false);
  const topicAudioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const yunitAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completionPromiseRef = useRef<Promise<any> | null>(null);
  const celebrationShownRef = useRef(false);

  const normalizeTopics = (discussion?: string) => {
    if (!discussion) {
      return [] as { title: string; content: string; images: string[]; audio: string; quotes: { text: string; audio: string }[] }[];
    }

    try {
      const parsed = JSON.parse(discussion);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [];
      }

      return parsed.map((topic: any) => ({
        title: topic?.title || '',
        content: topic?.content || '',
        images: Array.isArray(topic?.images) ? topic.images : [],
        audio: topic?.audio || '',
        quotes: Array.isArray(topic?.quotes)
          ? topic.quotes.map((quote: any) =>
              typeof quote === 'string'
                ? { text: quote, audio: '' }
                : { text: quote?.text || '', audio: quote?.audio || '' }
            )
          : [],
      }));
    } catch {
      return [];
    }
  };

  // Fetch all yunits for the bahagi (once)
  useEffect(() => {
    const fetchYunits = async () => {
      try {
        const hasCachedYunits = Boolean(cachedYunits && cachedYunits.length > 0);
        setIsLoading(!hasCachedYunits);

        if (cachedYunits && cachedYunits.length > 0) {
          setAllYunits(cachedYunits);

          const index = cachedYunits.findIndex((y: LessonData) => y.id === Number(yunitId));
          setCurrentIndex(index >= 0 ? index : 0);

          const currentYunit = cachedYunits.find((y: LessonData) => y.id === Number(yunitId));
          if (currentYunit) {
            setLesson({
              ...currentYunit,
              bahagi_icon_path: bahagiIconPath,
            });
          }

          if (!bahagiIconPath) {
            const firstYunit = cachedYunits[0];
            if (firstYunit?.id) {
              const lessonResponse = await fetch(`/api/rest/yunits/${firstYunit.id}`);
              const lessonData = await lessonResponse.json();
              if (lessonData.success && lessonData.data?.bahagi_icon_path) {
                setBahagiIconPath(lessonData.data.bahagi_icon_path);
              }
            }
          }
        }

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
  }, [bahagiId, studentId, yunitId, cachedYunits, bahagiIconPath]);

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
      setShowPagyamaninPage(false);
      setShowCelebration(false);
      setCompletionRewards({ xp: 0, coins: 0 });
      setPendingNextYunitId(null);
      setShouldOpenAssessment(false);
      completionPromiseRef.current = null;
      celebrationShownRef.current = false;
      
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

  const saveLessonCompletion = () => {
    if (!completionPromiseRef.current) {
      completionPromiseRef.current = markLessonComplete(yunitId);
    }

    return completionPromiseRef.current;
  };

  const applyCompletionRewards = (result: any) => {
    setCompletionRewards({
      xp: Number(result?.rewards?.xp) || LESSON_COMPLETION_XP,
      coins: Number(result?.rewards?.coins) || 0,
    });
  };

  const hasAssignedAssessment = async (currentYunitId: string | number) => {
    try {
      const response = await apiClient.assessment.fetch({
        yunit_id: Number(currentYunitId),
        student_view: true,
        first_only: true,
      });

      return Boolean(response.data?.assessments?.length);
    } catch (error) {
      console.error('[LessonContentView] Failed to check assessment for yunit:', error);
      return false;
    }
  };

  // Extract plain text from discussion (handles JSON topics or legacy text)
  const extractDisplayText = (discussion?: string, subtitle?: string): string => {
    if (!discussion) return subtitle || 'Welcome to this lesson!';

    const topics = normalizeTopics(discussion);
    if (topics.length > 0) {
      return topics.map((t) => {
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

    const trimmedDiscussion = discussion.trim();
    if (!trimmedDiscussion || trimmedDiscussion === '[]' || trimmedDiscussion === '{}') {
      return subtitle || 'Welcome to this lesson!';
    }

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

    // Animate text (audio is only played via the play button)
    let currentIndex = 0;
    const typingSpeed = 65; // milliseconds per character

    const timer = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedText(content.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsAnimating(false);
        setShowCompleteButton(true);
      }
    }, typingSpeed);

    animationTimerRef.current = timer;
  };

  // Stop all audio playing on the current slide
  const stopAllAudio = () => {
    // Stop yunit-level audio
    if (yunitAudioRef.current) {
      yunitAudioRef.current.pause();
      yunitAudioRef.current.currentTime = 0;
      yunitAudioRef.current = null;
    }
    setIsYunitAudioPlaying(false);
    // Stop auto-play audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop all topic/quote audio
    Object.values(topicAudioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingAudioId(null);
  };

  // Start text animation when lesson loads
  useEffect(() => {
    if (!lesson) return;

    stopAllAudio();
    startAnimation();

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (yunitAudioRef.current) {
        yunitAudioRef.current.pause();
        yunitAudioRef.current = null;
      }
      setIsYunitAudioPlaying(false);
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
  parsedTopics = normalizeTopics(lesson.discussion);
  const contentLength = parsedTopics.length > 0
    ? parsedTopics.reduce((total, topic) => total + (topic.title?.length || 0) + (topic.content?.replace(/<[^>]*>/g, '').length || 0), 0)
    : content.length;
  const isLongContent = contentLength > 900;
  const isVeryLongContent = contentLength > 1800;
  const topicBodyClass = isVeryLongContent
    ? 'text-slate-200 text-sm leading-6 prose prose-invert prose-sm max-w-none [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_hr]:border-slate-600'
    : isLongContent
      ? 'text-slate-200 text-base leading-7 prose prose-invert max-w-none [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_hr]:border-slate-600'
      : 'text-slate-200 text-lg leading-relaxed prose prose-invert prose-lg max-w-none [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_hr]:border-slate-600';
  const plainTextClass = isVeryLongContent
    ? 'text-slate-200 text-sm leading-6 whitespace-pre-wrap wrap-break-word'
    : isLongContent
      ? 'text-slate-200 text-[15px] leading-7 whitespace-pre-wrap wrap-break-word'
      : 'text-slate-200 text-base leading-relaxed whitespace-pre-wrap wrap-break-word';

  // Check if this is the Suriin lesson
  const isSuriinLesson = lesson.title?.toLowerCase().includes('suriin') || lesson.subtitle?.toLowerCase().includes('suriin');

  // Check if this is the Pagyamanin lesson with the specific self-introduction text
  const isPagyamaninLesson = content?.includes('Upang mas lalong makilala ang iyong sarili') || 
                             content?.includes('ipakilala ang iyong sarili');

  // Handle completion with celebration before transitioning to assessment.
  const handleComplete = async (nextYunitId?: string | number | null) => {
    if (celebrationShownRef.current) {
      return;
    }

    celebrationShownRef.current = true;
    const result = await saveLessonCompletion();
    applyCompletionRewards(result);
    setPendingNextYunitId(nextYunitId ?? null);
    setShouldOpenAssessment(await hasAssignedAssessment(yunitId));
    setCompletionRewards((currentRewards) => ({
      xp: currentRewards.xp || LESSON_COMPLETION_XP,
      coins: currentRewards.coins || 0,
    }));
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    if (shouldOpenAssessment) {
      onComplete({ nextYunitId: pendingNextYunitId });
      return;
    }

    if (pendingNextYunitId) {
      onNextYunit(pendingNextYunitId);
      return;
    }

    onBack();
  };

  // Show celebration screen
  if (showCelebration) {
    return (
      <CompletionCelebration
        onContinue={handleCelebrationComplete}
        message={
          shouldOpenAssessment
            ? 'Natapos mo na ang aralin! Susunod ang iyong assessment.'
            : pendingNextYunitId
              ? 'Natapos mo na ang aralin! Susunod na ang kasunod na Yunit.'
              : 'Natapos mo na ang aralin! Magaling!'
        }
        nextStepLabel={
          shouldOpenAssessment
            ? 'Simulan ang Assessment'
            : pendingNextYunitId
              ? 'Pumunta sa Susunod na Yunit'
              : 'Bumalik sa mga Yunit'
        }
        xpEarned={completionRewards.xp}
        coinsEarned={completionRewards.coins}
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
          const nextYunit = allYunits[currentIndex + 1];
          setShowPagyamaninPage(false);
          await handleComplete(nextYunit?.id ?? null);
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
          const nextYunit = allYunits[currentIndex + 1];
          setShowInteractivePage(false);
          await handleComplete(nextYunit?.id ?? null);
        }}
      />
    );
  }

  return (
    <div className="relative h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 overflow-hidden">
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
          <div className="flex items-start justify-between mb-3">
            <p className="text-slate-400 text-base">
              Yunit {currentIndex + 1}
            </p>
            {allYunits.length > 0 && (
              <span className="text-brand-purple font-semibold text-base">
                {currentIndex + 1}/{allYunits.length} Slides
              </span>
            )}
          </div>

          {/* Lesson Title */}
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-purple">
              {lesson.title}
            </h1>
            {lesson.audio_url && (
              <button
                type="button"
                onClick={() => {
                  if (isYunitAudioPlaying) {
                    // Stop
                    yunitAudioRef.current?.pause();
                    if (yunitAudioRef.current) yunitAudioRef.current.currentTime = 0;
                    setIsYunitAudioPlaying(false);
                  } else {
                    // Play
                    const audio = new Audio(lesson.audio_url!);
                    yunitAudioRef.current = audio;
                    audio.play().catch(() => {});
                    audio.addEventListener('ended', () => setIsYunitAudioPlaying(false));
                    setIsYunitAudioPlaying(true);
                  }
                }}
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isYunitAudioPlaying
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30'
                }`}
                title={isYunitAudioPlaying ? 'Stop audio' : 'Play yunit audio'}
              >
                {isYunitAudioPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
            )}
          </div>

          {/* Topic Content */}
          <div className="mb-8 grow space-y-8">
            {parsedTopics.length > 0 ? (
              /* Structured topic rendering */
              parsedTopics.map((topic, idx) => {
                const audioId = `topic-${idx}`;
                return (
                  <div key={idx} className="space-y-4">
                    {topic.title && (
                      <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                    )}
                    {topic.content && (
                      <div
                        className={topicBodyClass}
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
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-all ${
                            playingAudioId === audioId
                              ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30'
                              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="text-xl">{playingAudioId === audioId ? '🔊' : '🔇'}</span>
                          {playingAudioId === audioId ? 'Naka-on ang Audio' : 'I-play ang Audio'}
                        </button>
                        <audio
                          ref={el => { topicAudioRefs.current[audioId] = el; }}
                          src={topic.audio}
                          preload="none"
                          onEnded={() => setPlayingAudioId(null)}
                          className="hidden"
                        />
                      </div>
                    )}
                    {/* Pairs laid out horizontally: image+callout grouped together */}
                    {(() => {
                      const images = topic.images || [];
                      const quotes = topic.quotes || [];
                      const maxLen = Math.max(images.length, quotes.length);
                      if (maxLen === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-5">
                          {Array.from({ length: maxLen }).map((_, i) => {
                            const img = images[i] || images[images.length - 1];
                            const q = quotes[i];
                            const qAudioId = `quote-${idx}-${i}`;
                            return (
                              <div key={i} className="flex items-center gap-3 flex-1 min-w-75">
                                {/* Image */}
                                {img && (
                                  <div className="shrink-0">
                                    <img src={img} alt={`${topic.title || 'Topic'} image ${i + 1}`} loading="lazy" className="w-44 md:w-52 h-auto object-contain" />
                                  </div>
                                )}
                                {/* Callout */}
                                {q && (
                                  <div className="relative flex-1">
                                    {img && (
                                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-700/80" />
                                    )}
                                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-5 py-4 space-y-2">
                                      <p className="text-slate-200 text-base leading-relaxed">&ldquo;{q.text}&rdquo;</p>
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
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
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
                                          preload="none"
                                          onEnded={() => setPlayingAudioId(null)}
                                          className="hidden"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            ) : (
              /* Legacy plain text with typing animation */
              <div className={plainTextClass}>
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
          <div className="space-y-4">
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
                    loading="lazy"
                    className="w-full max-h-80 object-contain rounded-lg"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Button - Inside Card Bottom */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-8 mt-auto">
              {currentIndex > 0 && (
                <button
                  onClick={() => {
                    stopAllAudio();
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
                    stopAllAudio();
                    if (isSuriinLesson) {
                      setShowInteractivePage(true);
                    } else if (isPagyamaninLesson) {
                      setShowPagyamaninPage(true);
                    } else {
                      const nextYunit = allYunits[currentIndex + 1];
                      await handleComplete(nextYunit?.id ?? null);
                    }
                  }}
                  className="px-8 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-brand-purple/40 hover:scale-105"
                >
                  Magpatuloy
                </button>
              )}

              {currentIndex === allYunits.length - 1 && (
                <button
                  onClick={async () => {
                    stopAllAudio();
                    if (isSuriinLesson) {
                      setShowInteractivePage(true);
                    } else if (isPagyamaninLesson) {
                      setShowPagyamaninPage(true);
                    } else {
                      await handleComplete();
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
