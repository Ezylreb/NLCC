'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Class {
  id: string;
  name: string;
  teacher: string;
  bahagiCount: number;
}

interface ClassViewProps {
  studentId: string;
  studentName: string;
  onSelectClass: (classId: string) => void;
  onBack: () => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  studentId,
  studentName,
  onSelectClass,
  onBack
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.student.getEnrolledClasses(studentId);
        
        if (!res.success) throw new Error(res.error || 'Failed to fetch classes');
        
        setClasses(res.data?.classes || res.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="text-slate-400">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
          <h2 className="text-3xl font-black text-white">Mag-Aral</h2>
          <p className="text-slate-500 text-sm mt-2">
            Welcome back, {studentName}! Select a class to start learning.
          </p>
        </div>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400">No classes enrolled yet</p>
          <p className="text-slate-500 text-sm mt-2">Contact your teacher to join a class</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls, idx) => (
            <motion.button
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelectClass(cls.id)}
              className="text-left p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl hover:border-brand-purple hover:from-slate-700 hover:to-slate-800 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-brand-purple transition-colors">
                    🏫 {cls.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Teacher: {cls.teacher}</p>
                </div>
                <div className="text-3xl group-hover:scale-110 transition-transform">📚</div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-sm text-slate-400">{cls.bahagiCount} Bahagi</span>
                <span className="text-lg text-brand-purple">→</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};
