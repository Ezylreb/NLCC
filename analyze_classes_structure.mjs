import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function checkClassesStructure() {
  try {
    await client.connect();
    console.log('🔍 Checking Classes Structure\n');
    console.log('============================================================\n');

    // Check classes table columns
    console.log('1️⃣ CLASSES TABLE COLUMNS:');
    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `);
    columnsRes.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`);
    });

    // Count duplicate class names
    console.log('\n2️⃣ DUPLICATE CLASS NAMES:');
    const duplicatesRes = await client.query(`
      SELECT name, COUNT(*) as count, ARRAY_AGG(id) as class_ids, ARRAY_AGG(teacher_id) as teacher_ids
      FROM classes 
      WHERE is_archived = FALSE
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicatesRes.rows.length > 0) {
      console.log(`   Found ${duplicatesRes.rows.length} duplicate class names:`);
      duplicatesRes.rows.forEach(row => {
        console.log(`   • ${row.name}: ${row.count} classes`);
        console.log(`     IDs: ${row.class_ids.slice(0, 3).join(', ')}${row.count > 3 ? '...' : ''}`);
      });
    } else {
      console.log('   ✅ No duplicate class names found');
    }

    // Check users table for teacher_role
    console.log('\n3️⃣ CHECKING FOR TEACHER_ROLE COLUMN:');
    const userColumnsRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'teacher_role'
    `);
    
    if (userColumnsRes.rows.length > 0) {
      console.log('   ✅ teacher_role column exists');
    } else {
      console.log('   ⚠️  teacher_role column does NOT exist - needs to be added');
    }

    // Get all teachers and their classes
    console.log('\n4️⃣ TEACHERS AND THEIR CLASSES:');
    const teachersRes = await client.query(`
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name,
        u.email,
        COUNT(c.id) as class_count,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as class_names
      FROM users u
      LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_archived = FALSE
      WHERE u.role = 'TEACHER'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY class_count DESC
    `);

    teachersRes.rows.forEach(t => {
      console.log(`   • ${t.first_name} ${t.last_name} (${t.email})`);
      console.log(`     Classes: ${t.class_count}`);
      if (t.class_names && t.class_names.length > 0) {
        console.log(`     Sections: ${t.class_names.join(', ')}`);
      }
      console.log('');
    });

    console.log('============================================================');
    console.log('✅ Analysis complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkClassesStructure();
