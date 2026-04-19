import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teacherId, teacher_id } = body;
    const finalTeacherId = teacherId || teacher_id;

    console.log(`Creating class: "${name}" for teacher: ${finalTeacherId} (type: ${typeof finalTeacherId})`);

    if (!name || !finalTeacherId) {
      return NextResponse.json(
        { error: 'Class name and teacher ID are required' },
        { status: 400 }
      );
    }

    try {
      // First, ensure the classes table exists
      await query(`
        CREATE TABLE IF NOT EXISTS classes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          is_archived BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure class_enrollments table exists
      await query(`
        CREATE TABLE IF NOT EXISTS class_enrollments (
          id SERIAL PRIMARY KEY,
          class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          enrolled_by_teacher_id UUID REFERENCES users(id),
          enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(class_id, student_id)
        )
      `);

      // Create indexes for better query performance
      await query(`
        CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
        CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
      `).catch(() => {
        // Ignore index creation errors
      });

      // Create the class
      const result = await query(
        `INSERT INTO classes (name, teacher_id, is_archived, created_at, updated_at)
         VALUES ($1, $2, false, NOW(), NOW())
         RETURNING id, name, teacher_id, is_archived, created_at, updated_at`,
        [name, finalTeacherId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.error('Failed to insert class');
        return NextResponse.json(
          { error: 'Failed to create class' },
          { status: 500 }
        );
      }

      const classData = result.rows[0];
      console.log(`✅ Class created successfully:`, {
        id: classData.id,
        name: classData.name,
        teacher_id: classData.teacher_id,
        created_at: classData.created_at
      });
      
      // Create enrollment records for all students assigned to this teacher
      try {
        await query(
          `INSERT INTO class_enrollments (class_id, student_id)
           SELECT $1, id FROM users WHERE role = 'USER' AND teacher_id = $2
           ON CONFLICT DO NOTHING`,
          [classData.id, finalTeacherId]
        );
        console.log(`✅ Enrollment records created for class ${classData.id}`);
      } catch (enrollmentError: any) {
        console.warn('Warning: Could not create enrollment records:', enrollmentError.message);
        // Don't fail the class creation if enrollments fail
      }
      
      return NextResponse.json({
        success: true,
        data: {
          class: {
            id: classData.id,
            name: classData.name,
            student_count: 0,
            lesson_count: 0,
            progress: 0,
            is_archived: classData.is_archived
          }
        }
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // If it's a table doesn't exist error, try again
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        return NextResponse.json(
          { error: 'Database tables not initialized. Please run migration first.' },
          { status: 500 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
