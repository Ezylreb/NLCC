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
    console.log('🔄 Fixing bahagi_id type mismatch (with FK handling)...\n');

    // Step 1: Drop the foreign key constraint
    console.log('📝 Step 1: Dropping foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE yunits 
        DROP CONSTRAINT IF EXISTS yunits_bahagi_id_fkey
      `);
      console.log('   ✅ Dropped foreign key');
    } catch (err) {
      console.log('   ℹ️  No FK to drop:', err.message);
    }

    // Step 2: Convert type from UUID to INTEGER
    console.log('\n📝 Step 2: Converting bahagi_id type UUID → INTEGER...');
    try {
      await client.query(`
        ALTER TABLE yunits
        ALTER COLUMN bahagi_id TYPE INTEGER USING NULL
      `);
      console.log('   ✅ Converted to INTEGER');
    } catch (err) {
      console.error('   ❌ Error:', err.message);
      throw err;
    }

    // Step 3: Recreate the foreign key constraint
    console.log('\n📝 Step 3: Recreating foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE yunits 
        ADD CONSTRAINT yunits_bahagi_id_fkey 
        FOREIGN KEY (bahagi_id) REFERENCES bahagi(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Recreated foreign key');
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
    console.log(`   Type: ${verifyType.rows[0].data_type}`);
    console.log(`   Nullable: ${verifyType.rows[0].is_nullable}`);

    // Verify FK exists
    const verifyFK = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'yunits' AND constraint_type = 'FOREIGN KEY'
    `);
    console.log(`   Foreign Keys: ${verifyFK.rows.map(r => r.constraint_name).join(', ')}`);

    // Test: Try inserting a yunit with integer bahagi_id
    console.log('\n🧪 Testing insertion with integer bahagi_id...');
    try {
      const teacherResult = await client.query(`SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1`);
      const bahagiResult = await client.query(`SELECT id FROM bahagi ORDER BY id DESC LIMIT 1`);
      
      if (bahagiResult.rows.length > 0) {
        const bahagiId = bahagiResult.rows[0].id;
        const testInsert = await client.query(
          `INSERT INTO yunits (title, content, bahagi_id, teacher_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id, title, bahagi_id`,
          ['Bahagi-linked Yunit', 'Content for yunit under bahagi', bahagiId, teacherResult.rows[0].id]
        );
        console.log(`   ✅ Created yunit with bahagi_id = ${testInsert.rows[0].bahagi_id}`);
        console.log(`   ✅ Yunit ID: ${testInsert.rows[0].id}`);
      }
    } catch (err) {
      console.error('   ❌ Test failed:', err.message);
    }

    console.log('\n✨ Schema fix completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixBahagiIdType();
