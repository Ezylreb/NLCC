import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

let connStr = process.env.DATABASE_URL;
if (connStr && !connStr.includes('sslmode')) {
  connStr += (connStr.includes('?') ? '&' : '?') + 'sslmode=disable';
}

const client = new Client({
  connectionString: connStr
});

async function migrate() {
  try {
    await client.connect();
    console.log('🔄 Starting migration for lesson publishing...\n');

    // Add published_at column to yunits
    console.log('📝 Checking yunits table for published_at column...');
    try {
      await client.query(`
        ALTER TABLE yunits
        ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Added published_at column to yunits');
    } catch (err) {
      console.log('⚠️  yunits.published_at may already exist');
    }

    // Add published_at column to assessments
    console.log('\n📝 Checking assessments table for published_at column...');
    try {
      await client.query(`
        ALTER TABLE assessments
        ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Added published_at column to assessments');
    } catch (err) {
      console.log('⚠️  assessments.published_at may already exist');
    }

    // Create indexes for better query performance
    console.log('\n📝 Creating indexes for lesson queries...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_lessons_status_class ON lessons(status, class_name)
      `);
      console.log('✅ Created index on lessons(status, class_name)');
    } catch (err) {
      console.log('⚠️  Index may already exist');
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_yunits_lesson_published ON yunits(lesson_id, published_at)
      `);
      console.log('✅ Created index on yunits(lesson_id, published_at)');
    } catch (err) {
      console.log('⚠️  Index may already exist');
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_assessments_lesson_published ON assessments(lesson_id, published_at)
      `);
      console.log('✅ Created index on assessments(lesson_id, published_at)');
    } catch (err) {
      console.log('⚠️  Index may already exist');
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
