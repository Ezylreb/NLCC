#!/usr/bin/env node

// Migration script to fix yunits and assessments tables for teacher dashboard
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Pool } = pg;

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL not set');
  process.exit(1);
}

// Add libpqcompat for SSL compatibility
if (!connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('🔄 Starting yunits and assessments migration...\n');

  const client = await pool.connect();

  try {
    // Step 1: Create/verify yunits table for teacher dashboard
    console.log('📝 Checking yunits table...');
    const yunitsTableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='yunits'
    `);
    
    if (yunitsTableCheck.rows.length === 0) {
      console.log('  Creating yunits table...');
      await client.query(`
        CREATE TABLE yunits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          content TEXT,
          media_url VARCHAR(500),
          lesson_id VARCHAR(255) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ yunits table created');
    } else {
      console.log('  ✅ yunits table exists');
      
      // Check for missing columns
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='yunits'
      `);
      
      const existingColumns = columns.rows.map(r => r.column_name);
      console.log(`  Found columns: ${existingColumns.join(', ')}`);
      
      const requiredColumns = {
        'content': "TEXT",
        'media_url': "VARCHAR(500)",
        'lesson_id': "VARCHAR(255)",
        'class_id': "UUID",
        'teacher_id': "UUID"
      };
      
      for (const [colName, colType] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(colName)) {
          console.log(`  Adding ${colName} column...`);
          await client.query(`
            ALTER TABLE yunits ADD COLUMN ${colName} ${colType}
          `);
          console.log(`  ✅ Added ${colName} column`);
        }
      }
    }
    
    // Step 2: Create/verify assessments table
    console.log('\n📝 Checking assessments table...');
    const assessmentsTableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='assessments'
    `);
    
    if (assessmentsTableCheck.rows.length === 0) {
      console.log('  Creating assessments table...');
      await client.query(`
        CREATE TABLE assessments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          instructions TEXT,
          reward INT DEFAULT 10,
          lesson_id VARCHAR(255) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          questions JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ assessments table created');
    } else {
      console.log('  ✅ assessments table exists');
      
      // Check for missing columns
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='assessments'
      `);
      
      const existingColumns = columns.rows.map(r => r.column_name);
      console.log(`  Found columns: ${existingColumns.join(', ')}`);
      
      const requiredColumns = {
        'type': "VARCHAR(50)",
        'instructions': "TEXT",
        'reward': "INT",
        'lesson_id': "VARCHAR(255)",
        'class_id': "UUID",
        'teacher_id': "UUID",
        'questions': "JSONB"
      };
      
      for (const [colName, colType] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(colName)) {
          console.log(`  Adding ${colName} column...`);
          if (colName === 'lesson_id' && !existingColumns.includes(colName)) {
            // Need to add with default or nullable first
            await client.query(`
              ALTER TABLE assessments ADD COLUMN ${colName} ${colType}
            `);
          } else if (colName === 'questions') {
            await client.query(`
              ALTER TABLE assessments ADD COLUMN ${colName} ${colType} DEFAULT '[]'
            `);
          } else {
            await client.query(`
              ALTER TABLE assessments ADD COLUMN ${colName} ${colType}
            `);
          }
          console.log(`  ✅ Added ${colName} column`);
        }
      }
    }
    
    // Step 3: Create assessment_responses table
    console.log('\n📝 Checking assessment_responses table...');
    const responsesTableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='assessment_responses'
    `);
    
    if (responsesTableCheck.rows.length === 0) {
      console.log('  Creating assessment_responses table...');
      await client.query(`
        CREATE TABLE assessment_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          response_data JSONB DEFAULT '{}',
          is_correct BOOLEAN,
          score INT,
          attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        )
      `);
      console.log('  ✅ assessment_responses table created');
    } else {
      console.log('  ✅ assessment_responses table exists');
    }
    
    // Step 4: Create student_rewards table
    console.log('\n📝 Checking student_rewards table...');
    const rewardsTableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='student_rewards'
    `);
    
    if (rewardsTableCheck.rows.length === 0) {
      console.log('  Creating student_rewards table...');
      await client.query(`
        CREATE TABLE student_rewards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
          yunit_id UUID REFERENCES yunits(id) ON DELETE CASCADE,
          xp_earned INT DEFAULT 0,
          coins_earned INT DEFAULT 0,
          earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ student_rewards table created');
    } else {
      console.log('  ✅ student_rewards table exists');
    }
    
    // Step 5: Create indexes for performance
    console.log('\n📝 Creating indexes...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_yunits_lesson_id ON yunits(lesson_id)',
      'CREATE INDEX IF NOT EXISTS idx_yunits_teacher_id ON yunits(teacher_id)',
      'CREATE INDEX IF NOT EXISTS idx_yunits_class_id ON yunits(class_id)',
      'CREATE INDEX IF NOT EXISTS idx_assessments_lesson_id ON assessments(lesson_id)',
      'CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id)',
      'CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type)',
      'CREATE INDEX IF NOT EXISTS idx_assessment_responses_student_id ON assessment_responses(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_id ON assessment_responses(assessment_id)',
      'CREATE INDEX IF NOT EXISTS idx_student_rewards_student_id ON student_rewards(student_id)'
    ];
    
    for (const indexQuery of indexQueries) {
      try {
        await client.query(indexQuery);
      } catch (err) {
        // Index might already exist, continue
        console.log(`  ℹ️  ${indexQuery.split('ON')[0].trim()}`);
      }
    }
    console.log('  ✅ Indexes created');

    console.log('\n✨ Migration completed successfully!\n');
    
    // Summary
    const yunitCount = await client.query('SELECT COUNT(*) FROM yunits');
    const assessmentCount = await client.query('SELECT COUNT(*) FROM assessments');
    console.log('📊 Database Summary:');
    console.log(`  Yunits: ${yunitCount.rows[0].count}`);
    console.log(`  Assessments: ${assessmentCount.rows[0].count}\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('   Details:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
