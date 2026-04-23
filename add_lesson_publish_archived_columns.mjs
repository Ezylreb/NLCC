import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function addColumns() {
  try {
    await client.connect();
    console.log('📝 Adding is_published and is_archived columns to lesson table\n');

    // Add is_published column
    await client.query(`
      ALTER TABLE lesson 
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_published column');

    // Add is_archived column
    await client.query(`
      ALTER TABLE lesson 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_archived column');

    // Verify columns were added
    const verifyRes = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lesson' 
      AND column_name IN ('is_published', 'is_archived')
      ORDER BY column_name
    `);
    
    console.log('\n✅ Verification - Columns now exist:');
    verifyRes.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - default: ${col.column_default}`);
    });

    console.log('\n🎉 Done! Lesson table now has is_published and is_archived columns.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

addColumns();
