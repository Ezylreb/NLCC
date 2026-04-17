'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion';
import { Landing3DParallax } from './Landing3DParallax';

interface LandingPageProps {
    onStart: () => void;
    onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollYProgress } = useScroll();
    
    // Smooth scrolling springs for different speeds
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const yParallaxSection = useTransform(smoothProgress, [0, 1], [0, -100]);
    const scrollScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.98, 1]);
    const scrollBlur = useTransform(smoothProgress, [0, 0.5, 1], [0, 2, 0]);
    
    // Smooth Velocity for "Liquid" effect
    const scrollVelocity = useVelocity(scrollYProgress);
    const smoothVelocity = useSpring(scrollVelocity, { stiffness: 400, damping: 50 });
    const skewVelocity = useTransform(smoothVelocity, [-1, 1], [-2, 2]);
    const scaleVelocity = useTransform(smoothVelocity, [-1, 1], [0.99, 1.01]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent selection:bg-brand-purple">
            {/* 3D Three.js Parallax Background Layer */}
            <Landing3DParallax />

            {/* Main Content Layer */}
            <div className="relative z-10">
                <header role="banner">
                    {/* Navbar */}
                    <motion.nav 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex justify-between items-center bg-white/70 backdrop-blur-xl sticky top-2 md:top-6 z-50 rounded-2xl md:rounded-[2rem] mx-2 md:mx-8 mt-2 md:mt-6 shadow-2xl shadow-purple-500/5 border border-white/40"
                    >
                        <div
                            className="flex items-center gap-2 md:gap-3 group cursor-pointer"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            role="button"
                        >
                            <Image src="/logo/logo.png" alt="NLLC Logo" width={40} height={40} className="md:w-12 md:h-12 rounded-2xl shadow-lg shadow-purple-200 group-hover:rotate-12 transition-transform" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl md:text-3xl font-black text-brand-purple tracking-tighter leading-none">NLLC</h1>
                                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5 md:mt-1">Neurolingua</span>
                            </div>
                        </div>

                        <div className="hidden lg:flex gap-6 items-center">
                            <button onClick={onLogin} className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-brand-purple hover:text-white transition-all font-bold text-sm shadow-inner">
                                <span>Sign In</span>
                            </button>
                            <button onClick={onStart} className="px-8 py-3.5 rounded-2xl bg-brand-purple text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/25">
                                Start Learning 🚀
                            </button>
                        </div>

                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-600">
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </button>
                    </motion.nav>

                    {/* Mobile Menu Overlay */}
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                className="lg:hidden fixed inset-x-4 top-[5.5rem] z-40 bg-white/95 backdrop-blur-3xl rounded-2xl md:rounded-[3rem] shadow-2xl border border-white p-4 md:p-10 flex flex-col gap-3 md:gap-6"
                            >
                                <button onClick={() => { onLogin(); setIsMobileMenuOpen(false); }} className="p-4 md:p-6 rounded-xl md:rounded-3xl bg-slate-50 text-slate-800 font-bold text-left flex justify-between items-center group">
                                    <span className="text-base md:text-xl">Sign In</span> <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </button>
                                <button onClick={() => { onStart(); setIsMobileMenuOpen(false); }} className="p-5 md:p-8 rounded-xl md:rounded-[2.5rem] bg-brand-purple text-white font-black uppercase tracking-widest shadow-2xl shadow-purple-500/30 text-sm md:text-lg">
                                    Start Learning 🚀
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <motion.main 
                    style={{ 
                        skewY: skewVelocity,
                        scale: scaleVelocity,
                        filter: useTransform(smoothVelocity, [-1, 1], ['blur(0px)', 'blur(0.5px)'])
                    }}
                >
                    {/* Hero Section */}
                    <motion.section 
                        style={{ y: useTransform(smoothProgress, [0, 0.3], [0, -100]) }}
                        className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-48 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center overflow-visible"
                    >
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="flex flex-col gap-10 text-center lg:text-left items-center lg:items-start"
                        >
                            <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-brand-purple/10 text-brand-purple shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-brand-purple animate-ping" />
                                Interactive Language Adventures
                            </div>
                            <h2 className="text-4xl sm:text-5xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tightest">
                                Learn Tagalog <br /> with <span className="text-brand-purple drop-shadow-glow-purple">Magic.</span>
                            </h2>
                            <p className="text-lg md:text-2xl text-slate-600 font-bold leading-relaxed max-w-xl">
                                Empower your child with the gift of language. Our 3D interactive quests and expert tutors make every lesson an unforgettable journey.
                            </p>
                            <div className="flex flex-wrap gap-6 items-center justify-center lg:justify-start w-full">
                                <button onClick={onStart} className="w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] bg-brand-purple text-white text-lg md:text-xl font-black shadow-2xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all">
                                    Get Started 🚀
                                </button>
                                <div className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-sky rounded-2xl flex items-center justify-center text-2xl">✨</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered By</p>
                                        <p className="text-sm font-black text-brand-purple">Premium Curriculum</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            style={{ 
                                y: useTransform(smoothProgress, [0, 0.4], [0, -200]),
                                rotate: useTransform(smoothProgress, [0, 0.4], [0, 5])
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "circOut" }}
                            viewport={{ once: true }}
                            className="relative group"
                        >
                            <div className="absolute -inset-10 bg-brand-purple/10 rounded-[5rem] blur-3xl animate-pulse" />
                            <div className="relative bg-white/20 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] md:rounded-[4rem] border border-white/40 shadow-2xl lg:scale-110">
                                <Image
                                    src="/schoolpic/banner1.jpg"
                                    alt="NLLC Learning Adventure"
                                    width={900}
                                    height={900}
                                    className="rounded-[1.8rem] md:rounded-[3.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Floating Overlay UI */}
                                <motion.div 
                                    animate={{ y: [0, -20, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-12 -right-12 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50 hidden lg:block"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl">✓</div>
                                        <div>
                                            <p className="font-black text-slate-900 text-lg">Perfectly Done!</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">+500 points</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.section>
                </motion.main>

                
            </div>

            <style jsx>{`
                .drop-shadow-glow-purple { filter: drop-shadow(0 0 30px rgba(139,92,246,0.4)); }
                .drop-shadow-glow-sky { filter: drop-shadow(0 0 30px rgba(56,189,248,0.4)); }
                .drop-shadow-glow-emerald { filter: drop-shadow(0 0 30px rgba(52,211,153,0.4)); }
                .drop-shadow-glow-coral { filter: drop-shadow(0 0 30px rgba(251,113,133,0.4)); }
                .tracking-tightest { letter-spacing: -0.05em; }
            `}</style>
        </div>
    );
};
