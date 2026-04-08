import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const { studentId } = await request.json();

    if (!lessonId || !studentId) {
      return NextResponse.json(
        { error: 'Lesson ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Verify lesson exists and get bahagi info for rewards
    const lessonResult = await query(
      `SELECT l.id, l.bahagi_id FROM lesson l WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const bahagiId = lessonResult.rows[0].bahagi_id;

    // Get rewards for this Bahagi
    const rewardsResult = await query(
      `SELECT reward_type, amount FROM bahagi_reward WHERE bahagi_id = $1`,
      [bahagiId]
    );

    let xpEarned = 0;
    let coinsEarned = 0;

    for (const reward of rewardsResult.rows) {
      if (reward.reward_type === 'xp') {
        xpEarned = reward.amount;
      } else if (reward.reward_type === 'coins') {
        coinsEarned = reward.amount;
      }
    }

    // Check if lesson progress already exists
    const existingProgress = await query(
      `SELECT id FROM lesson_progress WHERE student_id = $1 AND lesson_id = $2`,
      [studentId, lessonId]
    );

    let result;
    if (existingProgress.rows.length > 0) {
      // Already completed, return existing record
      result = await query(
        `SELECT id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned
         FROM lesson_progress
         WHERE student_id = $1 AND lesson_id = $2`,
        [studentId, lessonId]
      );
    } else {
      // Create new progress record
      result = await query(
        `INSERT INTO lesson_progress (student_id, lesson_id, completed, completion_date, xp_earned, coins_earned)
         VALUES ($1, $2, true, NOW(), $3, $4)
         RETURNING id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned`,
        [studentId, lessonId, xpEarned, coinsEarned]
      );
    }

    return NextResponse.json({ 
      progress: result.rows[0],
      rewards: { xp: xpEarned, coins: coinsEarned }
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!lessonId || !studentId) {
      return NextResponse.json(
        { error: 'Lesson ID and Student ID are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned
       FROM lesson_progress
       WHERE student_id = $1 AND lesson_id = $2`,
      [studentId, lessonId]
    );

    return NextResponse.json({ 
      progress: result.rows.length > 0 ? result.rows[0] : null 
    });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}
