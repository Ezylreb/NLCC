-- Create classes table for TeacherDashboardV2
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for teacher_id for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);

-- Create yunits table for class content
CREATE TABLE IF NOT EXISTS yunits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    media_url VARCHAR(1000),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for yunits
CREATE INDEX IF NOT EXISTS idx_yunits_lesson_id ON yunits(lesson_id);
CREATE INDEX IF NOT EXISTS idx_yunits_class_id ON yunits(class_id);
CREATE INDEX IF NOT EXISTS idx_yunits_teacher_id ON yunits(teacher_id);

-- Add columns to assessments table if they don't exist
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'multiple-choice',
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for assessments by class
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);

-- Add class_id to lessons table if it doesn't exist
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
