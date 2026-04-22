'use client';

import React, { useState } from 'react';

interface DraftLessonProps {
  bahagiId: string;
  draftData?: any;
  onSaveDraft: (data: any) => void;
  onPublish: (data: any) => void;
  isLoading?: boolean;
}

interface LessonDraft {
  title: string;
  subtitle: string;
  discussion: string;
  mediaUrl?: string;
  isDraft: boolean;
  lastSavedAt?: Date;
}

export const DraftLessonManager: React.FC<DraftLessonProps> = ({
  bahagiId,
  draftData,
  onSaveDraft,
  onPublish,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<LessonDraft>(draftData || {
    title: '',
    subtitle: '',
    discussion: '',
    mediaUrl: '',
    isDraft: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');

  const handleFieldChange = (field: keyof LessonDraft, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    try {
      onSaveDraft({
        bahagiId,
        ...formData,
        isDraft: true
      });
      setHasChanges(false);
      setAutoSaveMessage('✅ Draft saved');
      setTimeout(() => setAutoSaveMessage(''), 3000);
    } catch (err) {
      setAutoSaveMessage('❌ Failed to save');
    }
  };

  const handlePublish = async () => {
    // Show confirmation
    setShowPublishConfirm(false);
    try {
      onPublish({
        bahagiId,
        ...formData,
        isDraft: false
      });
      setHasChanges(false);
    } catch (err) {
      alert('Failed to publish');
    }
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Are you sure? All unsaved changes will be lost.')) {
      setFormData({
        title: '',
        subtitle: '',
        discussion: '',
        mediaUrl: '',
        isDraft: true
      });
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Status Header */}
      <div className={`border rounded-2xl p-6 ${
        formData.isDraft
          ? 'bg-yellow-900/20 border-yellow-700/50'
          : 'bg-green-900/20 border-green-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1">
              {formData.isDraft ? '📝 Draft Mode' : '✅ Published'}
            </p>
            <p className={`text-sm font-bold ${
              formData.isDraft ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {formData.isDraft 
                ? 'This lesson is only visible to you. Publish to make it available to students.'
                : 'This lesson is published and visible to students.'}
            </p>
          </div>
          {formData.lastSavedAt && (
            <p className="text-xs text-slate-400 font-bold">
              Last saved: {new Date(formData.lastSavedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Auto-save Message */}
      {autoSaveMessage && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
          <p className="text-sm font-bold text-slate-300">{autoSaveMessage}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="text-sm font-black text-slate-400 block mb-2">LESSON TITLE *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Enter lesson title..."
            className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="text-sm font-black text-slate-400 block mb-2">SUBTITLE</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            placeholder="Brief subtitle..."
            className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all"
          />
        </div>

        {/* Discussion/Content */}
        <div>
          <label className="text-sm font-black text-slate-400 block mb-2">LESSON CONTENT</label>
          <textarea
            value={formData.discussion}
            onChange={(e) => handleFieldChange('discussion', e.target.value)}
            placeholder="Enter lesson content with markdown support..."
            rows={8}
            className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-500 font-bold mt-2">
            Supports markdown: **bold**, *italic*, [links](url), etc.
          </p>
        </div>

        {/* Media URL */}
        <div>
          <label className="text-sm font-black text-slate-400 block mb-2">MEDIA URL (optional)</label>
          <input
            type="url"
            value={formData.mediaUrl}
            onChange={(e) => handleFieldChange('mediaUrl', e.target.value)}
            placeholder="https://example.com/image.jpg or video.mp4"
            className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all"
          />
          {formData.mediaUrl && (
            <div className="mt-4 flex gap-4">
              {formData.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <img
                  src={formData.mediaUrl}
                  alt="Preview"
                  loading="lazy"
                  className="h-32 rounded-lg object-cover"
                />
              )}
              {formData.mediaUrl.match(/\.(mp4|webm|ogg)$/i) && (
                <video
                  src={formData.mediaUrl}
                  controls
                  className="h-32 rounded-lg"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={!hasChanges || isLoading}
          className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50"
        >
          💾 Save as Draft
        </button>

        <button
          onClick={() => setShowPublishConfirm(true)}
          disabled={!formData.title || isLoading}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50"
        >
          🚀 Publish Lesson
        </button>

        <button
          onClick={handleDiscardDraft}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700/50 rounded-xl font-black text-sm uppercase transition-all"
        >
          🗑️ Discard Draft
        </button>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-4">Publish Lesson?</h3>
            <p className="text-slate-300 font-bold mb-6">
              Once published, this lesson will be visible to all students in the class. You can still edit it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
