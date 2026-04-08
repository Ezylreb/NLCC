import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Fetch lessons for the class
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_id', classId);

    if (lessonsError) {
      console.error('Supabase error fetching lessons:', lessonsError);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }

    // Fetch yunits and assessments for each lesson
    const lessonsWithContent = await Promise.all(
      (lessons || []).map(async (lesson) => {
        // Fetch yunits
        const { data: yunits } = await supabase
          .from('yunits')
          .select('*')
          .eq('lesson_id', lesson.id);

        // Fetch assessments
        const { data: assessments } = await supabase
          .from('assessments')
          .select('*')
          .eq('lesson_id', lesson.id);

        return {
          ...lesson,
          yunits: yunits || [],
          assessments: assessments || []
        };
      })
    );

    return NextResponse.json({
      lessons: lessonsWithContent
    });
  } catch (error) {
    console.error('Error fetching class lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
