-- Student Dashboard Database Schema
-- Run these migrations to set up the required tables for the student learning system

-- 1. Student Progress Table (tracks yunit completion and scoring)
CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bahagi_id INT NOT NULL REFERENCES bahagis(id) ON DELETE CASCADE,
    yunit_id INT NOT NULL REFERENCES yunits(id) ON DELETE CASCADE,
    score_percentage INT DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    xp_earned INT DEFAULT 0,
    coins_earned INT DEFAULT 0,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, yunit_id)
);

-- 2. Bahagi Unlock Table (tracks which bahagis are unlocked for each student)
CREATE TABLE IF NOT EXISTS bahagi_unlocks (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bahagi_id INT NOT NULL REFERENCES bahagis(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, bahagi_id)
);

-- 3. Add yunit_id to bahagi_assessment if not exists
ALTER TABLE bahagi_assessment ADD COLUMN IF NOT EXISTS yunit_id INT REFERENCES yunits(id) ON DELETE CASCADE;

-- 4. Add reward columns to yunits
ALTER TABLE yunits ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 0;
ALTER TABLE yunits ADD COLUMN IF NOT EXISTS coins_reward INT DEFAULT 0;

-- 5. Bahagi Reward Table (alternative structure for rewards)
CREATE TABLE IF NOT EXISTS bahagi_reward (
    id SERIAL PRIMARY KEY,
    yunit_id INT NOT NULL REFERENCES yunits(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL, -- 'xp' or 'coins'
    amount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(yunit_id, reward_type)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_yunit_id ON student_progress(yunit_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_bahagi_id ON student_progress(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_unlocks_student_id ON bahagi_unlocks(student_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_unlocks_bahagi_id ON bahagi_unlocks(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_assessment_yunit_id ON bahagi_assessment(yunit_id);
CREATE INDEX IF NOT EXISTS idx_bahagi_reward_yunit_id ON bahagi_reward(yunit_id);
CREATE INDEX IF NOT EXISTS idx_yunits_bahagi_id ON yunits(bahagi_id);

-- 7. Ensure users table has xp and coins columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INT DEFAULT 0;
