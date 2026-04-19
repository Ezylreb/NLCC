import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugUnlockIssue() {
  try {
    console.log('\n=== DEBUGGING UNLOCK ISSUE ===\n');
    
    // Get all students
    const students = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 5', ['student']);
    console.log('Students:', students.rows);
    
    if (students.rows.length === 0) {
      console.log('No students found!');
      return;
    }
    
    const studentId = students.rows[0].id;
    console.log(`\nChecking progress for student: ${students.rows[0].name} (${studentId})\n`);
    
    // Check lesson_progress table
    const progressRecords = await pool.query(
      `SELECT lp.*, l.title as lesson_title, l.bahagi_id
       FROM lesson_progress lp
       JOIN lesson l ON l.id = lp.lesson_id
       WHERE lp.student_id = $1
       ORDER BY lp.created_at DESC`,
      [studentId]
    );
    
    console.log(`Found ${progressRecords.rows.length} progress records:`);
    progressRecords.rows.forEach(record => {
      console.log(`  - Lesson: ${record.lesson_title}`);
      console.log(`    Completed: ${record.completed}`);
      console.log(`    Bahagi ID: ${record.bahagi_id}`);
      console.log(`    XP: ${record.xp_earned}, Coins: ${record.coins_earned}`);
      console.log('');
    });
    
    // Get all bahagis for the student's teacher
    const teacherAssignment = await pool.query(
      `SELECT teacher_id FROM student_teacher_assignment WHERE student_id = $1 LIMIT 1`,
      [studentId]
    );
    
    if (teacherAssignment.rows.length === 0) {
      console.log('No teacher assignment found!');
      return;
    }
    
    const teacherId = teacherAssignment.rows[0].teacher_id;
    console.log(`Teacher ID: ${teacherId}\n`);
    
    // Get bahagis
    const bahagis = await pool.query(
      `SELECT id, title FROM bahagi WHERE teacher_id = $1 ORDER BY bahagi_order ASC`,
      [teacherId]
    );
    
    console.log(`\nFound ${bahagis.rows.length} bahagis:`);
    
    // Check progress for each bahagi
    for (let i = 0; i < bahagis.rows.length; i++) {
      const bahagi = bahagis.rows[i];
      console.log(`\n${i + 1}. ${bahagi.title} (${bahagi.id})`);
      
      // Check if student has ANY progress in this bahagi
      const hasProgress = await pool.query(
        `SELECT EXISTS(
          SELECT 1 FROM lesson_progress
          WHERE student_id = $1 AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2)
        ) as has_any_progress`,
        [studentId, bahagi.id]
      );
      
      console.log(`   Has ANY progress: ${hasProgress.rows[0].has_any_progress}`);
      
      // Get lessons in this bahagi
      const lessons = await pool.query(
        `SELECT id, title FROM lesson WHERE bahagi_id = $1 ORDER BY lesson_order ASC`,
        [bahagi.id]
      );
      
      console.log(`   Lessons (${lessons.rows.length}):`);
      for (const lesson of lessons.rows) {
        const lessonProgress = await pool.query(
          `SELECT completed, xp_earned FROM lesson_progress WHERE student_id = $1 AND lesson_id = $2`,
          [studentId, lesson.id]
        );
        
        if (lessonProgress.rows.length > 0) {
          const prog = lessonProgress.rows[0];
          console.log(`     - ${lesson.title}: ${prog.completed ? '✅ Completed' : '🔄 Started'} (XP: ${prog.xp_earned})`);
        } else {
          console.log(`     - ${lesson.title}: ❌ No progress`);
        }
      }
    }
    
    console.log('\n\n=== UNLOCK CALCULATION ===\n');
    
    // Simulate unlock logic
    let highestProgressIndex = -1;
    for (let i = 0; i < bahagis.rows.length; i++) {
      const hasProgress = await pool.query(
        `SELECT EXISTS(
          SELECT 1 FROM lesson_progress
          WHERE student_id = $1 AND lesson_id IN (SELECT id FROM lesson WHERE bahagi_id = $2)
        ) as has_any_progress`,
        [studentId, bahagis.rows[i].id]
      );
      
      if (hasProgress.rows[0].has_any_progress) {
        highestProgressIndex = i;
      }
    }
    
    console.log(`Highest progress index: ${highestProgressIndex}`);
    console.log('\nUnlock status:');
    
    for (let i = 0; i < bahagis.rows.length; i++) {
      const isUnlocked = i === 0 || i <= highestProgressIndex + 1;
      console.log(`  ${i + 1}. ${bahagis.rows[i].title}: ${isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugUnlockIssue();
