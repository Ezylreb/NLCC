'use client';

import React, { useRef, useState } from 'react';
import { TopicEditor, TopicData } from './TopicEditor';

interface CreateYunitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    bahagiId: number;
    bahagiTitle: string;
    isLoading?: boolean;
}

const createEmptyTopic = (): TopicData => ({
    id: crypto.randomUUID(),
    title: '',
    content: '',
    images: [],
    audio: '',
    quotes: [],
    isExpanded: true,
});

export const CreateYunitForm: React.FC<CreateYunitFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bahagiId,
    bahagiTitle,
    isLoading = false,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topics, setTopics] = useState<TopicData[]>([]);
    const [mediaUrl, setMediaUrl] = useState('');
    const [weekNumber, setWeekNumber] = useState('');
    const [moduleNumber, setModuleNumber] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a Yunit title');
            return;
        }

        const topicsPayload = topics.map((topic, index) => ({
            order: index,
            title: topic.title,
            content: topic.content,
            images: topic.images,
            audio: topic.audio,
            quotes: topic.quotes,
        }));

        const yunitAudio = audioUrl || topics.find((topic) => topic.audio)?.audio || '';

        onSubmit({
            bahagiId,
            bahagiTitle,
            title,
            subtitle: description,
            discussion: JSON.stringify(topicsPayload),
            media_url: mediaUrl || (topics.find((topic) => topic.images.length > 0)?.images[0] || ''),
            audio_url: yunitAudio,
            week_number: weekNumber ? parseInt(weekNumber, 10) : undefined,
            module_number: moduleNumber || undefined,
            lesson_order: undefined,
        });

        setTitle('');
        setDescription('');
        setTopics([]);
        setMediaUrl('');
        setWeekNumber('');
        setModuleNumber('');
        setAudioUrl('');
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setMediaUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setAudioUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const addTopic = () => {
        setTopics((prev) => [...prev, createEmptyTopic()]);
    };

    const updateTopic = (index: number, updated: TopicData) => {
        setTopics((prev) => prev.map((topic, topicIndex) => (topicIndex === index ? updated : topic)));
    };

    const deleteTopic = (index: number) => {
        setTopics((prev) => prev.filter((_, topicIndex) => topicIndex !== index));
    };

    const moveTopic = (from: number, to: number) => {
        if (to < 0 || to >= topics.length) return;
        setTopics((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-4">
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

                <h2 className="text-3xl font-black text-white tracking-tight mb-1">Create Yunit</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
                    Add a new learning unit to {bahagiTitle}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                                Week Number
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={weekNumber}
                                onChange={(e) => setWeekNumber(e.target.value)}
                                placeholder="e.g., 1"
                                className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                                Module Number
                            </label>
                            <input
                                type="text"
                                value={moduleNumber}
                                onChange={(e) => setModuleNumber(e.target.value)}
                                placeholder="e.g., Module 1"
                                className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                            Yunit Title *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Pagkilala sa Sarili"
                                className="flex-1 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => mediaInputRef.current?.click()}
                                className="shrink-0 w-12 h-12 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl flex items-center justify-center transition-all"
                                title="Upload cover image"
                            >
                                🖼
                            </button>
                            <button
                                type="button"
                                onClick={() => audioInputRef.current?.click()}
                                className="shrink-0 w-12 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center transition-all"
                                title="Upload yunit audio"
                            >
                                🎵
                            </button>
                            <input
                                ref={mediaInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleMediaUpload}
                                className="hidden"
                            />
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                                className="hidden"
                            />
                        </div>
                        {mediaUrl && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={mediaUrl} alt="Cover" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                                <span className="text-xs text-slate-400">Cover media set</span>
                                <button type="button" onClick={() => setMediaUrl('')} className="text-xs text-red-400 hover:text-red-300 ml-auto">
                                    Remove
                                </button>
                            </div>
                        )}
                        {audioUrl && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-lg">🎵</span>
                                <audio src={audioUrl} controls className="h-8 flex-1" />
                                <button type="button" onClick={() => setAudioUrl('')} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                            Brief Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description of this yunit"
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700 resize-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Topics
                            </label>
                            <button
                                type="button"
                                onClick={addTopic}
                                className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl text-xs font-bold transition-all"
                            >
                                + Topic
                            </button>
                        </div>

                        {topics.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                                No topics yet. Click <span className="text-brand-purple font-bold">+ Topic</span> to add content.
                            </div>
                        )}

                        <div className="space-y-3">
                            {topics.map((topic, idx) => (
                                <TopicEditor
                                    key={topic.id}
                                    topic={topic}
                                    index={idx}
                                    total={topics.length}
                                    onChange={(updated) => updateTopic(idx, updated)}
                                    onMoveUp={() => moveTopic(idx, idx - 1)}
                                    onMoveDown={() => moveTopic(idx, idx + 1)}
                                    onDelete={() => deleteTopic(idx)}
                                />
                            ))}
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
                                    Saving...
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
