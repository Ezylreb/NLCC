import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const classId = request.nextUrl.searchParams.get('classId');
    const className = request.nextUrl.searchParams.get('className');

    if (!classId && !className) {
      return NextResponse.json(
        { error: 'Class ID or class name is required' },
        { status: 400 }
      );
    }

    let result;

    if (classId) {
      // First try to get class name from classId
      const classInfo = await query(
        `SELECT name FROM classes WHERE id = $1`,
        [classId]
      );

      if (classInfo.rows.length > 0) {
        const resolvedClassName = classInfo.rows[0].name;
        result = await query(
          `SELECT id, title, yunit, class_name, teacher_id, created_at 
           FROM bahagi 
           WHERE class_name = $1
           ORDER BY created_at DESC`,
          [resolvedClassName]
        );
      } else {
        result = { rows: [] };
      }
    } else {
      // Use className directly
      result = await query(
        `SELECT id, title, yunit, class_name, teacher_id, created_at 
         FROM bahagi 
         WHERE class_name = $1
         ORDER BY created_at DESC`,
        [className]
      );
    }

    return NextResponse.json({
      bahagi: result.rows
    });
  } catch (error: any) {
    console.error('CRITICAL: Get Class Bahagi Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to retrieve bahagi', details: error?.message },
      { status: 500 }
    );
  }
}
