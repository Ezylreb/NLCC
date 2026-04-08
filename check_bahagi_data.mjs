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

async function checkBahagiData() {
  try {
    await client.connect();
    console.log('📊 BAHAGI SYSTEM - ACTUAL DATA\n');

    // Bahagi records
    const bahagiData = await client.query(`SELECT id, title, yunit, class_name, teacher_id FROM bahagi LIMIT 3`);
    console.log(`📚 Bahagi Records (${bahagiData.rows.length}):`);
    bahagiData.rows.forEach(b => {
      console.log(`   - ID: ${b.id}, Title: ${b.title}`);
      console.log(`     Class: ${b.class_name}, Teacher: ${b.teacher_id}`);
      console.log(`     Yunit field: ${b.yunit}`);
    });

    // Try understanding Yunits relationship
    console.log(`\n🔗 Yunits with bahagi_id relationship:`);
    const yunitsData = await client.query(`SELECT id, title, bahagi_id FROM yunits LIMIT 3`);
    yunitsData.rows.forEach(y => {
      console.log(`   - ID: ${y.id}, Title: ${y.title}`);
      console.log(`     bahagi_id: ${y.bahagi_id} (type: ${typeof y.bahagi_id})`);
    });

    // Try understanding Assessments relationship
    console.log(`\n📝 Assessments with yunit_id relationship:`);
    const assessmentsData = await client.query(`SELECT id, title, yunit_id FROM assessments LIMIT 3`);
    assessmentsData.rows.forEach(a => {
      console.log(`   - ID: ${a.id}, Title: ${a.title}`);
      console.log(`     yunit_id: ${a.yunit_id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkBahagiData();
