import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teacherId } = body;

    console.log(`Creating class: "${name}" for teacher: ${teacherId} (type: ${typeof teacherId})`);

    if (!name || !teacherId) {
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

      // Create the class
      const result = await query(
        `INSERT INTO classes (name, teacher_id, is_archived, created_at, updated_at)
         VALUES ($1, $2, false, NOW(), NOW())
         RETURNING id, name, teacher_id, is_archived, created_at, updated_at`,
        [name, teacherId]
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
      
      return NextResponse.json({
        class: {
          id: classData.id,
          name: classData.name,
          student_count: 0,
          lesson_count: 0,
          progress: 0,
          is_archived: classData.is_archived
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
