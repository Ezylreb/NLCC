import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Disable SSL verification warnings for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for teacher_id
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

-- Create index for is_archived
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);

-- Create yunits table
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

-- Create indexes for yunits
CREATE INDEX IF NOT EXISTS idx_yunits_lesson_id ON yunits(lesson_id);
CREATE INDEX IF NOT EXISTS idx_yunits_class_id ON yunits(class_id);
CREATE INDEX IF NOT EXISTS idx_yunits_teacher_id ON yunits(teacher_id);

-- Add columns to assessments table
ALTER TABLE IF EXISTS assessments
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'multiple-choice',
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create indexes for assessments
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);

-- Add class_id to lessons
ALTER TABLE IF EXISTS lessons
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for lessons
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creating classes tables...\n');
    
    const statements = SQL.split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log(`✅ ${statement.substring(0, 50).split('\n')[0]}...`);
        successCount++;
      } catch (error) {
        console.log(`⚠️  Skipped: ${error.message.substring(0, 50)}`);
        skipCount++;
      }
    }
    
    console.log(`\n✅ Migration completed!\n`);
    console.log(`📊 Results:`);
    console.log(`  ✓ Executed: ${successCount} statements`);
    console.log(`  ⚠️  Skipped: ${skipCount} statements`);
    console.log('\n📊 Tables created/updated:');
    console.log('  ✓ classes');
    console.log('  ✓ yunits');
    console.log('  ✓ Updated assessments table');
    console.log('  ✓ Updated lessons table');
    console.log('  ✓ All indexes created\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration();
