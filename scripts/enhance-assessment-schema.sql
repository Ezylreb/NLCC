-- ==========================================
-- Assessment Schema Enhancement
-- Adds support for storing all assessment types
-- ==========================================

-- 1. Ensure bahagi_assessment table has all required columns
ALTER TABLE IF EXISTS bahagi_assessment
ADD COLUMN IF NOT EXISTS lesson_id INTEGER,
ADD COLUMN IF NOT EXISTS options JSONB,
ADD COLUMN IF NOT EXISTS correct_answer JSONB,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS content JSONB,
ADD COLUMN IF NOT EXISTS assessment_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Create assessment_questions table for normalized question storage
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES bahagi_assessment(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN (
        'multiple-choice', 'short-answer', 'checkbox', 
        'audio', 'scramble-word', 'matching'
    )),
    options JSONB,
    correct_answer JSONB,
    instructions TEXT,
    xp INTEGER DEFAULT 10,
    coins INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create assessment_options table for option storage
CREATE TABLE IF NOT EXISTS assessment_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_media JSONB,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(assessment_id, question_order);
CREATE INDEX IF NOT EXISTS idx_assessment_options_question_id ON assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_options_order ON assessment_options(question_id, option_order);
CREATE INDEX IF NOT EXISTS idx_bahagi_assessment_lesson_id ON bahagi_assessment(lesson_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_assessment_published ON bahagi_assessment(is_published);

-- 5. Add comments for clarity
COMMENT ON TABLE assessment_questions IS 'Individual questions within an assessment';
COMMENT ON TABLE assessment_options IS 'Answer options for multiple choice and checkbox questions';
COMMENT ON COLUMN assessment_questions.options IS 'JSONB array of options for the question';
COMMENT ON COLUMN assessment_questions.correct_answer IS 'JSONB of correct answer(s) for validation';
COMMENT ON COLUMN assessment_options.option_media IS 'JSONB of media files (images, audio) for the option';
