-- Lessons/Bahagi Management Schema
CREATE TABLE IF NOT EXISTS bahagis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  display_order INT DEFAULT 0,
  is_open BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Yunit (Lessons) within each Bahagi
CREATE TABLE IF NOT EXISTS yunits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bahagi_id UUID NOT NULL REFERENCES bahagis(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  content_guide TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assessments/Misyon for each Yunit
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yunit_id UUID NOT NULL REFERENCES yunits(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  assessment_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'audio_input', 'drag_drop', 'matching'
  question_data JSONB, -- Stores questions/options in JSON format
  xp_reward INT DEFAULT 10,
  coins_reward INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assessment Responses (student answers)
CREATE TABLE IF NOT EXISTS assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_data JSONB, -- Student's answers
  is_correct BOOLEAN,
  score INT,
  attempted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Student XP and Coins Rewards
CREATE TABLE IF NOT EXISTS student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id),
  yunit_id UUID REFERENCES yunits(id),
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Avatar Customization
CREATE TABLE IF NOT EXISTS avatar_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  head_type VARCHAR(50) DEFAULT 'default',
  head_color VARCHAR(7) DEFAULT '#FFD700',
  eyes_type VARCHAR(50) DEFAULT 'default',
  mouth_type VARCHAR(50) DEFAULT 'default',
  body_color VARCHAR(7) DEFAULT '#4CAF50',
  clothing_type VARCHAR(50) DEFAULT 'default',
  clothing_color VARCHAR(7) DEFAULT '#2196F3',
  accessories JSONB DEFAULT '[]',
  hair_type VARCHAR(50) DEFAULT 'default',
  hair_color VARCHAR(7) DEFAULT '#8B4513',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trophies/Achievements
CREATE TABLE IF NOT EXISTS trophies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_type VARCHAR(50) NOT NULL, -- 'first_lesson', 'perfect_score', 'streak', etc.
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '🏆',
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bahagis_teacher ON bahagis(teacher_id);
CREATE INDEX IF NOT EXISTS idx_yunits_bahagi ON yunits(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_assessments_yunit ON assessments(yunit_id);
CREATE INDEX IF NOT EXISTS idx_responses_student ON assessment_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_rewards_student ON student_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_trophies_student ON trophies(student_id);
