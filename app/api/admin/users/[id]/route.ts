import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query('SELECT id, first_name, last_name, email, lrn, role, class_name, class_id, teacher_id, teacher_role, created_at FROM users WHERE id = $1', [id]);
    
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = res.rows[0];
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Admin Fetch User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, lrn, role, className, teacher_id, class_id, teacher_role } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    // Role-based requirements for students
    if (role === 'USER') {
      if (!lrn) {
        return NextResponse.json({ error: 'LRN is required for student accounts' }, { status: 400 });
      }
      if (lrn.length > 12) {
        return NextResponse.json({ error: 'LRN cannot exceed 12 digits' }, { status: 400 });
      }
      if (lrn.length < 12) {
        return NextResponse.json({ error: 'LRN must be exactly 12 digits' }, { status: 400 });
      }
      // Teacher is required for students
      if (!teacher_id) {
        return NextResponse.json({ error: 'Teacher is required for student accounts' }, { status: 400 });
      }
      // Class is required for students
      if (!class_id) {
        return NextResponse.json({ error: 'Class is required for student accounts' }, { status: 400 });
      }
    }

    // Check if email is already taken by ANOTHER user
    const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Check if LRN is taken (only if LRN is provided and user is a student)
    if (lrn) {
      const lrnCheck = await query('SELECT id FROM users WHERE lrn = $1 AND id != $2', [lrn, id]);
      if (lrnCheck.rows.length > 0) {
        return NextResponse.json({ error: 'LRN already in use' }, { status: 400 });
      }
    }

    // Validate teacher exists if provided
    if (teacher_id) {
      const teacherCheck = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [teacher_id, 'TEACHER']);
      if (teacherCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Selected teacher does not exist' }, { status: 400 });
      }
    }

    // Validate class exists and belongs to teacher if provided
    if (class_id && teacher_id) {
      const classCheck = await query(
        'SELECT id, teacher_id FROM classes WHERE id = $1 AND is_archived = FALSE',
        [class_id]
      );
      if (classCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Selected class does not exist' }, { status: 400 });
      }
      const classData = classCheck.rows[0];
      if (classData.teacher_id !== teacher_id) {
        return NextResponse.json({ error: 'Selected class does not belong to the selected teacher' }, { status: 400 });
      }
    }

    // Get class name if class_id provided
    let classNameToSave = className;
    if (class_id) {
      const classNameRes = await query('SELECT name FROM classes WHERE id = $1', [class_id]);
      classNameToSave = classNameRes.rows[0]?.name || null;
    }

    await query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, lrn = $4, class_name = $5, teacher_id = $6, class_id = $7, teacher_role = $8, updated_at = NOW() WHERE id = $9',
      [firstName, lastName, email, lrn || null, classNameToSave || null, teacher_id || null, class_id || null, teacher_role || null, id]
    );

    // Log activity
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [id, 'User Updated', 'system', `Admin updated user: ${firstName} ${lastName} (ID: ${id})`]
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Optional: Get user info before delete for logging
    const userRes = await query('SELECT first_name, last_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRes.rows[0];

    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log activity
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [id, 'User Deleted', 'system', `Admin deleted user: ${user.first_name} ${user.last_name} (ID: ${id})`]
      );
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
