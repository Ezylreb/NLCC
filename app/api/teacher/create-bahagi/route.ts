import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, classId, className, teacherId } = body;

    if (!title || !teacherId) {
      return NextResponse.json(
        { error: 'Title and teacher ID are required' },
        { status: 400 }
      );
    }

    if (!classId && !className) {
      return NextResponse.json(
        { error: 'Either class ID or class name is required' },
        { status: 400 }
      );
    }

    // Get class info if classId provided
    let finalClassName = className;
    if (classId && !className) {
      const classResult = await query(
        `SELECT name FROM classes WHERE id = $1`,
        [classId]
      );
      if (classResult.rows.length > 0) {
        finalClassName = classResult.rows[0].name;
      }
    }

    // Create bahagi in database
    const result = await query(
      `INSERT INTO bahagi (title, yunit, class_name, teacher_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, title, yunit, class_name, teacher_id, created_at`,
      [title, 'Yunit 1', finalClassName || null, teacherId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create bahagi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bahagi: result.rows[0]
    });
  } catch (error: any) {
    console.error('CRITICAL: Create Bahagi Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to create bahagi', details: error?.message },
      { status: 500 }
    );
  }
}
