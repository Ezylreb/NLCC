import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

async function checkProgress() {
  try {
    console.log('\n=== CHECKING LESSON PROGRESS ===\n');
    
    // Get first student
    const students = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['student']);
    if (students.rows.length === 0) {
      console.log('No students found!');
      return;
    }
    
    const studentId = students.rows[0].id;
    console.log(`Student: ${students.rows[0].name} (${studentId})\n`);
    
    // Get all lesson progress
    const progress = await pool.query(
      `SELECT lp.*, l.title, l.bahagi_id
       FROM lesson_progress lp
       JOIN lesson l ON l.id = lp.lesson_id
       WHERE lp.student_id = $1
       ORDER BY lp.created_at DESC`,
      [studentId]
    );
    
    console.log(`Total progress records: ${progress.rows.length}\n`);
    progress.rows.forEach(p => {
      console.log(`- ${p.title}`);
      console.log(`  Completed: ${p.completed}`);
      console.log(`  Bahagi ID: ${p.bahagi_id}`);
      console.log(`  XP: ${p.xp_earned}, Coins: ${p.coins_earned}`);
      console.log('');
    });
    
    // Get teacher assignment
    const teacherAssignment = await pool.query(
      `SELECT teacher_id FROM student_teacher_assignment WHERE student_id = $1 LIMIT 1`,
      [studentId]
    );
    
    if (teacherAssignment.rows.length === 0) {
      console.log('No teacher assignment!');
      return;
    }
    
    const teacherId = teacherAssignment.rows[0].teacher_id;
    
    // Get bahagis
    const bahagis = await pool.query(
      `SELECT id, title FROM bahagi WHERE teacher_id = $1 ORDER BY bahagi_order ASC`,
      [teacherId]
    );
    
    console.log('\n=== BAHAGI PROGRESS ===\n');
    
    for (const bahagi of bahagis.rows) {
      console.log(`\n📚 ${bahagi.title} (${bahagi.id})`);
      
      // Get total yunits
      const totalYunits = await pool.query(
        `SELECT COUNT(*) as total FROM lesson WHERE bahagi_id = $1`,
        [bahagi.id]
      );
      
      // Get completed yunits
      const completedYunits = await pool.query(
        `SELECT COUNT(*) as completed 
         FROM lesson_progress
         WHERE student_id = $1 
         AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2)
         AND completed = true`,
        [studentId, bahagi.id]
      );
      
      const total = parseInt(totalYunits.rows[0].total);
      const completed = parseInt(completedYunits.rows[0].completed);
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      console.log(`  Total Yunits: ${total}`);
      console.log(`  Completed: ${completed}`);
      console.log(`  Progress: ${percentage}%`);
      console.log(`  Bar should be: ${completed}/${total} = ${percentage}%`);
      
      // Get individual lesson details
      const lessons = await pool.query(
        `SELECT l.id, l.title, lp.completed
         FROM lesson l
         LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $1
         WHERE l.bahagi_id = $2
         ORDER BY l.lesson_order ASC`,
        [studentId, bahagi.id]
      );
      
      console.log('  Yunits:');
      lessons.rows.forEach(lesson => {
        console.log(`    - ${lesson.title}: ${lesson.completed ? '✅ Completed' : '❌ Not started'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkProgress();
