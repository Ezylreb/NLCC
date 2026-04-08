#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ POSTGRES_URL not set in .env.local');
  process.exit(1);
}

if (!connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
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

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yunit_id UUID NOT NULL REFERENCES yunits(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  assessment_type VARCHAR(50) NOT NULL,
  question_data JSONB,
  xp_reward INT DEFAULT 10,
  coins_reward INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_data JSONB,
  is_correct BOOLEAN,
  score INT,
  attempted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id),
  yunit_id UUID REFERENCES yunits(id),
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  earned_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS trophies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '🏆',
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bahagis_teacher ON bahagis(teacher_id);
CREATE INDEX IF NOT EXISTS idx_yunits_bahagi ON yunits(bahagi_id);
CREATE INDEX IF NOT EXISTS idx_assessments_yunit ON assessments(yunit_id);
CREATE INDEX IF NOT EXISTS idx_responses_student ON assessment_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_rewards_student ON student_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_trophies_student ON trophies(student_id);
`;

async function initializeSchema() {
  try {
    console.log('🚀 Initializing lesson schema...');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✅ Schema initialized successfully!');
    console.log('\n📊 Tables created:');
    console.log('  • bahagis - Lesson chapters');
    console.log('  • yunits - Individual lessons');
    console.log('  • assessments - Tests and quizzes');
    console.log('  • assessment_responses - Student answers');
    console.log('  • student_rewards - XP and coins earned');
    console.log('  • avatar_customization - Character skins');
    console.log('  • trophies - Achievements');
    
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeSchema();
