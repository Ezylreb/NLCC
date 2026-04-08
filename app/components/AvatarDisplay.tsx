'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AvatarDisplayProps {
  studentId: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onAvatarClick?: () => void;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  studentId,
  size = 'md',
  clickable = false,
  onAvatarClick
}) => {
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40'
  };

  const hairSizeClasses = {
    sm: 'w-14 h-4',
    md: 'w-20 h-5',
    lg: 'w-24 h-6'
  };

  const headSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const bodySizeClasses = {
    sm: 'w-8 h-10',
    md: 'w-12 h-14',
    lg: 'w-14 h-16'
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`/api/student/avatar?studentId=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setAvatar(data);
        }
      } catch (error) {
        console.error('Failed to fetch avatar:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAvatar();
    }
  }, [studentId]);

  if (loading || !avatar) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-700 rounded-lg animate-pulse`} />
    );
  }

  const containerClass = `${sizeClasses[size]} bg-gradient-to-b from-blue-400 to-blue-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border-4 border-white shadow-xl ${
    clickable ? 'cursor-pointer hover:shadow-2xl transition-all' : ''
  }`;

  const renderAvatar = () => (
    <>
      {/* Hair */}
      <div
        className={`absolute top-0 rounded-full ${hairSizeClasses[size]}`}
        style={{
          backgroundColor: avatar?.hair_color || '#8B4513',
          width:
            avatar?.hair_type === 'afro'
              ? '120%'
              : avatar?.hair_type === 'curly'
                ? '100%'
                : '80%',
          zIndex: 2
        }}
      />

      {/* Head */}
      <div
        className={`${headSizeClasses[size]} flex flex-col items-center justify-center z-3 relative rounded-full`}
        style={{
          backgroundColor: avatar?.head_color || '#FFD700'
        }}
      >
        {/* Eyes */}
        <div className="flex justify-around w-full px-2">
          <div
            className={`rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
            style={{ backgroundColor: '#000' }}
          />
          <div
            className={`rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
            style={{ backgroundColor: '#000' }}
          />
        </div>

        {/* Mouth */}
        <div className={`${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
          {avatar?.mouth_type === 'smile' && '😊'}
          {avatar?.mouth_type === 'grin' && '😄'}
          {avatar?.mouth_type === 'neutral' && '😐'}
          {avatar?.mouth_type === 'wow' && '😮'}
        </div>
      </div>

      {/* Body */}
      <div
        className={`${bodySizeClasses[size]} rounded-lg z-1`}
        style={{
          backgroundColor: avatar?.body_color || '#FF6B6B'
        }}
      />

      {/* Clothing overlay */}
      <div
        className={`absolute top-2/3 w-2/3 h-1/3 rounded-lg opacity-70 z-2`}
        style={{
          backgroundColor: avatar?.clothing_color || '#4CAF50'
        }}
      />
    </>
  );

  return clickable ? (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAvatarClick}
      className={containerClass}
    >
      {renderAvatar()}
    </motion.div>
  ) : (
    <div className={containerClass}>{renderAvatar()}</div>
  );
};
