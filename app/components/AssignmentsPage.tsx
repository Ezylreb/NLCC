'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface Assignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    status: 'assigned' | 'completed' | 'graded';
    reward: number;
    icon: string;
}

// Remove static MOCK_ASSIGNMENTS as we fetch now

interface AssignmentsPageProps {
    onBack: () => void;
    user: any;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ onBack, user }) => {
    const [assignments, setAssignments] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedAssignment, setSelectedAssignment] = React.useState<any | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [proofUrl, setProofUrl] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [lessonLinks, setLessonLinks] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignResponse, linksResponse] = await Promise.all([
                    apiClient.resource.fetchAssignments(),
                    apiClient.resource.fetchLinks()
                ]);
                
                if (assignResponse.success) {
                    setAssignments(assignResponse.data?.assignments || []);
                }
                if (linksResponse.success) {
                    setLessonLinks(linksResponse.data?.links || []);
                }
            } catch (err) {
                console.error('Failed to fetch assignments or links:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleProofUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const result = await apiClient.upload.uploadFile(file);
            if (result.success) {
                setProofUrl(result.data?.url || result.data?.path || result.data?.file_url);
            } else {
                alert(`Upload failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Failed to upload proof. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[50vh] animate-pulse">
                <div className="text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-12 animate-in fade-in slide-in-from-bottom duration-700 relative z-10">
            <header className="flex flex-col gap-2 md:gap-4 px-4 md:px-0">
                <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-slate-900 tracking-tightest leading-none drop-shadow-sm">
                    Your <span className="text-brand-purple">Tasks</span> 📋
                </h2>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
                    Pending tasks from your teacher
                </p>
            </header>

            {assignments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 px-4 md:px-0">
                    <AnimatePresence mode="popLayout">
                        {assignments.map((assignment: any, idx: number) => (
                            <motion.div
                                key={assignment.id}
                                layout
                                onClick={() => setSelectedAssignment(assignment)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white/30 backdrop-blur-3xl rounded-3xl md:rounded-[3.5rem] p-5 md:p-10 shadow-2xl shadow-purple-900/5 border border-white/50 flex flex-col md:flex-row items-center gap-6 md:gap-10 group hover:-translate-y-2 hover:bg-white/50 transition-all cursor-pointer overflow-hidden relative"
                            >
                                {/* Glow Effect */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 opacity-20 bg-brand-purple blur-[50px] group-hover:opacity-40 transition-opacity`} />
                                
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-white shadow-2xl flex items-center justify-center text-3xl md:text-5xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 overflow-hidden border border-slate-50 shrink-0">
                                    {assignment.icon || '📝'}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border ${
                                            assignment.status === 'completed' ? 'bg-emerald-400/10 text-emerald-600 border-emerald-400/20' : 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                                        }`}>
                                            {assignment.status || 'Assigned'}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '—'}</span>
                                    </div>
                                    <h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-none group-hover:text-brand-purple transition-colors text-center md:text-left w-full truncate md:overflow-visible">{assignment.title}</h3>
                                    <p className="text-slate-500 font-bold text-[12px] md:text-sm leading-relaxed line-clamp-2 text-center md:text-left">{assignment.description}</p>
                                    
                                    <div className="pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 text-xl">⭐</span>
                                            <span className="text-xl font-black text-slate-800 tracking-tight">{assignment.reward} Imprints</span>
                                        </div>
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-brand-purple group-hover:text-white transition-all shadow-lg border border-slate-50">
                                            →
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/20 backdrop-blur-3xl rounded-[3rem] md:rounded-[5rem] p-12 md:p-24 shadow-2xl border border-dashed border-white/40 text-center flex flex-col items-center gap-6 md:gap-10 mx-4 md:mx-0"
                >
                    <div className="w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[3rem] bg-white/40 flex items-center justify-center text-5xl md:text-7xl shadow-2xl border border-white">
                        📭
                    </div>
                    <div className="space-y-4 max-w-lg">
                        <h3 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">No Tasks Yet</h3>
                        <p className="text-base md:text-xl text-slate-500 font-bold tracking-tight">Your teacher hasn't assigned any tasks yet. Explore the lessons while you wait!</p>
                    </div>
                    <button 
                        onClick={onBack}
                        className="px-8 md:px-10 py-4 md:py-5 rounded-[2rem] md:rounded-[2.5rem] bg-brand-purple text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] shadow-2xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        Return to Grid 🚀
                    </button>
                </motion.div>
            )}

            {lessonLinks.length > 0 && (
                <div className="flex flex-col gap-8 mt-4 px-4 md:px-0">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tightest">Extra <span className="text-brand-sky">Resources</span> 🔗</h3>
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[8px]">Supplementary materials from your teacher</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessonLinks.map((link, idx) => (
                            <motion.a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white hover:bg-white/50 transition-all group flex flex-col shadow-xl shadow-sky-900/5"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                    {link.icon || '🔗'}
                                </div>
                                <h4 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-brand-sky transition-colors">{link.title}</h4>
                                <p className="text-slate-500 font-bold text-xs leading-relaxed line-clamp-2 mb-6">{link.description || 'Visit this link for more information.'}</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-[10px] font-black text-brand-sky uppercase tracking-widest group-hover:translate-x-1 transition-transform">Open Link →</span>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            )}

            {/* Selection Portal (Modal) */}
            <AnimatePresence>
                {selectedAssignment && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative bg-white/90 backdrop-blur-3xl rounded-3xl md:rounded-[4rem] p-6 md:p-12 w-full max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white"
                        >
                            <button 
                                onClick={() => setSelectedAssignment(null)}
                                className="absolute top-6 md:top-10 right-6 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-white/50 text-slate-500 rounded-xl md:rounded-2xl flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all z-[210] shadow-xl border border-white"
                            >
                                ✕
                            </button>
                            
                            <div className="flex flex-col items-center text-center gap-6 md:gap-8 relative z-10">
                                <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center text-5xl md:text-7xl shadow-2xl border-4 border-white">
                                    {selectedAssignment.icon || '📝'}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tightest leading-none">{selectedAssignment.title}</h3>
                                    <p className="text-sm md:text-xl font-bold text-slate-500 max-w-md mx-auto leading-relaxed tracking-tight">{selectedAssignment.description}</p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row bg-white/50 p-6 md:p-8 rounded-2xl md:rounded-[3rem] w-full justify-around border border-white/50 shadow-inner gap-4">
                                    <div className="flex flex-col items-center gap-1 md:gap-2">
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward Value</span>
                                        <span className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-2 md:gap-3">{selectedAssignment.reward} <span className="text-amber-400 text-lg md:text-2xl">⭐</span></span>
                                    </div>
                                    <div className="hidden sm:block w-px bg-slate-200/50"></div>
                                    <div className="flex flex-col items-center gap-1 md:gap-2">
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                                        <span className="text-xl md:text-3xl font-black text-slate-900">{selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ml-2">Proof of Completion (Photo)</label>
                                        <div className="flex gap-4 items-center bg-white/40 p-4 rounded-3xl border border-white/60 shadow-inner group/upload">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/60 border border-white/80 rounded-2xl flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-sm relative transition-transform group-hover/upload:scale-105">
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                                        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {proofUrl ? (
                                                    <img src={proofUrl} alt="Submission Proof" loading="lazy" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="opacity-40">📸</span>
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <input 
                                                    type="text"
                                                    value={proofUrl || ''}
                                                    onChange={(e) => setProofUrl(e.target.value)}
                                                    placeholder="Photo URL or Upload →"
                                                    className="w-full bg-white/60 border border-white text-slate-800 px-4 py-2.5 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all placeholder:text-slate-400"
                                                />
                                                <label className="w-full">
                                                    <div className="bg-brand-purple/10 hover:bg-brand-purple hover:text-white text-brand-purple text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl text-center cursor-pointer transition-all border border-brand-purple/20 shadow-sm">
                                                        {proofUrl ? 'Change Photo 🔄' : 'Select Photo 📂'}
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleProofUpload(file);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedAssignment.status === 'completed' ? (
                                        <button disabled className="w-full py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] bg-emerald-50 text-emerald-600 font-black text-xs md:text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-3 md:gap-4 border-2 border-emerald-100 italic">
                                            Imprint Verified ✓
                                        </button>
                                    ) : (
                                        <button 
                                            disabled={isSubmitting || isUploading}
                                            onClick={async () => {
                                                if (!user?.id) return;
                                                setIsSubmitting(true);
                                                try {
                                                    const result = await apiClient.resource.createLink({
                                                        user_id: user.id,
                                                        assignment_id: selectedAssignment.id,
                                                        proof_url: proofUrl
                                                    });
                                                    if (result.success) {
                                                        setAssignments(prev => prev.map(a => a.id === selectedAssignment.id ? { ...a, status: 'completed' } : a));
                                                        setSelectedAssignment(null);
                                                        setProofUrl(null);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }}
                                            className="w-full py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] bg-brand-purple text-white font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-2xl shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Now 🚀'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
