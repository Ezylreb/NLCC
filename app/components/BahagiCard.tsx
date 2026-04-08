'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BahagiCardProps {
  id: string;
  title: string;
  yunit: string;
  image: string;
  description: string;
  isOpen: boolean;
  lessonCount: number;
  assessmentCount: number;
  totalXP: number;
  onEdit: () => void;
  onToggleStatus: (newStatus: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  onOpenEditor: () => void;
}

export const BahagiCard: React.FC<BahagiCardProps> = ({
  id,
  title,
  yunit,
  image,
  description,
  isOpen,
  lessonCount,
  assessmentCount,
  totalXP,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenEditor
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await onToggleStatus(!isOpen);
      setShowMenu(false);
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this Bahagi? This cannot be undone.')) {
      setIsLoading(true);
      try {
        await onDelete();
      } catch (err) {
        console.error('Error deleting:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-linear-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group"
    >
      {/* Image Container */}
      <div className="relative h-40 bg-slate-950 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
          isOpen
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {isOpen ? '🔓 Open' : '🔒 Archived'}
        </div>

        {/* Menu Button */}
        <div className="absolute top-3 left-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all"
          >
            ⋮
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-0 bg-slate-900 border border-white/20 rounded-lg shadow-lg z-20 min-w-max"
            >
              <button
                onClick={() => {
                  onOpenEditor();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all text-sm font-bold"
              >
                ✏️ Edit Content
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all text-sm font-bold border-t border-white/10"
              >
                {isOpen ? '🔒 Archive' : '🔓 Open'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold border-t border-white/10"
              >
                🗑️ Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title and Yunit */}
        <div>
          <h3 className="text-lg font-black text-white line-clamp-2">{title}</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{yunit}</p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <div className="text-lg font-black text-brand-purple">{lessonCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-blue-400">{assessmentCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Assessments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-yellow-400">⭐ {totalXP}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">XP</div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => {
            onOpenEditor();
            setShowMenu(false);
          }}
          disabled={!isOpen}
          className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
            isOpen
              ? 'bg-linear-to-r from-brand-purple to-purple-600 text-white hover:shadow-lg'
              : 'bg-white/5 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isOpen ? '📝 Edit Content' : 'Archived'}
        </button>
      </div>
    </motion.div>
  );
};
