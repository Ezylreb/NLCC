import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, yunit, image, description, teacherId, className } = await request.json();

    if (!title || !yunit || !teacherId) {
      return NextResponse.json(
        { error: 'Title, Yunit, and Teacher ID are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO bahagi (title, yunit, image_url, description, teacher_id, class_name, is_open)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, title, yunit, image_url, description, is_open, created_at`,
      [title, yunit, image, description, teacherId, className]
    );

    return NextResponse.json({ bahagi: result.rows[0] });
  } catch (error) {
    console.error('Error creating bahagi:', error);
    return NextResponse.json(
      { error: 'Failed to create bahagi' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const className = searchParams.get('className');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    let query_str = 'SELECT * FROM bahagi WHERE teacher_id = $1';
    const params: any[] = [teacherId];

    if (className) {
      query_str += ' AND class_name = $2';
      params.push(className);
    }

    query_str += ' ORDER BY created_at DESC';

    const result = await query(query_str, params);

    // Enrich with counts
    const enriched = await Promise.all(
      result.rows.map(async (bahagi: any) => {
        const lessonsRes = await query(
          'SELECT COUNT(*) FROM lesson WHERE bahagi_id = $1',
          [bahagi.id]
        );
        const assessmentsRes = await query(
          'SELECT COUNT(*) FROM bahagi_assessment WHERE bahagi_id = $1',
          [bahagi.id]
        );
        const rewardsRes = await query(
          'SELECT SUM(amount) FROM bahagi_reward WHERE bahagi_id = $1 AND reward_type = $2',
          [bahagi.id, 'xp']
        );

        return {
          ...bahagi,
          lessonCount: parseInt(lessonsRes.rows[0].count),
          assessmentCount: parseInt(assessmentsRes.rows[0].count),
          totalXP: parseInt(rewardsRes.rows[0].sum) || 0
        };
      })
    );

    return NextResponse.json({ bahagis: enriched });
  } catch (error) {
    console.error('Error fetching bahagis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bahagis' },
      { status: 500 }
    );
  }
}
