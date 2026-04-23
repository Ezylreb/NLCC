import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { LESSON_COMPLETION_XP } from '@/lib/constants/xp-rewards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const { studentId } = await request.json();

    console.log(`\n=== COMPLETE LESSON API CALLED ===`);
    console.log(`Lesson ID: ${lessonId}`);
    console.log(`Student ID: ${studentId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    if (!lessonId || !studentId) {
      return NextResponse.json(
        { error: 'Lesson ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Verify lesson exists and get bahagi info for rewards
    const lessonResult = await query(
      `SELECT l.id, l.bahagi_id, l.title FROM lesson l WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      console.log(`❌ Lesson not found: ${lessonId}`);
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const bahagiId = lessonResult.rows[0].bahagi_id;
    const lessonTitle = lessonResult.rows[0].title;
    console.log(`Lesson found: "${lessonTitle}" (Bahagi: ${bahagiId})`);

    // Keep coin rewards from Bahagi configuration, but standardize each yunit to fixed XP.
    const rewardsResult = await query(
      `SELECT reward_type, amount FROM bahagi_reward WHERE bahagi_id = $1`,
      [bahagiId]
    );

    const xpEarned = LESSON_COMPLETION_XP;
    let coinsEarned = 0;

    for (const reward of rewardsResult.rows) {
      if (reward.reward_type === 'coins') {
        coinsEarned = reward.amount;
      }
    }

    // Check if lesson progress already exists
    const existingProgress = await query(
      `SELECT id, completed, xp_earned, coins_earned
       FROM lesson_progress
       WHERE student_id = $1 AND lesson_id = $2`,
      [studentId, lessonId]
    );

    console.log(`Existing progress record: ${existingProgress.rows.length > 0 ? 'Found' : 'Not found'}`);
    if (existingProgress.rows.length > 0) {
      console.log(`  Current status: completed=${existingProgress.rows[0].completed}`);
    }

    const existingRecord = existingProgress.rows[0];
    const alreadyCompleted = Boolean(existingRecord?.completed);

    let result;
    let xpDelta = 0;
    let coinDelta = 0;

    if (alreadyCompleted) {
      const previousXp = Number(existingRecord.xp_earned || 0);
      const previousCoins = Number(existingRecord.coins_earned || 0);
      xpDelta = Math.max(0, xpEarned - previousXp);
      coinDelta = Math.max(0, coinsEarned - previousCoins);

      console.log(`Lesson already completed. Syncing rewards if needed...`);
      result = await query(
        `UPDATE lesson_progress
         SET xp_earned = $3,
             coins_earned = $4,
             updated_at = NOW()
         WHERE student_id = $1 AND lesson_id = $2
         RETURNING id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned`,
        [studentId, lessonId, xpEarned, coinsEarned]
      );
    } else if (existingProgress.rows.length > 0) {
      // Update existing record to mark as completed
      console.log(`Updating existing progress to completed=true...`);
      result = await query(
        `UPDATE lesson_progress 
         SET completed = true, 
             completion_date = NOW(), 
             xp_earned = $3, 
             coins_earned = $4,
             updated_at = NOW()
         WHERE student_id = $1 AND lesson_id = $2
         RETURNING id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned`,
        [studentId, lessonId, xpEarned, coinsEarned]
      );
      xpDelta = xpEarned;
      coinDelta = coinsEarned;
      console.log(`✅ UPDATE successful:`, result.rows[0]);
    } else {
      // Create new progress record
      console.log(`Creating new progress record with completed=true...`);
      result = await query(
        `INSERT INTO lesson_progress (student_id, lesson_id, completed, completion_date, xp_earned, coins_earned)
         VALUES ($1, $2, true, NOW(), $3, $4)
         RETURNING id, student_id, lesson_id, completed, completion_date, xp_earned, coins_earned`,
        [studentId, lessonId, xpEarned, coinsEarned]
      );
      xpDelta = xpEarned;
      coinDelta = coinsEarned;
      console.log(`✅ INSERT successful:`, result.rows[0]);
    }

    if (xpDelta > 0 || coinDelta > 0) {
      await query(
        `UPDATE users
         SET xp = COALESCE(xp, 0) + $1,
             coins = COALESCE(coins, 0) + $2
         WHERE id = $3`,
        [xpDelta, coinDelta, studentId]
      );
    }

    console.log(`=== COMPLETE LESSON API DONE ===\n`);

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
