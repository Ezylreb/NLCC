'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EditYunitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  yunit: any;
  isLoading?: boolean;
}

export const EditYunitForm: React.FC<EditYunitFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  yunit,
  isLoading = false
}) => {
  const [title, setTitle] = useState(yunit?.title || '');
  const [description, setDescription] = useState(yunit?.subtitle || '');
  const [discussion, setDiscussion] = useState(yunit?.discussion || '');
  const [mediaUrl, setMediaUrl] = useState(yunit?.media_url || '');
  const [audioUrl, setAudioUrl] = useState(yunit?.audio_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Update form fields when yunit changes
  useEffect(() => {
    if (yunit) {
      setTitle(yunit.title || '');
      setDescription(yunit.subtitle || '');
      setDiscussion(yunit.discussion || '');
      setMediaUrl(yunit.media_url || '');
      setAudioUrl(yunit.audio_url || '');
    }
  }, [yunit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    onSubmit({
      id: yunit.id,
      title,
      subtitle: description,
      discussion,
      media_url: mediaUrl,
      audio_url: audioUrl,
      isPublished: yunit.is_published
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Edit Yunit</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
          Update Yunit details
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yunit title"
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Discussion / Content
            </label>
            <textarea
              value={discussion}
              onChange={(e) => setDiscussion(e.target.value)}
              placeholder="Main content"
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Media (Image/Video)
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
                  <p className="text-sm text-slate-400 font-bold">Click to upload</p>
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
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
