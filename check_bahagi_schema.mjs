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

async function checkBahagiSchema() {
  try {
    await client.connect();
    console.log('📊 BAHAGI SYSTEM SCHEMA\n');

    // Check Bahagi table
    console.log('1️⃣ BAHAGI TABLE:');
    const bahagiCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bahagi'
      ORDER BY ordinal_position
    `);
    bahagiCols.rows.forEach(r => 
      console.log(`   ${r.column_name}: ${r.data_type} ${r.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`)
    );

    // Check Yunits table
    console.log('\n2️⃣ YUNITS TABLE:');
    const yunitsCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'yunits'
      ORDER BY ordinal_position
    `);
    yunitsCols.rows.forEach(r => 
      console.log(`   ${r.column_name}: ${r.data_type} ${r.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`)
    );

    // Check Assessments table
    console.log('\n3️⃣ ASSESSMENTS TABLE:');
    const assessmentsCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position
    `);
    assessmentsCols.rows.forEach(r => 
      console.log(`   ${r.column_name}: ${r.data_type} ${r.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`)
    );

    // Sample data
    console.log('\n📋 SAMPLE DATA:');
    
    const bahagiData = await client.query(`SELECT id, title, class_id FROM bahagi LIMIT 2`);
    console.log(`\nBahagi records (${bahagiData.rows.length} total):`);
    bahagiData.rows.forEach(b => console.log(`   - ${b.title} (ID: ${b.id}, Class: ${b.class_id})`));

    const yunitsData = await client.query(`SELECT id, title, bahagi_id FROM yunits WHERE bahagi_id IS NOT NULL LIMIT 2`);
    console.log(`\nYunits with bahagi_id (${yunitsData.rows.length} total):`);
    yunitsData.rows.forEach(y => console.log(`   - ${y.title} (ID: ${y.id}, Bahagi: ${y.bahagi_id})`));

    const assessmentsData = await client.query(`SELECT id, title, bahagi_id FROM assessments WHERE bahagi_id IS NOT NULL LIMIT 2`);
    console.log(`\nAssessments with bahagi_id (${assessmentsData.rows.length} total):`);
    assessmentsData.rows.forEach(a => console.log(`   - ${a.title} (ID: ${a.id}, Bahagi: ${a.bahagi_id})`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBahagiSchema();
