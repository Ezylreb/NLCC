import { query } from './lib/db.ts';

async function debugClassStudents() {
    console.log('=== Checking Classes ===');
    const classes = await query('SELECT id, name, teacher_id FROM classes LIMIT 5');
    console.log('Classes:', JSON.stringify(classes.rows, null, 2));

    if (classes.rows.length > 0) {
        const classId = classes.rows[0].id;
        const teacherId = classes.rows[0].teacher_id;
        
        console.log('\n=== Checking Students for Class:', classId, '===');
        
        // Check users with class_id assignment
        const usersInClass = await query(
            `SELECT id, first_name, last_name, email, class_id, class_name, role 
             FROM users 
             WHERE class_id = $1 AND role = 'USER'`,
            [classId]
        );
        console.log('\nUsers assigned to class (via users.class_id):', JSON.stringify(usersInClass.rows, null, 2));
        
        // Check class_enrollments
        const enrollments = await query(
            `SELECT ce.*, u.first_name, u.last_name 
             FROM class_enrollments ce 
             JOIN users u ON u.id = ce.student_id 
             WHERE ce.class_id = $1`,
            [classId]
        );
        console.log('\nClass enrollments:', JSON.stringify(enrollments.rows, null, 2));
        
        // Run the actual API query
        const apiQuery = await query(
            `SELECT DISTINCT
                u.id,
                u.first_name as "firstName",
                u.last_name as "lastName",
                u.email,
                u.class_id,
                u.class_name,
                COALESCE(ce.enrolled_at, u.created_at) as "enrolledAt"
            FROM users u
            LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.class_id = $1
            WHERE (ce.class_id = $1 OR u.class_id = $1)
              AND u.role = 'USER'
            ORDER BY u.first_name, u.last_name`,
            [classId]
        );
        console.log('\nAPI Query Result:', JSON.stringify(apiQuery.rows, null, 2));
        console.log('\nTotal students found:', apiQuery.rows.length);
    }
}

debugClassStudents().catch(console.error).finally(() => process.exit());
