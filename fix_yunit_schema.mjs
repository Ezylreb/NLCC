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

async function fixYunitSchema() {
  try {
    await client.connect();
    console.log('🔄 Fixing yunits table schema...\n');

    // Make bahagi_id nullable to support lesson-based system
    console.log('📝 Making bahagi_id nullable...');
    try {
      await client.query(`
        ALTER TABLE yunits 
        ALTER COLUMN bahagi_id DROP NOT NULL
      `);
      console.log('✅ bahagi_id is now nullable');
    } catch (err) {
      console.error('❌ Failed to alter bahagi_id:', err.message);
    }

    // Verify the change
    const result = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'yunits' AND column_name = 'bahagi_id'
    `);
    
    if (result.rows.length > 0) {
      const bahagi = result.rows[0];
      console.log(`\n✅ Verified: bahagi_id is now ${bahagi.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL'}`);
    }

    // Now test creating a yunit
    console.log('\n📝 Testing yunit creation...');
    
    const teacherResult = await client.query(`
      SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    
    const lessonResult = await client.query(`
      SELECT id FROM lessons LIMIT 1
    `);
    
    if (teacherResult.rows.length > 0 && lessonResult.rows.length > 0) {
      const testResult = await client.query(
        `INSERT INTO yunits (title, content, lesson_id, teacher_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, title`,
        ['Test Yunit post-fix', 'Test content', lessonResult.rows[0].id, teacherResult.rows[0].id]
      );
      
      console.log('✅ YUNIT CREATED SUCCESSFULLY!');
      console.log(`   ID: ${testResult.rows[0].id}`);
      console.log(`   Title: ${testResult.rows[0].title}`);
    }

    console.log('\n✨ Schema fix completed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fixYunitSchema();
