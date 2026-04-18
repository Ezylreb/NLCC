'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

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
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-full h-full min-h-[500px]'
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await apiClient.avatar.getAvatar(studentId);
        if (response.success && response.data) {
          // Parse JSONB fields if they're strings
          const avatarData = response.data;
          const parsedAvatar: any = {};
          
          const fields = ['katawan', 'hair', 'eyes', 'mouth', 'damit', 'pants', 'shoes', 'accessory'];
          fields.forEach(field => {
            if (avatarData[field]) {
              try {
                parsedAvatar[field] = typeof avatarData[field] === 'string' 
                  ? JSON.parse(avatarData[field]) 
                  : avatarData[field];
              } catch (e) {
                console.error(`Error parsing ${field}:`, e);
              }
            }
          });
          
          setAvatar(parsedAvatar);
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

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-700 rounded-lg animate-pulse`} />
    );
  }

  if (!avatar || Object.keys(avatar).length === 0) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-700 rounded-lg flex items-center justify-center`}>
        <div className="text-4xl">😊</div>
      </div>
    );
  }

  // Layer order for proper rendering
  const renderOrder: string[] = ['katawan', 'pants', 'damit', 'shoes', 'accessory', 'mouth', 'eyes', 'hair'];

  const containerClass = `${sizeClasses[size]} relative ${
    clickable ? 'cursor-pointer hover:opacity-90 transition-all' : ''
  }`;

  const renderAvatar = () => (
    <div className="w-full h-full relative">
      {renderOrder.map((key) => {
        const part = avatar[key];
        if (!part?.src) return null;

        return (
          <img
            key={key}
            src={part.src}
            alt={part.name || key}
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: renderOrder.indexOf(key) }}
          />
        );
      })}
    </div>
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
