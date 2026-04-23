import { config } from 'dotenv';
import pg from 'pg';
const { Client } = pg;

config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkBahagiMetadata() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check bahagi with metadata
    const result = await client.query(`
      SELECT id, title, quarter, week_number, module_number, class_name, teacher_id
      FROM bahagi 
      WHERE title LIKE '%Pagkilala%'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('📊 Bahagi matching "Pagkilala":');
    console.log('=====================================\n');
    
    if (result.rows.length === 0) {
      console.log('No bahagi found with "Pagkilala" in title\n');
      
      // Show all bahagi
      const allResult = await client.query(`
        SELECT id, title, quarter, week_number, module_number, class_name
        FROM bahagi 
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      console.log('📋 All recent bahagi:');
      allResult.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Title: ${row.title}`);
        console.log(`Class: ${row.class_name}`);
        console.log(`Quarter: ${row.quarter || 'NOT SET'}`);
        console.log(`Week: ${row.week_number || 'NOT SET'}`);
        console.log(`Module: ${row.module_number || 'NOT SET'}`);
        console.log('---');
      });
    } else {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Title: ${row.title}`);
        console.log(`Class: ${row.class_name}`);
        console.log(`Quarter: ${row.quarter || '❌ NOT SET'}`);
        console.log(`Week: ${row.week_number || '❌ NOT SET'}`);
        console.log(`Module: ${row.module_number || '❌ NOT SET'}`);
        console.log('=====================================\n');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkBahagiMetadata();
