import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get total XP and coins
    const totalsResult = await query(
      `SELECT 
        COALESCE(SUM(xp_earned), 0) as total_xp,
        COALESCE(SUM(coins_earned), 0) as total_coins
       FROM student_rewards WHERE student_id = $1`,
      [studentId]
    );

    // Get recent rewards
    const recentResult = await query(
      `SELECT * FROM student_rewards 
       WHERE student_id = $1 
       ORDER BY earned_at DESC 
       LIMIT 20`,
      [studentId]
    );

    // Get trophies
    const trophiesResult = await query(
      `SELECT * FROM trophies 
       WHERE student_id = $1 
       ORDER BY earned_at DESC`,
      [studentId]
    );

    return NextResponse.json({
      totals: totalsResult.rows[0],
      recentRewards: recentResult.rows,
      trophies: trophiesResult.rows
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { studentId, assessmentId, yunitId, xpEarned, coinsEarned } = await request.json();

    if (!studentId || (!xpEarned && !coinsEarned)) {
      return NextResponse.json({ error: 'Student ID and rewards required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO student_rewards (student_id, assessment_id, yunit_id, xp_earned, coins_earned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, assessmentId || null, yunitId || null, xpEarned || 0, coinsEarned || 0]
    );

    // Check if trophy should be awarded
    const totals = await query(
      `SELECT COUNT(*) as total_completions, SUM(xp_earned) as total_xp 
       FROM student_rewards WHERE student_id = $1`,
      [studentId]
    );

    const completions = parseInt(totals.rows[0].total_completions || 0);
    const totalXp = parseInt(totals.rows[0].total_xp || 0);

    // Award trophies based on milestones
    if (completions === 1) {
      await query(
        `INSERT INTO trophies (student_id, trophy_type, title, icon)
         VALUES ($1, 'first_lesson', 'First Lesson', '🎯')`,
        [studentId]
      );
    }

    if (totalXp >= 100 && completions >= 1) {
      const hasEarned = await query(
        `SELECT * FROM trophies WHERE student_id = $1 AND trophy_type = 'century_club'`,
        [studentId]
      );
      if (hasEarned.rows.length === 0) {
        await query(
          `INSERT INTO trophies (student_id, trophy_type, title, icon)
           VALUES ($1, 'century_club', '100 XP Club', '💯')`,
          [studentId]
        );
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}
