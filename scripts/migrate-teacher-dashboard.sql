-- Add classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add yunits table
CREATE TABLE IF NOT EXISTS yunits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Update assessments table to support different types
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'multiple-choice';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS questions JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);
CREATE INDEX IF NOT EXISTS idx_yunits_lesson_id ON yunits(lesson_id);
CREATE INDEX IF NOT EXISTS idx_yunits_class_id ON yunits(class_id);
CREATE INDEX IF NOT EXISTS idx_yunits_teacher_id ON yunits(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_lesson_id ON assessments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);

-- Update lessons table to include class_id if not exists
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
