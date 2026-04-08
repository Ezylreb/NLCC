-- Create Bahagi (Course Section) Table
CREATE TABLE IF NOT EXISTS bahagi (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    yunit VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create updated Lesson Table (with Bahagi reference)
CREATE TABLE IF NOT EXISTS lesson (
    id SERIAL PRIMARY KEY,
    bahagi_id INT REFERENCES bahagi(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    discussion TEXT,
    lesson_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Assessment Table
CREATE TABLE IF NOT EXISTS bahagi_assessment (
    id SERIAL PRIMARY KEY,
    bahagi_id INT REFERENCES bahagi(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'multiple-choice', 'audio', 'drag-drop', 'matching'
    title VARCHAR(255),
    content JSONB, -- Stores flex content based on type
    assessment_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Reward Table
CREATE TABLE IF NOT EXISTS bahagi_reward (
    id SERIAL PRIMARY KEY,
    bahagi_id INT REFERENCES bahagi(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL, -- 'xp' or 'coins'
    amount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Lesson Progress Table (for students)
CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lesson(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP,
    xp_earned INT DEFAULT 0,
    coins_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)
);

-- Create Assessment Response Table (for tracking student responses)
CREATE TABLE IF NOT EXISTS assessment_response (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INT REFERENCES bahagi_assessment(id) ON DELETE CASCADE,
    response JSONB, -- Stores the student's response
    is_correct BOOLEAN,
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bahagi_teacher_id ON bahagi(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_class_name ON bahagi(class_name);
CREATE INDEX IF NOT EXISTS idx_lesson_bahagi_id ON lesson(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_assessment_bahagi_id ON bahagi_assessment(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_reward_bahagi_id ON bahagi_reward(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessment_response_student_id ON assessment_response(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_response_assessment_id ON assessment_response(assessment_id);
