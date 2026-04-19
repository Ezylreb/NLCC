import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function addMediaColumns() {
  try {
    await client.connect();
    console.log('🔧 Adding media_url and audio_url columns to lesson table...\n');

    // Add media_url column
    try {
      await client.query(`
        ALTER TABLE lesson 
        ADD COLUMN IF NOT EXISTS media_url TEXT
      `);
      console.log('✅ Added media_url column');
    } catch (err) {
      console.log('⚠️  media_url:', err.message);
    }

    // Add audio_url column
    try {
      await client.query(`
        ALTER TABLE lesson 
        ADD COLUMN IF NOT EXISTS audio_url TEXT
      `);
      console.log('✅ Added audio_url column');
    } catch (err) {
      console.log('⚠️  audio_url:', err.message);
    }

    // Verify the columns were added
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lesson' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated lesson table columns:');
    columnsRes.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

addMediaColumns();
