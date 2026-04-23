import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let cs = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (cs && !cs.includes('uselibpqcompat')) cs += (cs.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });

async function check() {
  // Check which relevant tables actually exist
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('lessons','lesson','yunits','assessments','bahagi_assessment','bahagi','bahagis')
     ORDER BY table_name`
  );
  console.log('Existing tables:', tables.rows.map(r => r.table_name));

  for (const t of tables.rows) {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = $1 ORDER BY ordinal_position`, [t.table_name]
    );
    console.log(`\n${t.table_name} columns:`);
    cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
  }

  // Check if there's any data in lessons table
  try {
    const lessonsCount = await pool.query('SELECT COUNT(*) FROM lessons');
    console.log('\nlessons table count:', lessonsCount.rows[0].count);
    const sample = await pool.query('SELECT id, title, class_id, class_name FROM lessons LIMIT 3');
    console.log('lessons sample:', sample.rows);
  } catch(e) { console.log('lessons table error:', e.message); }

  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
