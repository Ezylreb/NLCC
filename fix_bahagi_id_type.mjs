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

async function fixBahagiIdType() {
  try {
    await client.connect();
    console.log('🔄 Fixing bahagi_id type mismatch...\n');

    // Check current type
    console.log('📋 Current bahagi_id column info:');
    const currentType = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'yunits' AND column_name = 'bahagi_id'
    `);
    console.log(`   Type: ${currentType.rows[0].data_type}`);
    console.log(`   Nullable: ${currentType.rows[0].is_nullable}`);

    // Step 1: Clear existing null values (they're already null)
    console.log('\n📝 Step 1: Ensuring bahagi_id is nullable...');
    try {
      await client.query(`ALTER TABLE yunits ALTER COLUMN bahagi_id DROP NOT NULL`);
      console.log('   ✅ Column is now nullable');
    } catch (err) {
      console.log('   ℹ️  Already nullable');
    }

    // Step 2: Convert type from UUID to INTEGER
    console.log('\n📝 Step 2: Converting bahagi_id type from UUID to INTEGER...');
    try {
      // PostgreSQL requires casting when changing types
      await client.query(`
        ALTER TABLE yunits
        ALTER COLUMN bahagi_id TYPE INTEGER USING NULL
      `);
      console.log('   ✅ Successfully converted bahagi_id to INTEGER');
    } catch (err) {
      console.error('   ❌ Error:', err.message);
      throw err;
    }

    // Verify the change
    console.log('\n✅ Verifying fix...');
    const verifyType = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'yunits' AND column_name = 'bahagi_id'
    `);
    console.log(`   Type is now: ${verifyType.rows[0].data_type}`);
    console.log(`   Nullable: ${verifyType.rows[0].is_nullable}`);

    // Test: Try inserting a yunit with integer bahagi_id
    console.log('\n🧪 Testing insertion with integer bahagi_id...');
    try {
      const teacherResult = await client.query(`SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1`);
      const bahagiResult = await client.query(`SELECT id FROM bahagi LIMIT 1`);
      
      if (bahagiResult.rows.length > 0) {
        const testInsert = await client.query(
          `INSERT INTO yunits (title, content, bahagi_id, teacher_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id, title, bahagi_id`,
          ['Test Yunit with Bahagi', 'Test content', bahagiResult.rows[0].id, teacherResult.rows[0].id]
        );
        console.log(`   ✅ Successfully created yunit with bahagi_id = ${testInsert.rows[0].bahagi_id}`);
      }
    } catch (err) {
      console.error('   ❌ Test failed:', err.message);
    }

    console.log('\n✨ Schema fix completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixBahagiIdType();
