'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboardV2 } from './components/TeacherDashboardV2';
import { StudentDashboard } from './components/StudentDashboard';
import { LessonDetailPage } from './components/LessonDetailPage';
import { GamePages } from './components/GamePages';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  id?: string;
  role?: string;
  class_name?: string;
}

export default function Home() {
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'lesson' | 'game'>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('nllc_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
        setView('app');
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('nllc_user');
      }
    }
    setIsSessionLoaded(true);

    // Fetch settings
    const fetchSettings = async () => {
      try {
        const response = await apiClient.admin.getSettings();
        if (response.success && response.data) {
          setIsMaintenance(response.data.maintenance_mode);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  if (!isSessionLoaded) return <div className="min-h-screen bg-slate-950" />;

  const handleLogout = () => {
    localStorage.removeItem('nllc_user');
    setIsLoggedIn(false);
    setUser(null);
    setView('auth');
    setActiveLessonId(null);
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={() => {
          if (isLoggedIn) setView('app');
          else setView('auth');
        }}
        onLogin={() => {
          setView('auth');
        }}
      />
    );
  }

  if (view === 'auth') {
    if (isMaintenance && !isAdmin) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-32 h-32 bg-brand-purple/20 rounded-full flex items-center justify-center text-6xl animate-pulse mb-8 border-4 border-brand-purple/30">???</div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Kasalukuyang Inaayos ??</h1>
          <p className="text-slate-400 font-bold max-w-sm leading-relaxed mb-10">Paumanhin! Ang NLLC ay kasalukuyang sumasailalim sa maintenance para sa mas magandang karanasan. Balik na lang maya-maya!</p>
          <button 
            onClick={() => setView('landing')}
            className="px-8 py-3 bg-brand-purple text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
          >
            Bumalik sa Simula
          </button>
        </div>
      );
    }
    return (
      <LoginPage
        onAuthSuccess={(userData) => {
          if (userData && typeof userData === 'object') {
            const userObj = userData as { firstName: string; lastName: string; email: string; role?: string; id?: string };
            setUser(userObj);
            setIsLoggedIn(true);
            localStorage.setItem('nllc_user', JSON.stringify(userObj));
            // Trigger immediate redirect to app view
            setView('app');
          }
        }}
        onBack={() => {
          setView('landing');
        }}
      />
    );
  }

  if (view === 'app') {
    // Role-based auto-redirect
    if (!user) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-xl font-bold mb-4">Loading...</p>
          </div>
        </div>
      );
    }

    // Auto-redirect based on role from database
    switch (user.role?.toUpperCase()) {
      case 'ADMIN':
        return (
          <AdminDashboard
            onLogout={handleLogout}
          />
        );
      
      case 'TEACHER':
        return (
          <TeacherDashboardV2
            onLogout={handleLogout}
            user={user}
          />
        );
      
      case 'STUDENT':
      default:
        if (activeLessonId) {
          return (
            <GamePages
              onBack={() => setActiveLessonId(null)}
            />
          );
        }
        return (
          <StudentDashboard
            onLogout={handleLogout}
            onStartLesson={(lessonId) => {
              setActiveLessonId(lessonId);
            }}
            user={user}
          />
        );
    }
  }

  if (view === 'lesson') {
    return (
      <LessonDetailPage
        lessonId={activeLessonId || ''}
        onBack={() => setView('app')}
        onStartGame={() => setView('game')}
      />
    );
  }

  return <div className="min-h-screen bg-slate-950" />;
}
