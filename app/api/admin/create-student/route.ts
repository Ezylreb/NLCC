import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, lrn, teacherId, classId } = await request.json();

    // Validate all required fields
    if (!firstName || !lastName || !email || !password || !lrn) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher selection is required' }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ error: 'Class selection is required' }, { status: 400 });
    }

    if (lrn.length > 12) {
      return NextResponse.json({ error: 'LRN cannot exceed 12 digits' }, { status: 400 });
    }
    
    if (lrn.length < 12) {
      return NextResponse.json({ error: 'LRN must be exactly 12 digits' }, { status: 400 });
    }

    // Check if email or LRN already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1 OR lrn = $2', [email, lrn]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email or LRN already exists' }, { status: 400 });
    }

    // Validate teacher exists and has TEACHER role
    const teacherCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [teacherId, 'TEACHER']);
    if (teacherCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Selected teacher does not exist' }, { status: 400 });
    }

    // Validate class exists and belongs to the selected teacher
    const classCheck = await query(
      'SELECT id, teacher_id FROM classes WHERE id = $1 AND is_archived = FALSE',
      [classId]
    );
    if (classCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Selected class does not exist' }, { status: 400 });
    }

    // Ensure class belongs to the selected teacher
    const classData = classCheck.rows[0];
    if (classData.teacher_id !== teacherId) {
      return NextResponse.json({ error: 'Selected class does not belong to the selected teacher' }, { status: 400 });
    }

    // Get class name for logging purposes
    const classNameRes = await query('SELECT name FROM classes WHERE id = $1', [classId]);
    const className = classNameRes.rows[0]?.name || 'Unknown';

    // Create the student user with required teacher and class assignment
    // Try to include teacher_id and class_id, but have fallback if columns don't exist yet
    let insertRes;
    try {
      insertRes = await query(
        'INSERT INTO users (first_name, last_name, email, password, lrn, role, teacher_id, class_id, class_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id',
        [firstName, lastName, email, password, lrn, 'USER', teacherId, classId, className]
      );
    } catch (dbError: any) {
      // If columns don't exist, try without them
      if (dbError.message.includes('teacher_id') || dbError.message.includes('class_id')) {
        console.warn('Columns teacher_id or class_id may not exist yet. Try running migrations.');
        return NextResponse.json({ 
          error: 'Database setup incomplete. Please run migrations: scripts/migrate-student-teacher-relationship.sql and scripts/migrate-student-class-relationship.sql',
          details: dbError.message 
        }, { status: 500 });
      }
      throw dbError;
    }
    
    const userId = insertRes.rows[0].id;

    // Create default preferences
    await query(
      'INSERT INTO preferences (user_id, dark_mode, sound_effects, learning_language, daily_goal) VALUES ($1, $2, $3, $4, $5)',
      [userId, false, true, 'tl', 20]
    );

    // Create default notifications
    await query(
      'INSERT INTO notifications (user_id, daily_reminders, friend_activity, weekly_report) VALUES ($1, $2, $3, $4)',
      [userId, true, true, true]
    );

    // Log the activity
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [userId, 'Student Registered', 'system', `Admin created student: ${firstName} ${lastName} (LRN: ${lrn}) | Teacher & Class: ${className}`]
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Admin Create Student Error:', error);
    return NextResponse.json({ 
      error: error.message?.includes('teacher_id') || error.message?.includes('class_id') 
        ? 'Database columns not found. Please run migrations first.'
        : 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
