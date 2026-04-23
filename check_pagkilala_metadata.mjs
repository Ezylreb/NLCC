import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:bsKmbbfXBVrMmBdlVHAeUwmLaLaEnAtW@junction.proxy.rlwy.net:47885/railway'
});

async function checkMetadata() {
  try {
    console.log('Checking metadata for "Pagkilala sa Sarili"...\n');
    
    const result = await pool.query(
      `SELECT id, title, quarter, week_number, module_number, class_name, teacher_id, is_open 
       FROM bahagi 
       WHERE title ILIKE '%pagkilala%sarili%'`
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No bahagi found with title containing "Pagkilala sa Sarili"');
      return;
    }
    
    console.log(`✅ Found ${result.rows.length} matching bahagi:\n`);
    
    result.rows.forEach(row => {
      console.log('─'.repeat(60));
      console.log(`ID: ${row.id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Quarter: ${row.quarter || '(null)'}`);
      console.log(`Week Number: ${row.week_number || '(null)'}`);
      console.log(`Module Number: ${row.module_number || '(null)'}`);
      console.log(`Class Name: ${row.class_name || '(null)'}`);
      console.log(`Teacher ID: ${row.teacher_id}`);
      console.log(`Is Open: ${row.is_open}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMetadata();
