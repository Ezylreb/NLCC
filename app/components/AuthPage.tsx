'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AuthPageProps {
    onAuthSuccess: (user: any) => void;
    onBack: () => void;
}

/**
 * @deprecated Use LoginPage component instead
 * This component is kept for backward compatibility only
 */
export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        // No special setup needed for login-only mode
    }, []);

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
                    requestedMode: 'login', // System handles role detection
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Role will be determined from database
                onAuthSuccess(data.user);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 md:p-12 overflow-hidden bg-slate-950 selection:bg-brand-purple">

            <motion.button
                onClick={onBack}
                whileHover={{ x: -10 }}
                className="fixed top-3 left-3 md:top-12 md:left-12 z-50 bg-white/10 backdrop-blur-xl px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl font-black text-white hover:text-brand-purple transition-all border border-white/20 shadow-2xl text-[9px] md:text-base"
            >
                ← Return
            </motion.button>

            <motion.main 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md z-20"
            >
                <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 md:p-12 shadow-[0_50px_100px_rgb(0,0,0,0.3)] border border-white/20 relative overflow-hidden group">
                    {/* Glowing Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-purple/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div>
                        <header className="mb-8 text-center">
                            <div className="text-brand-purple text-[10px] font-black tracking-[0.3em] uppercase mb-2 opacity-80">Welcome</div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide uppercase leading-tight mb-3">
                                Welcome Back
                            </h1>
                            <p className="text-sm md:text-base text-white/60 font-semibold">
                                Log in to your account
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {error && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-red-400 font-bold text-sm text-center">{error}</p>
                                </motion.div>
                            )}

                            <div className="flex flex-col gap-2">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg bg-white/5 border border-white/10 focus:border-brand-purple focus:bg-white/10 outline-none font-semibold text-white transition-all text-sm md:text-base placeholder:text-white/40"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg bg-white/5 border border-white/10 focus:border-brand-purple focus:bg-white/10 outline-none font-semibold text-white transition-all text-sm md:text-base placeholder:text-white/40"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    relative mt-4 py-3 md:py-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all overflow-hidden
                                    bg-gradient-to-r from-brand-purple to-brand-sky hover:shadow-lg hover:shadow-brand-purple/30 text-white
                                    active:scale-95 disabled:scale-100 disabled:opacity-50
                                `}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {isLoading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                    {isLoading ? 'Verifying...' : 'Login'}
                                </div>
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-xs text-white/50 text-center">
                                Your account is managed by administrators. <br />
                                Contact them if you need an account.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.main>
        </div>
    );
};

