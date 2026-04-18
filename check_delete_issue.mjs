import { query } from './lib/db.ts';

async function checkTables() {
  try {
    console.log('📋 Checking database tables...\n');
    
    // List all tables
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check if bahagi with id=14 exists
    console.log('\n📌 Checking bahagi id=14...');
    const bahagi = await query('SELECT * FROM bahagi WHERE id = $1', [14]);
    if (bahagi.rows.length > 0) {
      console.log('✅ Bahagi exists:', bahagi.rows[0]);
      
      // Check related records
      const lessons = await query('SELECT COUNT(*) FROM lesson WHERE bahagi_id = $1', [14]);
      console.log(`  Lessons: ${lessons.rows[0].count}`);
      
      const assessments = await query('SELECT COUNT(*) FROM bahagi_assessment WHERE bahagi_id = $1', [14]);
      console.log(`  Assessments: ${assessments.rows[0].count}`);
      
      const rewards = await query('SELECT COUNT(*) FROM bahagi_reward WHERE bahagi_id = $1', [14]);
      console.log(`  Rewards: ${rewards.rows[0].count}`);
      
      // Check for yunit_answers table
      const hasYunitAnswers = tables.rows.find(t => t.table_name === 'yunit_answers');
      if (hasYunitAnswers) {
        const answers = await query(
          `SELECT COUNT(*) FROM yunit_answers 
           WHERE assessment_id IN (
             SELECT id FROM bahagi_assessment WHERE bahagi_id = $1
           )`,
          [14]
        );
        console.log(`  Yunit Answers: ${answers.rows[0].count}`);
      } else {
        console.log('  ⚠️  Table "yunit_answers" does NOT exist');
      }
      
      // Try deleting with CASCADE
      console.log('\n🗑️  Attempting delete with CASCADE...');
      const result = await query('DELETE FROM bahagi WHERE id = $1 RETURNING *', [14]);
      if (result.rows.length > 0) {
        console.log('✅ Delete successful!', result.rows[0]);
      }
    } else {
      console.log('❌ Bahagi not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
  
  process.exit(0);
}

checkTables();
