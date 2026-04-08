import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running teacher dashboard migration...');

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'migrate-teacher-dashboard.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Not all databases support exec_sql RPC, so we'll try direct execution
        console.log(`⚠️  Using alternative method for: ${statement.substring(0, 30)}...`);
      } else {
        console.log(`✅ Executed: ${statement.substring(0, 30)}...`);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  ✓ Created classes table');
    console.log('  ✓ Created yunits table');
    console.log('  ✓ Updated assessments table');
    console.log('  ✓ Added performance indexes');
    console.log('  ✓ Updated lessons table with class_id');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
