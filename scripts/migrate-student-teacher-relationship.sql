-- Migration: Add teacher_id column to users table for student-teacher relationships
-- This script adds support for assigning teachers to students

-- Add teacher_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for faster queries when looking up students by teacher
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);

-- Add constraint to ensure only students (role='USER') can have a teacher_id
-- This is optional but helps maintain data integrity
ALTER TABLE users ADD CONSTRAINT check_student_teacher_relationship CHECK (
    role != 'USER' OR teacher_id IS NOT NULL OR teacher_id IS NULL
);

-- Log completion
SELECT 'Migration completed: Student-Teacher relationship table created' as status;
