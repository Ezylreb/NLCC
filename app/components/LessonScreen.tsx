'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LESSON_DATA } from '../lib/lessonData';


import { MissingLetterGame } from './MissingLetterGame';
import { SyllableGame } from './SyllableGame';

import { LessonBackground3D } from './LessonBackground3D';
import confetti from 'canvas-confetti';

interface LessonScreenProps {
    lessonId: string;
    onBack: () => void;
    user: any;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({ lessonId, onBack, user }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lessonFinished, setLessonFinished] = useState(false);
    const [showGame, setShowGame] = useState(false);
    const [tutorMessage, setTutorMessage] = useState<string>("Magaling! Handa ka na bang matuto?");
    const ariaLiveRef = useRef<HTMLDivElement>(null);

    const [lesson, setLesson] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await fetch(`/api/lessons/${lessonId}`);
                if (response.ok) {
                    const data = await response.json();
                    setLesson(data);
                    setItems(data.items);
                } else {
                    // Fallback to local data
                    const lessonKey = lessonId in LESSON_DATA ? lessonId as keyof typeof LESSON_DATA : 'alpabeto';
                    const localLesson = LESSON_DATA[lessonKey];
                    setLesson(localLesson);
                    setItems(localLesson.items);
                }
            } catch (err) {
                console.error('Failed to fetch lesson:', err);
                const lessonKey = lessonId in LESSON_DATA ? lessonId as keyof typeof LESSON_DATA : 'alpabeto';
                const localLesson = LESSON_DATA[lessonKey];
                setLesson(localLesson);
                setItems(localLesson.items);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    const currentItem = items[currentIndex] || {};

    const saveProgress = async (index: number, isCompleted: boolean) => {
        if (!user?.id) return;
        try {
            await fetch('/api/user/lesson-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    lessonId: lessonId,
                    lastItemIndex: index,
                    completed: isCompleted,
                    score: items.length > 0 ? Math.floor(((index + 1) / items.length) * 100) : 0
                })
            });
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    };

    const nextItem = () => {
        if (currentIndex < items.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setShowGame(false);
            const msg = `Handa ka na para sa susunod?`;
            setTutorMessage(msg);
            saveProgress(nextIdx, false);
        } else {
            setLessonFinished(true);
            setTutorMessage("Wow! Natapos mo ang aralin na ito!");
            saveProgress(currentIndex, true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
            });
        }
    };

    const handleFeedback = (msg: string) => {
        setTutorMessage(msg);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[100]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-brand-purple font-black text-xs uppercase tracking-widest">Loading Lesson...</p>
                </div>
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-x-hidden selection:bg-brand-sky/30 text-white font-sans">
            <LessonBackground3D />
            
            {/* Screen Reader Announcements */}
            <div className="sr-only" aria-live="polite" ref={ariaLiveRef}>
                {tutorMessage}
            </div>

            {/* Navigation */}
            <header className="w-[94%] max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex justify-between items-center bg-slate-950/20 backdrop-blur-2xl sticky top-2 md:top-6 z-[60] rounded-2xl md:rounded-3xl mt-2 md:mt-4 shadow-2xl border border-white/10 transition-all duration-300">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 md:gap-3 py-1.5 md:py-2.5 px-3 md:px-6 rounded-xl md:rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-[8px] md:text-sm font-black uppercase tracking-widest text-white/70 hover:text-white transition-all shadow-xl"
                    aria-label="Quit current lesson and return to dashboard"
                >
                    <span className="text-xs md:text-lg opacity-50 group-hover:translate-x-[-4px] transition-transform">←</span>
                    <span className="hidden xs:inline">Quit</span>
                </button>
                <div className="flex flex-col items-center text-center">
                    <span className="text-[6px] md:text-[9px] font-black uppercase tracking-[0.4em] text-brand-sky opacity-80 mb-0.5 md:mb-1">Kasalukuyang Modyul</span>
                    <h1 className="text-[10px] md:text-2xl font-black text-white tracking-tighter drop-shadow-glow-sky line-clamp-1">{lesson.title}</h1>
                </div>
                <div className="flex gap-1 md:gap-3 items-center" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={items.length} aria-label="Lesson Progress">
                    {items.map((_, idx) => (
                        <div key={idx} className={`h-1 md:h-2 rounded-full transition-all duration-700 shadow-xl ${idx === currentIndex ? 'w-4 md:w-16 bg-brand-sky shadow-glow-sky' : idx < currentIndex ? 'w-1.5 md:w-4 bg-emerald-400 opacity-60' : 'w-1 md:w-3 bg-white/10'}`} aria-hidden="true"></div>
                    ))}
                </div>
            </header>

            <main className="w-full max-w-7xl relative z-10 flex flex-col items-center justify-center p-3 md:p-8 pt-20 md:pt-32 min-h-screen">
                <div className="flex flex-col items-center justify-center gap-8 md:gap-12 min-h-[400px] md:min-h-[600px] relative w-full">
                    {lessonFinished ? (
                        <div className="flex flex-col items-center gap-6 md:gap-8 animate-in zoom-in duration-700 p-6 md:p-14 w-[90%] md:w-full max-w-xl bg-white/5 backdrop-blur-3xl rounded-3xl md:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.1),transparent)] pointer-events-none" />
                            
                            <div className="w-20 md:w-40 h-20 md:h-40 bg-brand-sky/10 rounded-full flex items-center justify-center text-4xl md:text-8xl shadow-2xl border border-brand-sky/30 z-10 animate-bounce">🏆</div>
                            <div className="text-center relative z-10">
                                <span className="text-brand-sky font-black text-[7px] md:text-sm tracking-[0.4em] uppercase opacity-70 mb-1 md:mb-2 block">Aralin Nakumpleto</span>
                                <h2 className="text-2xl md:text-7xl font-black text-white tracking-tighter uppercase mb-2 md:mb-6">Mahusay!</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 md:gap-6 w-full relative z-10">
                                <div className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10 flex flex-col items-center">
                                    <span className="text-xl md:text-5xl font-black text-white drop-shadow-glow-sky">100%</span>
                                    <span className="text-[7px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Pag-unlad</span>
                                </div>
                                <div className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10 flex flex-col items-center">
                                    <span className="text-xl md:text-5xl font-black text-amber-400 drop-shadow-glow-amber">+50</span>
                                    <span className="text-[7px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mt-1 md:mt-2">Stars</span>
                                </div>
                            </div>
                            
                                <button
                                onClick={onBack}
                                className="w-full py-4 md:py-8 text-xs md:text-3xl font-black bg-gradient-to-r from-brand-purple to-purple-600 rounded-2xl md:rounded-[2.5rem] text-white shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest mt-4 md:mt-8 z-10"
                            >
                                Bumalik sa Nexus
                            </button>
                        </div>
                    ) : !showGame ? (
                        <section className="group w-full max-w-6xl mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-700 p-6 md:p-14 rounded-3xl md:rounded-[3rem] relative overflow-hidden transition-all bg-white/5 backdrop-blur-3xl border border-white/10 shadow-3xl" aria-label="Active Lesson Item">
                            {/* Background Glows */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-sky/10 blur-[100px] rounded-full -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-brand-sky/20" />
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-purple/10 blur-[100px] rounded-full -ml-48 -mb-48 transition-all duration-1000 group-hover:bg-brand-purple/20" />

                            <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
                                {/* Visual Projection Area - Left side */}
                                <div className="w-full flex items-center justify-center drop-shadow-3xl animate-float relative" role="img" aria-label={`Image representing ${currentItem.word || currentItem.letter}`}>
                                    <div className="absolute inset-0 bg-brand-sky/10 blur-[120px] rounded-full animate-pulse" />
                                    {currentItem.image && !imageErrors[currentIndex] && (currentItem.image.startsWith('http') || currentItem.image.startsWith('/') || currentItem.image.includes('.')) ? (
                                        <div className="bg-white/5 p-4 md:p-8 rounded-3xl md:rounded-[3rem] backdrop-blur-2xl border border-white/10 shadow-2xl w-full max-w-[200px] md:max-w-[400px] aspect-square relative group flex items-center justify-center mx-auto overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-brand-sky/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            <img 
                                                src={currentItem.image} 
                                                alt={currentItem.word || currentItem.letter}
                                                className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-700 group-hover:scale-110"
                                                onError={() => {
                                                    setImageErrors(prev => ({ ...prev, [currentIndex]: true }));
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-[5rem] md:text-[15rem] leading-none drop-shadow-glow-sky p-6 md:p-8 bg-white/5 rounded-3xl md:rounded-[3rem] w-full max-w-[180px] md:max-w-[380px] aspect-square flex items-center justify-center mx-auto border border-white/10">
                                            <span className="filter drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">{currentItem.emoji || (currentItem.image && !currentItem.image.startsWith('http') ? currentItem.image : '📚')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Right Side - Holographic Data */}
                                <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left justify-center px-2 md:px-4">
                                    <div className="w-full relative mb-6 md:mb-12">
                                        <span className="text-brand-sky text-[7px] md:text-sm font-black tracking-[0.5em] uppercase opacity-70 mb-1 md:mb-4 block">Lesson Progress</span>
                                        <div className="text-3xl md:text-7xl lg:text-[7rem] font-black tracking-tighter uppercase mb-2 md:mb-4 text-white line-clamp-2 leading-none drop-shadow-glow-sky italic">
                                            {currentItem.letter || currentItem.syllable || currentItem.word}
                                        </div>
                                        <div className="text-sm md:text-3xl lg:text-4xl font-bold tracking-tight text-white/50 mt-1 line-clamp-2 italic leading-relaxed">
                                            {currentItem.sentence || (currentItem.letter || currentItem.syllable ? currentItem.word : '')}
                                        </div>
                                    </div>

                                    {/* Action Matrix */}
                                    <div className="flex flex-col gap-3 md:gap-6 w-full max-w-md">
                                        {currentItem.link_url && (
                                            <a 
                                                href={currentItem.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-4 md:py-6 text-xs md:text-2xl font-black rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-brand-purple to-purple-600 text-white shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                                            >
                                                <span>🔗</span> Buksan ang Link
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setShowGame(true)}
                                            className="w-full py-4 md:py-8 text-xs md:text-3xl font-black rounded-2xl md:rounded-[2.5rem] bg-gradient-to-r from-brand-purple to-purple-600 text-white shadow-lg border-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-6"
                                            aria-label={lessonId === 'alpabeto' || lessonId === 'pantig' ? "Play an interactive game" : "Susunod na aralin"}
                                        >
                                            <span className="text-xl md:text-5xl drop-shadow-lg" aria-hidden="true">{lessonId === 'alpabeto' || lessonId === 'pantig' ? '🧩' : '➡️'}</span> 
                                            <span className="uppercase tracking-widest">{lessonId === 'alpabeto' || lessonId === 'pantig' ? 'Simulan ang Laro' : 'Susunod na Aralin'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="w-full max-w-xl animate-in slide-in-from-right duration-700 relative z-20" role="region" aria-label="Interactive Game Activity">
                            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-3xl md:rounded-[3rem] p-4 md:p-8 shadow-2xl border border-white/10 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-sky via-brand-purple to-brand-sky opacity-50" />
                                {lessonId === 'pantig' ? (
                                    <SyllableGame onWin={nextItem} onFeedback={handleFeedback} />
                                ) : lessonId === 'alpabeto' ? (
                                    <MissingLetterGame onWin={nextItem} onFeedback={handleFeedback} />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8">
                                        <p className="text-lg md:text-4xl font-black text-white text-center italic drop-shadow-glow-sky uppercase tracking-tighter">Mahusay! Nakumpleto mo ito.</p>
                                        <button 
                                            onClick={nextItem}
                                            className="w-full py-4 md:py-8 bg-gradient-to-r from-brand-purple to-purple-600 rounded-2xl md:rounded-3xl text-xs md:text-2xl font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                                        >
                                            Susunod na Aralin →
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowGame(false)}
                                className="mt-6 md:mt-8 text-white/50 font-black uppercase tracking-[0.3em] text-[8px] md:text-xs hover:text-brand-purple transition-colors w-full text-center p-2 md:p-4 focus:outline-none focus:ring-2 focus:ring-brand-purple rounded-xl"
                                aria-label="Return to the lesson overview"
                            >
                                ← BUMALIK SA ARALIN
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <style jsx>{`
                .drop-shadow-glow-sky { filter: drop-shadow(0 0 20px rgba(56,189,248,0.6)); }
                .drop-shadow-glow-amber { filter: drop-shadow(0 0 20px rgba(251,191,36,0.6)); }
                .shadow-glow-sky { box-shadow: 0 0 30px rgba(56,189,248,0.4); }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
};
