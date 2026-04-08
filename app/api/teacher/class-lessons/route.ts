import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const className = searchParams.get('className');

    if (!classId && !className) {
      return NextResponse.json(
        { error: 'Class ID or Class Name is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching lessons for class: classId=${classId}, className=${className}`);

    // Fetch lessons for the class - use class_id first, then fall back to class_name
    let lessonsRes;
    if (classId) {
      lessonsRes = await query(
        `SELECT * FROM lessons WHERE class_id = $1 ORDER BY created_at DESC`,
        [classId]
      );
    } else {
      lessonsRes = await query(
        `SELECT * FROM lessons WHERE class_name = $1 ORDER BY created_at DESC`,
        [className]
      );
    }

    const lessons = lessonsRes.rows || [];
    console.log(`Found ${lessons.length} lessons`);

    // Fetch yunits and assessments for each lesson
    const lessonsWithContent = await Promise.all(
      lessons.map(async (lesson: any) => {
        // Fetch yunits
        const yunitsRes = await query(
          `SELECT id, title, content, media_url, published_at FROM yunits WHERE lesson_id = $1 ORDER BY created_at DESC`,
          [lesson.id]
        );

        // Fetch assessments
        const assessmentsRes = await query(
          `SELECT id, title, type, reward, published_at FROM assessments WHERE lesson_id = $1 ORDER BY created_at DESC`,
          [lesson.id]
        );

        return {
          ...lesson,
          yunits: yunitsRes.rows || [],
          assessments: assessmentsRes.rows || []
        };
      })
    );

    console.log(`Returning ${lessonsWithContent.length} lessons with content`);

    return NextResponse.json({
      lessons: lessonsWithContent
    });
  } catch (error: any) {
    console.error('Error fetching class lessons:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch lessons', details: error.message },
      { status: 500 }
    );
  }
}
