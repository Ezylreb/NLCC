'use client';

import React, { useState, useRef } from 'react';

interface CreateYunitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    bahagiId: number;
    bahagiTitle: string;
    isLoading?: boolean;
}

export const CreateYunitForm: React.FC<CreateYunitFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bahagiId,
    bahagiTitle,
    isLoading = false
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [discussion, setDiscussion] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a Yunit title');
            return;
        }

        const data = {
            bahagiId,
            bahagiTitle,
            title,
            subtitle: description,
            discussion,
            media_url: mediaUrl,
            audio_url: audioUrl,
            lesson_order: undefined
        };

        onSubmit(data);
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDiscussion('');
        setMediaUrl('');
        setAudioUrl('');
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, store as base64. In production, use S3/cloud storage
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, store as base64. In production, use S3/cloud storage
        const reader = new FileReader();
        reader.onloadend = () => {
            setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-[2.5rem] z-10 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-bold text-lg">Creating yunit...</p>
                        <p className="text-slate-400 text-sm">This may take a few moments</p>
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Yunit</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
                    Add a new learning unit to {bahagiTitle}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                      Yunit Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., 'Introduction to the Topic'"
                      className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                      Brief Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description of this yunit"
                      className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                      Discussion / Content (Rich Text)
                    </label>
                    <textarea
                      value={discussion}
                      onChange={(e) => setDiscussion(e.target.value)}
                      placeholder="Write the main content/discussion for this yunit..."
                      rows={6}
                      className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700 resize-none"
                    />
                    <p className="text-[10px] text-slate-600 mt-2">💡 Supports markdown formatting</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                      Media Upload (Image/Video)
                    </label>
                    <div
                      className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-brand-purple/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      {mediaUrl ? (
                        <div className="space-y-2">
                          <div className="text-4xl">📸</div>
                          <p className="text-sm text-brand-sky font-bold">Media selected</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaUrl('');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-400"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-4xl">📁</div>
                          <p className="text-sm text-slate-400 font-bold">Click to upload image or video</p>
                          <p className="text-xs text-slate-600">Supports: JPG, PNG, MP4, WebM</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                      Audio Upload
                    </label>
                    <div
                      className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-brand-sky/50 transition-all"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                      {audioUrl ? (
                        <div className="space-y-2">
                          <div className="text-4xl">🎵</div>
                          <p className="text-sm text-brand-sky font-bold">Audio selected</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioUrl('');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-400"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-4xl">🎤</div>
                          <p className="text-sm text-slate-400 font-bold">Click to upload audio</p>
                          <p className="text-xs text-slate-600">Supports: MP3, WAV, OGG</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving... Please wait
                        </>
                      ) : (
                        <>
                          <span>📖</span> Create Yunit
                        </>
                      )}
                    </button>
                  </div>
                </form>
            </div>
        </div>
    );
};
