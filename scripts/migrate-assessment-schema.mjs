import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Allow self-signed certificates for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Try DIRECT_URL first (for Supabase), then DATABASE_URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please ensure .env.local or .env file exists with DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📋 Running assessment schema migration...\n');

    // 1. Check if bahagi_assessment table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bahagi_assessment'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ bahagi_assessment table does not exist. Please create it first.');
      return;
    }

    console.log('✅ bahagi_assessment table exists');

    // 2. Add missing columns to bahagi_assessment
    const requiredColumns = [
      'lesson_id INTEGER',
      'options JSONB',
      'correct_answer JSONB',
      'points INTEGER DEFAULT 10',
      'content JSONB',
      'assessment_order INTEGER DEFAULT 0',
      'is_published BOOLEAN DEFAULT true',
      'is_archived BOOLEAN DEFAULT false',
      'updated_at TIMESTAMP DEFAULT NOW()'
    ];

    for (const col of requiredColumns) {
      const colName = col.split(' ')[0];
      const colTypeCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'bahagi_assessment' AND column_name = $1
        )
      `, [colName]);

      if (!colTypeCheck.rows[0].exists) {
        try {
          await client.query(`
            ALTER TABLE bahagi_assessment 
            ADD COLUMN ${col}
          `);
          console.log(`✅ Added column: ${colName}`);
        } catch (e) {
          console.log(`⚠️  Could not add column ${colName}: ${e.message}`);
        }
      } else {
        console.log(`✅ Column already exists: ${colName}`);
      }
    }

    // 3. Create assessment_questions table
    const questionsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'assessment_questions'
      )
    `);

    if (!questionsTableCheck.rows[0].exists) {
      await client.query(`
        CREATE TABLE assessment_questions (
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
        )
      `);
      console.log('✅ Created assessment_questions table');
    } else {
      console.log('✅ assessment_questions table already exists');
    }

    // 4. Create assessment_options table
    const optionsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'assessment_options'
      )
    `);

    if (!optionsTableCheck.rows[0].exists) {
      await client.query(`
        CREATE TABLE assessment_options (
          id SERIAL PRIMARY KEY,
          question_id INTEGER NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
          option_order INTEGER NOT NULL,
          option_text TEXT NOT NULL,
          option_media JSONB,
          is_correct BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created assessment_options table');
    } else {
      console.log('✅ assessment_options table already exists');
    }

    // 5. Create indexes
    const indexQueries = [
      {
        name: 'idx_assessment_questions_assessment_id',
        query: 'CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id)'
      },
      {
        name: 'idx_assessment_questions_order',
        query: 'CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON assessment_questions(assessment_id, question_order)'
      },
      {
        name: 'idx_assessment_options_question_id',
        query: 'CREATE INDEX IF NOT EXISTS idx_assessment_options_question_id ON assessment_options(question_id)'
      },
      {
        name: 'idx_assessment_options_order',
        query: 'CREATE INDEX IF NOT EXISTS idx_assessment_options_order ON assessment_options(question_id, option_order)'
      },
      {
        name: 'idx_bahagi_assessment_lesson_id',
        query: 'CREATE INDEX IF NOT EXISTS idx_bahagi_assessment_lesson_id ON bahagi_assessment(lesson_id)'
      },
      {
        name: 'idx_bahagi_assessment_published',
        query: 'CREATE INDEX IF NOT EXISTS idx_bahagi_assessment_published ON bahagi_assessment(is_published)'
      }
    ];

    for (const idx of indexQueries) {
      try {
        await client.query(idx.query);
        console.log(`✅ Created index: ${idx.name}`);
      } catch (e) {
        console.log(`⚠️  Index ${idx.name} already exists or error: ${e.message}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Assessment schema is now ready for all assessment types:');
    console.log('   - Multiple Choice');
    console.log('   - Short Answer');
    console.log('   - Checkbox (Multiple Answers)');
    console.log('   - Audio Recording');
    console.log('   - Scramble Word');
    console.log('   - Matching Pairs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
