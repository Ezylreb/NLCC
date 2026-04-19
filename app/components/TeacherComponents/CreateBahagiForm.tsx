'use client';

import React, { useState } from 'react';

interface CreateBahagiFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  classId: string;
  className: string;
  isLoading?: boolean;
}

export const CreateBahagiForm: React.FC<CreateBahagiFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classId,
  className,
  isLoading = false
}) => {
  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState('First');
  const [weekNumber, setWeekNumber] = useState('');
  const [moduleNumber, setModuleNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a Bahagi title');
      return;
    }

    const data = {
      title,
      quarter,
      week_number: weekNumber ? parseInt(weekNumber) : undefined,
      module_number: moduleNumber,
      classId,
      className
    };

    onSubmit(data);
    setTitle('');
    setQuarter('First');
    setWeekNumber('');
    setModuleNumber('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Add Bahagi</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
          Create a new lesson section for {className}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Quarter *
            </label>
            <select
              required
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all"
            >
              <option value="First">First Quarter</option>
              <option value="Second">Second Quarter</option>
              <option value="Third">Third Quarter</option>
              <option value="Fourth">Fourth Quarter</option>
            </select>
          </div>

          {/* Week Number and Module Number - Horizontal */}
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
              Bahagi Title (e.g., "Bahagi 1: Ang Ating Bansa")
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter bahagi title..."
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
              autoFocus
            />
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
                  Creating...
                </>
              ) : (
                <>
                  <span>📚</span> Create Bahagi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
