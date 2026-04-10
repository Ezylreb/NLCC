import { query } from './lib/db.js';

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Add teacher_id column
    console.log('Adding teacher_id column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✓ teacher_id column added');
    
    // Add class_id column
    console.log('Adding class_id column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL
    `);
    console.log('✓ class_id column added');
    
    // Create indexes for performance
    console.log('Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id)
    `);
    console.log('✓ teacher_id index created');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id)
    `);
    console.log('✓ class_id index created');
    
    // Verify columns exist
    console.log('Verifying columns...');
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('teacher_id', 'class_id')
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ Migration completed successfully!');
      console.log('Columns added:', result.rows);
    } else {
      console.log('⚠️ Expected 2 columns but found:', result.rows.length);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
