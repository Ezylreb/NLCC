import { useState, useEffect } from 'react';

export interface Avatar {
  id?: number;
  student_id: string;
  head_type: string;
  head_color: string;
  eyes_type: string;
  mouth_type: string;
  hair_type: string;
  hair_color: string;
  body_color: string;
  clothing_type: string;
  clothing_color: string;
  accessories?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_AVATAR: Partial<Avatar> = {
  head_type: 'round',
  head_color: '#FFD700',
  eyes_type: 'round',
  mouth_type: 'smile',
  hair_type: 'short',
  hair_color: '#8B4513',
  body_color: '#FF6B6B',
  clothing_type: 'shirt',
  clothing_color: '#4CAF50',
  accessories: {}
};

export function useAvatar(studentId: string) {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/avatar?studentId=${studentId}`);
        if (!res.ok) throw new Error('Failed to fetch avatar');
        const data = await res.json();
        setAvatar(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAvatar({ student_id: studentId, ...DEFAULT_AVATAR } as Avatar);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAvatar();
    }
  }, [studentId]);

  // Update avatar property
  const updateAvatar = (updates: Partial<Avatar>) => {
    if (avatar) {
      setAvatar({ ...avatar, ...updates });
    }
  };

  // Save avatar to server
  const saveAvatar = async () => {
    if (!avatar) return false;

    try {
      const res = await fetch('/api/student/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          ...avatar
        })
      });

      if (!res.ok) throw new Error('Failed to save avatar');
      const data = await res.json();
      setAvatar(data);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save avatar';
      setError(message);
      return false;
    }
  };

  // Reset avatar to default
  const resetAvatar = () => {
    setAvatar({ student_id: studentId, ...DEFAULT_AVATAR } as Avatar);
  };

  return {
    avatar,
    loading,
    error,
    updateAvatar,
    saveAvatar,
    resetAvatar
  };
}
