'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BahagiData {
  title: string;
  yunit: string;
  image: string;
  description: string;
}

interface TeacherBahagiProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: BahagiData) => Promise<void>;
  isLoading?: boolean;
}

export const TeacherBahagi: React.FC<TeacherBahagiProps> = ({ 
  isOpen, 
  onClose, 
  onCreate,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<BahagiData>({
    title: '',
    yunit: '',
    image: '',
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileUpload = async (file: File) => {
    // Clear previous error
    setErrors(prev => ({ ...prev, image: '' }));
    setIsUploading(true);
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj
      });

      const data = await res.json();

      if (res.ok) {
        setFormData(prev => ({ ...prev, image: data.url }));
        setErrors(prev => ({ ...prev, image: '' }));
      } else {
        // Handle setup errors
        if (data.setupUrl) {
          setErrors(prev => ({ 
            ...prev, 
            image: `${data.details} Click to setup: ${data.setupUrl}` 
          }));
        } else {
          setErrors(prev => ({ 
            ...prev, 
            image: data.details || data.error || 'Failed to upload image' 
          }));
        }
      }
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        image: err.message || 'Upload error - check your connection' 
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.yunit.trim()) newErrors.yunit = 'Yunit is required';
    // Image is optional now - can create bahagi without image
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onCreate(formData);
      setFormData({ title: '', yunit: '', image: '', description: '' });
      setErrors({});
    } catch (err) {
      console.error('Error creating bahagi:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-linear-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">➕ Create Bahagi</h2>
                <p className="text-slate-400 text-sm mt-1">Create a new course section</p>
              </div>
              <button
                onClick={onClose}
                className="text-2xl text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Bahagi Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mga Hayop sa Bukid"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-purple outline-none transition-all"
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Yunit */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Yunit *</label>
                <input
                  type="text"
                  value={formData.yunit}
                  onChange={e => setFormData({ ...formData, yunit: e.target.value })}
                  placeholder="e.g., Unit 1"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-purple outline-none transition-all"
                />
                {errors.yunit && <p className="text-red-400 text-xs mt-1">{errors.yunit}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description for this Bahagi"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-purple outline-none transition-all resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Display Image <span className="text-slate-400 text-xs">(optional)</span></label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🖼️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    {formData.image ? (
                      <div className="space-y-2">
                        <div className="text-sm text-green-400 font-bold">✅ Image uploaded</div>
                        <label className="flex flex-col gap-2">
                          <span className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm cursor-pointer transition-all">
                            🔄 Change Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            disabled={isUploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col gap-2">
                        <span className="px-4 py-2 bg-linear-to-r from-brand-purple to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all cursor-pointer">
                          📤 {isUploading ? 'Uploading...' : 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                    {isUploading && <p className="text-blue-400 text-xs mt-2">⏳ Uploading...</p>}
                    {errors.image && (
                      <div className="space-y-3 bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                        <div>
                          <p className="text-red-300 text-xs font-bold mb-1">⚠️ Upload Error</p>
                          <p className="text-red-400 text-xs leading-relaxed">{errors.image}</p>
                        </div>
                        {errors.image.includes('not properly set up') && (
                          <div className="flex gap-2">
                            <a 
                              href="https://jzuzdycorgdugpbidzyg.supabase.co/project/_/storage/buckets" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-all text-center"
                            >
                              🔗 Open Supabase Setup
                            </a>
                            <label className="flex-1">
                              <span className="block px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-all text-center">
                                🔄 Try Again
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file);
                                }}
                                disabled={isUploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                        {!errors.image.includes('not properly set up') && (
                          <label className="flex flex-col gap-2">
                            <span className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-all text-center">
                              🔄 Try Again
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                              }}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-brand-purple to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '💾 Creating...' : '✅ Create Bahagi'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
