'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoginPageProps {
    onAuthSuccess: (user: any) => void;
    onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password,
                    requestedMode: 'login', // System will handle role detection
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Role-based redirect will be handled by parent component
                onAuthSuccess(data.user);
            } else {
                setError(data.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 overflow-hidden flex flex-col selection:bg-brand-purple">
            {/* Top Navigation */}
            <div className="w-full bg-slate-800/50 backdrop-blur-xl border-b border-slate-700 px-6 md:px-12 py-4 md:py-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
                        <Image
                            src="/logo/logo.png"
                            alt="NLCC Logo"
                            width={48}
                            height={48}
                            quality={95}
                            priority
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                            NLCC
                        </h2>
                        <p className="text-xs text-slate-400 font-semibold">Northern Lights Learning Center</p>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl z-10 flex-1 flex items-center justify-center px-4"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
                    {/* LEFT SIDE: Character Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="hidden lg:flex items-center justify-center relative h-full min-h-[500px]"
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Decorative Background Glow */}
                            <div className="absolute w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
                            <div className="absolute w-96 h-96 bg-brand-sky/10 rounded-full blur-3xl -bottom-20 right-0 animate-pulse" style={{ animationDelay: '1s' }} />

                            {/* Character Image - No Background Box */}
                            <div className="relative z-10 w-full max-w-sm aspect-square">
                                <Image
                                    src="/Character/NLLCTeacher1.png"
                                    alt="NLLC Teacher Character"
                                    width={500}
                                    height={600}
                                    quality={95}
                                    priority
                                    className="w-full h-auto object-contain drop-shadow-2xl"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile Character Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="lg:hidden flex items-center justify-center mb-4"
                    >
                        <div className="relative w-32 h-40">
                            <Image
                                src="/Character/NLLCTeacher1.png"
                                alt="NLLC Teacher Character"
                                width={200}
                                height={240}
                                quality={90}
                                priority
                                className="w-full h-auto object-contain drop-shadow-lg"
                            />
                        </div>
                    </motion.div>

                    {/* RIGHT SIDE: Login Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full"
                    >
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-6 md:p-10 shadow-2xl shadow-purple-500/20 relative overflow-hidden group">
                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            {/* Header */}
                            <motion.div className="mb-8 text-center lg:text-left">
                                <div className="text-brand-sky text-[9px] md:text-[10px] font-black tracking-[0.4em] uppercase mb-3 opacity-80">
                                    Secure Access
                                </div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-wide uppercase leading-tight mb-2">
                                    Welcome Back
                                </h1>
                                <p className="text-xs md:text-sm text-slate-400 font-semibold">
                                    Enter your credentials to continue
                                </p>
                            </motion.div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-3 md:p-4 bg-red-500/15 border border-red-500/30 rounded-lg backdrop-blur"
                                    >
                                        <p className="text-red-400 font-bold text-xs md:text-sm text-center flex items-center justify-center gap-2">
                                            <span>⚠️</span>
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Email Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col gap-2"
                                >
                                    <label className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2.5 md:px-5 md:py-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-brand-purple/50 focus:border-brand-purple focus:bg-slate-800/80 outline-none font-semibold text-white text-sm md:text-base transition-all placeholder:text-slate-500 disabled:opacity-50"
                                        required
                                    />
                                </motion.div>

                                {/* Password Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col gap-2"
                                >
                                    <label className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2.5 md:px-5 md:py-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-brand-purple/50 focus:border-brand-purple focus:bg-slate-800/80 outline-none font-semibold text-white text-sm md:text-base transition-all placeholder:text-slate-500 disabled:opacity-50"
                                        required
                                    />
                                </motion.div>

                                {/* Login Button */}
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                    className="relative mt-6 md:mt-8 py-3 md:py-4 rounded-lg font-black text-xs md:text-sm uppercase tracking-widest text-white transition-all overflow-hidden group/btn bg-brand-purple hover:shadow-lg hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/0 via-white/20 to-brand-sky/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀 Login</span>
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            </form>

                            {/* Info Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 pt-6 border-t border-slate-800"
                            >
                                <p className="text-xs md:text-sm text-slate-400 text-center leading-relaxed">
                                    Your account is securely managed by administrators. <br className="hidden md:block" />
                                    If you don't have an account, please contact your administrator.
                                </p>
                            </motion.div>
                        </div>

                        {/* Security Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"
                        >
                            <span>🔒</span>
                            <span>Secure server • Role-based access • Database authenticated</span>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 -right-32 w-96 h-96 bg-brand-sky/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
        </div>
    );
};
