// Simple migration to create classes table
// Run this from within the Next.js app environment
import { query } from '../lib/db.ts';

async function migrate() {
  console.log('🚀 Creating classes table...');
  
  try {
    // Create classes table
    await query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created classes table');

    // Create index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id)
    `);
    console.log('✅ Created teacher_id index');

    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
