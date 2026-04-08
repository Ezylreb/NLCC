'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
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
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'lesson' | 'game'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isSignupEnabled, setIsSignupEnabled] = useState(true);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  React.useEffect(() => {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('nllc_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
        if (userData.role === 'ADMIN') setIsAdmin(true);
        if (userData.role === 'TEACHER') setIsTeacher(true);
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
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setIsMaintenance(data.maintenance_mode);
          setIsSignupEnabled(data.signup_enabled !== false);
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
    setIsAdmin(false);
    setIsTeacher(false);
    setUser(null);
    setView('landing');
    setActiveLessonId(null);
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={() => {
          if (isLoggedIn) setView('app');
          else {
            setAuthMode('login');
            setView('auth');
          }
        }}
        onLogin={() => {
          setAuthMode('login');
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
      <AuthPage
        initialMode={authMode}
        isSignupEnabled={isSignupEnabled} 
        onAuthSuccess={(userData) => {
          setIsLoggedIn(true);
          if (userData && typeof userData === 'object') {
            const userObj = userData as { firstName: string; lastName: string; email: string; role?: string; id?: string };
            setUser(userObj);
            localStorage.setItem('nllc_user', JSON.stringify(userObj));
            if (userObj.role === 'ADMIN') setIsAdmin(true);
            if (userObj.role === 'TEACHER') setIsTeacher(true);
          } else if (userData === true) {
            setIsAdmin(true);
            localStorage.setItem('nllc_user', JSON.stringify({ firstName: 'Admin', lastName: 'User', role: 'ADMIN' }));
          }
          setView('app');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Teacher Dashboard
  if (isTeacher) {
    return <TeacherDashboardV2 user={user} onLogout={handleLogout} />;
  }

  // Game/Assessment Page
  if (view === 'game') {
    return <GamePages onBack={() => setView('app')} />;
  }

  // Lesson Detail Page
  if (view === 'lesson' && activeLessonId) {
    return (
      <LessonDetailPage
        lessonId={activeLessonId}
        onBack={() => {
          setView('app');
          setActiveLessonId(null);
        }}
        onStartGame={() => {
          setView('game');
        }}
      />
    );
  }

  // Student Dashboard
  if (isLoggedIn && !isAdmin && !isTeacher) {
    return (
      <StudentDashboard
        user={user}
        onLogout={handleLogout}
        onStartLesson={(lessonId: string) => {
          setActiveLessonId(lessonId);
          setView('lesson');
        }}
      />
    );
  }

  // Default: go to landing
  return <LandingPage
    onStart={() => {
      if (isLoggedIn) setView('app');
      else {
        setAuthMode('login');
        setView('auth');
      }
    }}
    onLogin={() => {
      setAuthMode('login');
      setView('auth');
    }}
  />;
}
