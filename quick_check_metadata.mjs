import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:bsKmbbfXBVrMmBdlVHAeUwmLaLaEnAtW@junction.proxy.rlwy.net:47885/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const result = await pool.query(
      "SELECT id, title, quarter, week_number, module_number FROM bahagi WHERE title ILIKE '%pagkilala%'"
    );
    
    console.log('\n✅ Bahagi found:', result.rows.length);
    result.rows.forEach(row => {
      console.log('\n' + '─'.repeat(50));
      console.log('ID:', row.id);
      console.log('Title:', row.title);
      console.log('Quarter:', row.quarter || '(NULL)');
      console.log('Week:', row.week_number || '(NULL)');
      console.log('Module:', row.module_number || '(NULL)');
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
