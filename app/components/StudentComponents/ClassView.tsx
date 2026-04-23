'use client';

import React, { useState, useEffect, memo } from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Class {
  id: string;
  name: string;
  teacher: string;
  teacherId: string;
  bahagiCount: number;
}

interface ClassViewProps {
  studentId: string;
  studentName: string;
  cachedData?: any; // Pre-fetched classes data
  onDataFetched?: (data: any) => void; // Callback to cache fetched data
  onSelectClass: (classId: string, teacherId: string, className: string, teacherName: string) => void;
  onBack: () => void;
}

const ClassViewComponent: React.FC<ClassViewProps> = ({
  studentId,
  studentName,
  cachedData,
  onDataFetched,
  onSelectClass,
  onBack
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(!cachedData); // Don't show loading if we have cached data
  const [error, setError] = useState<string | null>(null);

  // Use cached data immediately if available
  useEffect(() => {
    if (cachedData) {
      console.log('🎓 [ClassView] Using cached data');
      setClasses(cachedData.classes || cachedData.data?.classes || cachedData.data || []);
      setIsLoading(false);
      return;
    }
  }, [cachedData]);

  useEffect(() => {
    // Skip fetching if we already have cached data
    if (cachedData) {
      return;
    }

    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.student.getEnrolledClasses(studentId);
        
        if (!res.success) throw new Error(res.error || 'Failed to fetch classes');
        
        const fetchedClasses = res.data?.classes || res.data || [];
        setClasses(fetchedClasses);
        
        // Cache the fetched data
        if (onDataFetched) {
          onDataFetched(res);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [studentId, cachedData, onDataFetched]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
        {/* Skeleton Header */}
        <div className="animate-pulse">
          <div className="h-10 bg-slate-800/50 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-800/50 rounded w-64"></div>
        </div>

        {/* Skeleton Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-1/2 ml-8"></div>
                </div>
                <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="h-4 bg-slate-700/50 rounded w-20"></div>
                <div className="h-6 bg-slate-700/50 rounded w-6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
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
              onClick={() => onSelectClass(cls.id, cls.teacherId, cls.name, cls.teacher)}
              className="text-left p-6 bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl hover:border-brand-purple hover:from-slate-700 hover:to-slate-800 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎓</span>
                    <h3 className="font-black text-xl text-white group-hover:text-brand-purple transition-colors">
                      {cls.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 ml-8">
                    👨‍🏫 Teacher: {cls.teacher}
                  </p>
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

export const ClassView = memo(ClassViewComponent);
