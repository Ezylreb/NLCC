-- Migration: Add class_id foreign key and enhance student-teacher-class relationships
-- This migration properly links students to classes through the classes table

-- Add class_id column to users table for proper class relationships
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);

-- Note: class_name column is kept for backwards compatibility
-- The primary relationship is now through class_id foreign key

-- Verify the migration
SELECT 'Migration completed: Student-Class relationship added' as status;
