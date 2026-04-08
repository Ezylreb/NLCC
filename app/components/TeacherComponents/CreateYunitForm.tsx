'use client';

import React, { useState } from 'react';

interface CreateYunitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    classId?: string;
    bahagiId?: number;
    lessonId?: string;
    isLoading?: boolean;
}

export const CreateYunitForm: React.FC<CreateYunitFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    classId,
    bahagiId,
    lessonId,
    isLoading = false
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [hasMedia, setHasMedia] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        const data = {
            title,
            content,
            mediaUrl: hasMedia ? mediaUrl : null,
            classId,
            bahagiId: bahagiId || null,
            lessonId: lessonId || null
        };

        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-10 shadow-2xl relative custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Yunit</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Add a discussion or learning material to this lesson</p>

                {/* Email-style Compose Box */}
                <form onSubmit={handleSubmit} className="space-y-6 bg-slate-950/50 border border-slate-800 rounded-4xl p-8">
                    
                    {/* From Field (Read-only - shows teacher) */}
                    <div className="flex items-center gap-3 pb-6 border-b border-slate-800/50">
                        <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white font-black text-sm">
                            T
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">From</p>
                            <p className="text-sm font-black text-white">Teacher (You)</p>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">To</label>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                            All Students in Class
                        </div>
                        <p className="text-[9px] text-slate-600 mt-1 ml-1">This yunit will be available to all students in this class</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-800/50"></div>

                    {/* Subject Line (Title) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Discussion Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., 'Pagkakaiba ng Pangalan' or 'Alamin ang Katangian ng Isang Nilalangsa'"
                            className="bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>

                    {/* Content/Body */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Content</label>
                        <textarea
                            required
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your discussion content, learning objectives, questions for the students, etc. You can use this to explain concepts, share stories, or pose questions for student reflection."
                            className="bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-xl text-sm font-medium focus:border-brand-purple outline-none transition-all resize-none placeholder:text-slate-700 leading-relaxed"
                        />
                        <p className="text-[9px] text-slate-600 ml-1">Tip: Make it interactive by asking questions or including discussion prompts</p>
                    </div>

                    {/* Media Section */}
                    <div className="border-t border-slate-800/50 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                id="hasMedia"
                                checked={hasMedia}
                                onChange={(e) => setHasMedia(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 cursor-pointer"
                            />
                            <label htmlFor="hasMedia" className="text-sm font-black text-white cursor-pointer">
                                Add Media (Image/Video/Audio)
                            </label>
                        </div>

                        {hasMedia && (
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                                        Media URL
                                    </label>
                                    <input
                                        type="url"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-medium focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                                        Or Upload File
                                    </label>
                                    <label className="flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-800 hover:border-brand-purple/50 hover:bg-brand-purple/5 transition-all cursor-pointer">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">📁</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Click to upload or drag file
                                            </span>
                                            <span className="text-[9px] text-slate-600">PNG, JPG, MP4, MP3 up to 50MB</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*,video/*,audio/*" />
                                    </label>
                                </div>

                                {mediaUrl && (
                                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                                        <p className="text-xs text-slate-500 font-bold mb-2">Preview:</p>
                                        <img
                                            src={mediaUrl}
                                            alt="Media preview"
                                            className="max-w-full h-auto rounded-lg"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <span>✉️</span> Publish Yunit
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
