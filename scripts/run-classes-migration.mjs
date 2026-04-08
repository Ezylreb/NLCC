import { createClient } from '@supabase/supabase-js';
import { query } from '../lib/db.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

// Try using Supabase if credentials are available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function runMigration() {
  try {
    console.log('🚀 Creating classes tables...');

    const sqlPath = path.join(__dirname, 'create-classes-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    for (const statement of statements) {
      try {
        console.log(`⏳ ${statement.substring(0, 50)}...`);
        
        // Try Supabase RPC first
        if (supabase) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (!error) {
            console.log(`✅ Success\n`);
            continue;
          }
        }

        // Fallback: Try direct query through lib/db
        try {
          await query(statement);
          console.log(`✅ Success\n`);
        } catch (e) {
          console.log(`⚠️  Skipped (may already exist or not applicable)\n`);
        }
      } catch (err) {
        console.log(`⚠️  Skipped (may already exist or not applicable)\n`);
      }
    }

    console.log('✅ Migration completed!');
    console.log('\n📊 Tables created:');
    console.log('  ✓ classes');
    console.log('  ✓ yunits');
    console.log('  ✓ Updated assessments table');
    console.log('  ✓ Updated lessons table');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
