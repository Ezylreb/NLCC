import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function debugYunits() {
  try {
    await client.connect();
    console.log('🔍 Full Yunit Debug\n');

    // Get the bahagi with title "Pagkilala sa Sarili"
    console.log('1. Finding bahagi "Pagkilala sa Sarili":');
    const bahagiRes = await client.query(`
      SELECT id, title, class_name
      FROM bahagi
      WHERE title ILIKE '%Pagkilala%'
      ORDER BY id
    `);
    
    if (bahagiRes.rows.length > 0) {
      console.log('   Found bahagi:');
      bahagiRes.rows.forEach(b => {
        console.log(`   - ID: ${b.id} (${typeof b.id}) | Title: ${b.title} | Class: ${b.class_name}`);
      });
    }

    // Get ALL yunits and their bahagi_ids
    console.log('\n2. ALL yunits in database:');
    const allYunitsRes = await client.query(`
      SELECT id, bahagi_id, title, subtitle
      FROM lesson
      ORDER BY bahagi_id, id
      LIMIT 20
    `);
    
    console.log(`   Total yunits: ${allYunitsRes.rows.length}`);
    allYunitsRes.rows.forEach(y => {
      console.log(`   - Yunit ID: ${y.id} | bahagi_id: ${y.bahagi_id} (${typeof y.bahagi_id}) | ${y.title}`);
    });

    // Count yunits per bahagi_id
    console.log('\n3. Yunits grouped by bahagi_id:');
    const groupedRes = await client.query(`
      SELECT bahagi_id, COUNT(*) as count
      FROM lesson
      WHERE bahagi_id IS NOT NULL
      GROUP BY bahagi_id
      ORDER BY bahagi_id
    `);
    
    groupedRes.rows.forEach(g => {
      console.log(`   bahagi_id ${g.bahagi_id} (${typeof g.bahagi_id}): ${g.count} yunits`);
    });

    // Check if there are yunits with bahagi_id as TEXT instead of INTEGER
    console.log('\n4. Checking data type of bahagi_id column:');
    const schemaRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'lesson' AND column_name = 'bahagi_id'
    `);
    console.log(`   bahagi_id column type: ${schemaRes.rows[0]?.data_type}`);

    // Try to find yunits that might match "Pagkilala sa Sarili" bahagi
    console.log('\n5. Looking for yunits related to "Pagkilala":');
    const relatedYunitsRes = await client.query(`
      SELECT l.id, l.bahagi_id, l.title, b.title as bahagi_title
      FROM lesson l
      LEFT JOIN bahagi b ON l.bahagi_id = b.id
      WHERE b.title ILIKE '%Pagkilala%'
      ORDER BY l.id
    `);
    
    if (relatedYunitsRes.rows.length > 0) {
      console.log(`   Found ${relatedYunitsRes.rows.length} yunits:`);
      relatedYunitsRes.rows.forEach(y => {
        console.log(`   - Yunit: ${y.title} | bahagi_id: ${y.bahagi_id} | Bahagi: ${y.bahagi_title}`);
      });
    } else {
      console.log('   ❌ No yunits found linked to "Pagkilala" bahagi');
    }

    console.log('\n✅ Debug complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

debugYunits();
