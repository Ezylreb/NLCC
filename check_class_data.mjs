import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ 
  connectionString: connectionString
});

async function checkClassData() {
  try {
    await client.connect();
    console.log('🔍 Checking Class Data Discrepancies\n');
    console.log('============================================================\n');

    // Get Maria Santos teacher ID
    const teacherRes = await client.query(
      `SELECT id, first_name, last_name FROM users WHERE email = 'maria@brightstart.edu'`
    );
    
    if (teacherRes.rows.length === 0) {
      console.log('❌ Maria Santos not found');
      return;
    }
    
    const teacher = teacherRes.rows[0];
    console.log(`👩‍🏫 Teacher: ${teacher.first_name} ${teacher.last_name}`);
    console.log(`   ID: ${teacher.id}\n`);

    // Get all classes for this teacher
    const classesRes = await client.query(
      `SELECT id, name, is_archived FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC`,
      [teacher.id]
    );

    console.log(`📚 Classes found: ${classesRes.rows.length}\n`);

    for (const cls of classesRes.rows) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📖 Class: ${cls.name}`);
      console.log(`   ID: ${cls.id}`);
      console.log(`   Archived: ${cls.is_archived}\n`);

      // METHOD 1: Card count (using users.class_name)
      const cardStudentCount = await client.query(
        `SELECT COUNT(*) FROM users WHERE role = 'USER' AND class_name = $1`,
        [cls.name]
      );
      console.log(`🏷️  CARD METHOD (users.class_name):`);
      console.log(`   Student Count: ${cardStudentCount.rows[0].count}`);

      // METHOD 2: Actual enrolled (using class_enrollments)
      const enrolledStudentsRes = await client.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, ce.enrolled_at
         FROM users u
         JOIN class_enrollments ce ON u.id = ce.student_id
         WHERE ce.class_id = $1
         ORDER BY u.first_name`,
        [cls.id]
      );
      console.log(`\n✅ ACTUAL METHOD (class_enrollments):`);
      console.log(`   Student Count: ${enrolledStudentsRes.rows.length}`);
      
      if (enrolledStudentsRes.rows.length > 0) {
        console.log(`   Enrolled Students:`);
        enrolledStudentsRes.rows.forEach(s => {
          console.log(`     • ${s.first_name} ${s.last_name} (${s.email})`);
        });
      }

      // LESSONS: Check all three possible tables
      const lessonsCount = await client.query(
        `SELECT COUNT(*) FROM lessons WHERE class_name = $1`,
        [cls.name]
      );
      console.log(`\n📝 LESSONS TABLE: ${lessonsCount.rows[0].count} lessons`);

      const bahagiCount = await client.query(
        `SELECT COUNT(*) FROM bahagi WHERE class_name = $1 AND is_archived = FALSE`,
        [cls.name]
      );
      console.log(`📑 BAHAGI TABLE: ${bahagiCount.rows[0].count} bahagi`);

      // Get bahagi details and count yunits
      const bahagiDetails = await client.query(
        `SELECT id, title FROM bahagi WHERE class_name = $1 AND is_archived = FALSE`,
        [cls.name]
      );
      
      let totalYunits = 0;
      if (bahagiDetails.rows.length > 0) {
        console.log(`   Bahagi list:`);
        for (const b of bahagiDetails.rows) {
          const yunitsRes = await client.query(
            `SELECT COUNT(*) FROM yunits WHERE bahagi_id = $1 AND is_archived = FALSE`,
            [b.id]
          );
          const yunitCount = parseInt(yunitsRes.rows[0].count);
          totalYunits += yunitCount;
          console.log(`     • ${b.title} (${yunitCount} yunits)`);
        }
      }
      console.log(`📘 YUNITS TABLE: ${totalYunits} total yunits across all bahagi`);

      console.log(`\n💡 VERDICT:`);
      if (cardStudentCount.rows[0].count !== enrolledStudentsRes.rows.length.toString()) {
        console.log(`   ⚠️  STUDENT COUNT MISMATCH!`);
        console.log(`      Card shows: ${cardStudentCount.rows[0].count}`);
        console.log(`      Reality: ${enrolledStudentsRes.rows.length}`);
        console.log(`      → FIX: Update card query to use class_enrollments`);
      } else {
        console.log(`   ✅ Student counts match`);
      }

      if (lessonsCount.rows[0].count !== '0' && bahagiDetails.rows.length > 0) {
        console.log(`   ⚠️  LESSON DATA EXISTS IN MULTIPLE TABLES`);
        console.log(`      → Need to clarify which table should be used`);
      } else if (lessonsCount.rows[0].count === '0' && bahagiDetails.rows.length === 0) {
        console.log(`   ✅ No content in any table (expected for new class)`);
      } else if (lessonsCount.rows[0].count !== '0') {
        console.log(`   → Card should count from 'lessons' table`);
      } else if (bahagiDetails.rows.length > 0) {
        console.log(`   → Card should count from 'bahagi' table (or yunits)`);
      }

      console.log('');
    }

    console.log('============================================================');
    console.log('✅ Analysis complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkClassData();
