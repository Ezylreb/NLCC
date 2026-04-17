import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function debugBahagiFetch() {
  try {
    await client.connect();
    console.log('🔍 Debugging Bahagi Fetch Issue\n');
    console.log('============================================================\n');

    // 1. Check bahagi table structure
    console.log('1️⃣ BAHAGI TABLE COLUMNS:');
    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bahagi'
      ORDER BY ordinal_position
    `);
    columnsRes.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`);
    });

    // 2. Get all bahagi records
    console.log('\n2️⃣ ALL BAHAGI RECORDS:');
    const allBahagi = await client.query(`
      SELECT id, title, class_name, teacher_id, created_at 
      FROM bahagi 
      ORDER BY created_at DESC
    `);
    console.log(`   Total: ${allBahagi.rows.length}`);
    if (allBahagi.rows.length > 0) {
      allBahagi.rows.forEach(b => {
        console.log(`   • ${b.title}`);
        console.log(`     Class: ${b.class_name || '(no class)'}`);
        console.log(`     Teacher ID: ${b.teacher_id || '(no teacher)'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No bahagi found in database!');
    }

    // 3. Get teacher info
    console.log('\n3️⃣ TEACHERS IN DATABASE:');
    const teachers = await client.query(`
      SELECT id, first_name, last_name, email 
      FROM users 
      WHERE role = 'TEACHER'
    `);
    console.log(`   Total: ${teachers.rows.length}`);
    teachers.rows.forEach(t => {
      console.log(`   • ${t.first_name} ${t.last_name} (${t.email})`);
      console.log(`     ID: ${t.id}`);
    });

    // 4. Get classes
    console.log('\n4️⃣ CLASSES IN DATABASE:');
    const classes = await client.query(`
      SELECT id, name, teacher_id 
      FROM classes 
      WHERE is_archived = FALSE
      ORDER BY created_at DESC
    `);
    console.log(`   Total: ${classes.rows.length}`);
    for (const c of classes.rows) {
      console.log(`   • ${c.name}`);
      console.log(`     Teacher ID: ${c.teacher_id}`);
      
      // Count bahagi for this class
      const bahagiCountRes = await client.query(`
        SELECT COUNT(*) FROM bahagi 
        WHERE class_name = $1
      `, [c.name]);
      
      console.log(`     Bahagi count: ${bahagiCountRes.rows[0].count}`);
    }

    // 5. Check if there's a mismatch
    console.log('\n5️⃣ POTENTIAL ISSUES:');
    
    // Check bahagi without teacher_id
    const noTeacherBahagi = await client.query(`
      SELECT COUNT(*) FROM bahagi WHERE teacher_id IS NULL
    `);
    if (parseInt(noTeacherBahagi.rows[0].count) > 0) {
      console.log(`   ⚠️  ${noTeacherBahagi.rows[0].count} bahagi have no teacher_id assigned`);
    }

    // Check bahagi without class_name
    const noClassBahagi = await client.query(`
      SELECT COUNT(*) FROM bahagi WHERE class_name IS NULL OR class_name = ''
    `);
    if (parseInt(noClassBahagi.rows[0].count) > 0) {
      console.log(`   ⚠️  ${noClassBahagi.rows[0].count} bahagi have no class_name assigned`);
    }

    console.log('\n============================================================');
    console.log('✅ Debug complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

debugBahagiFetch();
