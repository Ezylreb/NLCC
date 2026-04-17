'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface AvatarCustomizationProps {
  studentId: string;
  onClose?: () => void;
}

export const AvatarCustomization: React.FC<AvatarCustomizationProps> = ({ studentId, onClose }) => {
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headTypes = ['round', 'square', 'oval', 'heart'];
  const eyesTypes = ['round', 'oval', 'cat', 'sparkle'];
  const mouthTypes = ['smile', 'grin', 'neutral', 'wow'];
  const clothingTypes = ['shirt', 'dress', 'tshirt', 'hoodie'];
  const hairTypes = ['short', 'long', 'curly', 'straight', 'afro'];
  const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#FF1744'];

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await apiClient.avatar.getAvatar(studentId);
        if (response.success && response.data) {
          setAvatar(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch avatar:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvatar();
  }, [studentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiClient.avatar.updateAvatar(studentId, avatar);
      
      if (result.success) {
        alert('✅ Avatar saved!');
      } else {
        throw new Error(result.error || 'Failed to save avatar');
      }
    } catch (error) {
      alert('❌ Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading avatar...</div>;
  }

  const previewAvatar = () => {
    return (
      <div className="w-32 h-40 bg-gradient-to-b from-blue-400 to-blue-200 rounded-2xl flex items-center justify-center relative overflow-hidden border-4 border-white shadow-xl">
        {/* Hair */}
        <div className={`absolute top-0 w-24 h-6 rounded-full ${
          avatar?.hair_type === 'curly' ? 'rounded-full' : 
          avatar?.hair_type === 'afro' ? 'w-28 h-8' : ''
        }`} style={{ backgroundColor: avatar?.hair_color, zIndex: 2 }} />

        {/* Head */}
        <div className={`w-16 h-16 rounded-full ${
          avatar?.head_type === 'square' ? 'rounded-lg' :
          avatar?.head_type === 'heart' ? '' : ''
        }`} style={{ backgroundColor: avatar?.head_color, zIndex: 3 }}>
          {/* Eyes */}
          <div className="flex justify-around pt-4">
            <div className={`w-2 h-2 rounded-full ${
              avatar?.eyes_type === 'sparkle' ? 'w-3 h-3' : ''
            }`} style={{ backgroundColor: '#000' }} />
            <div className={`w-2 h-2 rounded-full ${
              avatar?.eyes_type === 'sparkle' ? 'w-3 h-3' : ''
            }`} style={{ backgroundColor: '#000' }} />
          </div>

          {/* Mouth */}
          <div className="pt-2 text-center">
            {avatar?.mouth_type === 'smile' && '😊'}
            {avatar?.mouth_type === 'grin' && '😄'}
            {avatar?.mouth_type === 'neutral' && '😐'}
            {avatar?.mouth_type === 'wow' && '😮'}
          </div>
        </div>

        {/* Body */}
        <div className="w-12 h-16 rounded-lg mt-2" style={{ backgroundColor: avatar?.body_color, zIndex: 1 }} />

        {/* Clothing */}
        <div className="absolute top-12 w-12 h-10 rounded-lg opacity-75" style={{ backgroundColor: avatar?.clothing_color, zIndex: 2 }} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-4xl w-full max-h-96 overflow-y-auto border border-white/10"
      >
        <h2 className="text-3xl font-black text-white mb-6">✨ Customize Your Avatar</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6">{previewAvatar()}</div>
            <p className="text-slate-300 text-sm text-center">Your custom character</p>
          </div>

          {/* Customization Options */}
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Head Type */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Head Shape</label>
              <div className="flex gap-2">
                {headTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAvatar({ ...avatar, head_type: type })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      avatar?.head_type === type
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Head Color */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Head Color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setAvatar({ ...avatar, head_color: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      avatar?.head_color === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Eyes Type */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Eyes</label>
              <div className="flex gap-2">
                {eyesTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAvatar({ ...avatar, eyes_type: type })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      avatar?.eyes_type === type
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Mouth Type */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Expression</label>
              <div className="flex gap-2">
                {mouthTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAvatar({ ...avatar, mouth_type: type })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      avatar?.mouth_type === type
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Type */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Hair</label>
              <div className="flex gap-2">
                {hairTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAvatar({ ...avatar, hair_type: type })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      avatar?.hair_type === type
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Color */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Body Color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setAvatar({ ...avatar, body_color: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      avatar?.body_color === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Clothing Type */}
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Outfit</label>
              <div className="flex gap-2">
                {clothingTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setAvatar({ ...avatar, clothing_type: type })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      avatar?.clothing_type === type
                        ? 'bg-brand-purple text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Avatar'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
