import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use the database URL from env.download
const DATABASE_URL = "postgres://postgres.jzuzdycorgdugpbidzyg:2x6FmYztYjtmekWp@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ssl: 'require'
  }
});

async function checkAndMigrate() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Check current columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current users table columns:');
    columnsResult.rows.forEach(row => {
      const marker = ['teacher_id', 'class_id'].includes(row.column_name) ? '✅' : '  ';
      console.log(`${marker} ${row.column_name} (${row.data_type})`);
    });
    
    // Check if migrations needed
    const hasTeacherId = columnsResult.rows.some(r => r.column_name === 'teacher_id');
    const hasClassId = columnsResult.rows.some(r => r.column_name === 'class_id');
    
    console.log(`\n📊 Migration Status:`);
    console.log(`${hasTeacherId ? '✅' : '❌'} teacher_id column: ${hasTeacherId ? 'EXISTS' : 'MISSING'}`);
    console.log(`${hasClassId ? '✅' : '❌'} class_id column: ${hasClassId ? 'EXISTS' : 'MISSING'}`);
    
    if (!hasTeacherId || !hasClassId) {
      console.log('\n🔄 Running migrations...\n');
      
      const migrationFiles = [
        'scripts/migrate-student-teacher-relationship.sql',
        'scripts/migrate-student-class-relationship.sql'
      ];
      
      for (const file of migrationFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          console.log(`📄 Applying: ${file}`);
          const sql = fs.readFileSync(filePath, 'utf-8');
          await pool.query(sql);
          console.log(`✅ Applied: ${file}\n`);
        } else {
          console.log(`⚠️  File not found: ${filePath}\n`);
        }
      }
      
      // Verify again
      const newColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name IN ('teacher_id', 'class_id')
      `);
      
      if (newColumnsResult.rows.length === 2) {
        console.log('✅ Migration completed successfully!\n');
      } else {
        console.log('⚠️ Some columns still missing after migration\n');
      }
    } else {
      console.log('\n✅ All required columns exist! No migration needed.\n');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAndMigrate();
