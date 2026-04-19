/**
 * Unified Database Types
 * Central location for all database entity types
 */

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  lrn?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  class_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Bahagi {
  id: string;
  title: string;
  yunit: string;
  image_url?: string;
  icon_type?: string;
  custom_icon_url?: string;
  description?: string;
  quarter?: string;
  week_number?: number;
  module_number?: string;
  teacher_id: string;
  class_name?: string;
  is_open: boolean;
  is_published: boolean;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Lesson {
  id: string;
  bahagi_id: string;
  title: string;
  subtitle?: string;
  discussion?: string;
  media_url?: string;
  audio_url?: string;
  lesson_order?: number;
  is_published: boolean;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BahagiAssessment {
  id: string;
  bahagi_id: string;
  lesson_id?: string;
  title: string;
  type: 'multiple-choice' | 'short-answer' | 'checkbox' | 'audio' | 'matching' | 'scramble-word';
  content?: Record<string, any>;
  options?: Record<string, any>;
  correct_answer?: Record<string, any>;
  points: number;
  assessment_order?: number;
  is_published: boolean;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
  // Aliases for backward compatibility in service code
  assessment_type?: string;
  correct_answers?: Record<string, any>;
  description?: string;
}

export interface YunitAnswer {
  id: string;
  yunit_id: string;
  assessment_id: string;
  student_id: string;
  student_answer: any;
  is_correct: boolean;
  points_earned: number;
  assessment_type: string;
  attempt_number: number;
  submitted_at: Date;
}

export interface StudentReward {
  id: string;
  student_id: string;
  assessment_id?: string;
  yunit_id?: string;
  xp_earned: number;
  coins_earned: number;
  reward_type: 'xp' | 'coins' | 'badge';
  earned_at: Date;
}

export interface Trophy {
  id: string;
  student_id: string;
  trophy_type: string;
  title: string;
  icon: string;
  earned_at: Date;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
}

export interface RepositoryOptions {
  orderBy?: string;
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
}
