import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const client = new Client({ connectionString });

async function consolidateClasses() {
  try {
    await client.connect();
    console.log('🔧 Consolidating Duplicate Classes\n');
    console.log('============================================================\n');

    // Step 1: Add teacher_role columns
    console.log('1️⃣ Adding teacher_role columns...');
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS teacher_role VARCHAR(20) CHECK (teacher_role IN ('adviser', 'assistant'));
      `);
      console.log('   ✅ Added teacher_role to users table');
    } catch (err) {
      console.log('   ℹ️  teacher_role column may already exist');
    }

    try {
      await client.query(`
        ALTER TABLE classes 
        ADD COLUMN IF NOT EXISTS teacher_role VARCHAR(20) CHECK (teacher_role IN ('adviser', 'assistant'));
      `);
      console.log('   ✅ Added teacher_role to classes table');
    } catch (err) {
      console.log('   ℹ️  teacher_role column may already exist');
    }

    // Step 2: Find duplicate class names
    console.log('\n2️⃣ Finding duplicate classes...');
    const duplicatesRes = await client.query(`
      SELECT name, ARRAY_AGG(id ORDER BY created_at ASC) as class_ids
      FROM classes 
      WHERE is_archived = FALSE
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (duplicatesRes.rows.length === 0) {
      console.log('   ✅ No duplicates found!');
      return;
    }

    console.log(`   Found ${duplicatesRes.rows.length} sections with duplicates\n`);

    // Step 3: Consolidate each duplicate set
    console.log('3️⃣ Consolidating duplicates...\n');
    
    for (const duplicate of duplicatesRes.rows) {
      const className = duplicate.name;
      const classIds = duplicate.class_ids;
      
      console.log(`   📚 Processing: ${className} (${classIds.length} duplicates)`);
      
      // Keep the FIRST created class (oldest)
      const primaryClassId = classIds[0];
      const duplicateIds = classIds.slice(1);
      
      console.log(`      Primary class ID: ${primaryClassId}`);
      console.log(`      Duplicates to merge: ${duplicateIds.length}`);
      
      // Mark primary as adviser (first teacher)
      await client.query(`
        UPDATE classes 
        SET teacher_role = 'adviser'
        WHERE id = $1
      `, [primaryClassId]);
      
      // For each duplicate class:
      for (let i = 0; i < duplicateIds.length; i++) {
        const duplicateId = duplicateIds[i];
        
        // Move enrollments to primary class
        const moveResult = await client.query(`
          INSERT INTO class_enrollments (class_id, student_id, created_at)
          SELECT $1, student_id, created_at
          FROM class_enrollments
          WHERE class_id = $2
          ON CONFLICT DO NOTHING
          RETURNING student_id
        `, [primaryClassId, duplicateId]);
        
        console.log(`      • Moved ${moveResult.rows.length} enrollments from duplicate ${i+1}`);
        
        // Move bahagi to primary class
        const bahagiResult = await client.query(`
          UPDATE bahagi
          SET class_name = (SELECT name FROM classes WHERE id = $1)
          WHERE class_name = (SELECT name FROM classes WHERE id = $2)
          RETURNING id
        `, [primaryClassId, duplicateId]);
        
        if (bahagiResult.rows.length > 0) {
          console.log(`      • Moved ${bahagiResult.rows.length} bahagi from duplicate ${i+1}`);
        }
        
        // Archive the duplicate class
        await client.query(`
          UPDATE classes 
          SET is_archived = TRUE, updated_at = NOW()
          WHERE id = $1
        `, [duplicateId]);
      }
      
      console.log(`      ✅ Consolidated ${className} - kept 1, archived ${duplicateIds.length}\n`);
    }

    // Step 4: Summary
    console.log('4️⃣ FINAL SUMMARY:');
    const finalCount = await client.query(`
      SELECT COUNT(DISTINCT name) as unique_sections, COUNT(*) as total_classes
      FROM classes
      WHERE is_archived = FALSE
    `);
    
    console.log(`   Active sections: ${finalCount.rows[0].unique_sections}`);
    console.log(`   Total active classes: ${finalCount.rows[0].total_classes}`);
    
    console.log('\n============================================================');
    console.log('✅ Consolidation complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

consolidateClasses();
