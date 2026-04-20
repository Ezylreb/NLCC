import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const yunitId = request.nextUrl.searchParams.get('yunitId');

    if (!studentId || !yunitId) {
      return NextResponse.json(
        { error: 'Student ID and Yunit ID required' },
        { status: 400 }
      );
    }

    // Get assessments for this yunit
    const assessmentResult = await query(
      `SELECT * FROM bahagi_assessment
       WHERE lesson_id = $1
       ORDER BY assessment_order ASC`,
      [yunitId]
    );

    const assessments = assessmentResult.rows.map((assessment: any) => ({
      ...assessment,
      questions: assessment.content?.questions || []
    }));

    return NextResponse.json({
      assessments: assessments
    });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      yunitId,
      bahagiId,
      assessmentId,
      answers,
      totalQuestions
    } = await request.json();

    if (!studentId || !yunitId || !assessmentId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get assessment to check correct answers
    const assessmentResult = await query(
      `SELECT * FROM bahagi_assessment WHERE id = $1`,
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const assessment = assessmentResult.rows[0];
    const questions = assessment.content?.questions || [];

    // Calculate score
    let correctCount = 0;
    for (let i = 0; i < answers.length; i++) {
      const question = questions[i];
      const studentAnswer = answers[i];

      if (assessment.type === 'multiple-choice' || assessment.type === 'checkbox') {
        if (studentAnswer === question.correctAnswer || 
            (Array.isArray(question.correctAnswer) && 
             JSON.stringify(studentAnswer) === JSON.stringify(question.correctAnswer))) {
          correctCount++;
        }
      } else if (assessment.type === 'matching') {
        // For matching, check if all pairs are correct
        const pairsCorrect = question.pairs?.every((pair: any, idx: number) => 
          studentAnswer[idx] === pair.correctMatch
        );
        if (pairsCorrect) {
          correctCount++;
        }
      } else if (assessment.type === 'scramble-word' || assessment.type === 'scramble') {
        if (studentAnswer?.toLowerCase() === question.correctAnswer?.toLowerCase()) {
          correctCount++;
        }
      }
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= 75;

    // Get rewards for this yunit
    const rewardResult = await query(
      `SELECT * FROM bahagi_reward WHERE yunit_id = $1`,
      [yunitId]
    );

    let xpEarned = 0;
    let coinsEarned = 0;

    if (isPassed) {
      for (const reward of rewardResult.rows) {
        if (reward.reward_type === 'xp') {
          xpEarned = reward.amount;
        } else if (reward.reward_type === 'coins') {
          coinsEarned = reward.amount;
        }
      }
    }

    // Save student progress
    const progressResult = await query(
      `INSERT INTO student_progress 
       (student_id, bahagi_id, yunit_id, score_percentage, is_passed, xp_earned, coins_earned, attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
       ON CONFLICT (student_id, yunit_id) DO UPDATE SET
         score_percentage = $4,
         is_passed = $5,
         xp_earned = $6,
         coins_earned = $7,
         attempts = attempts + 1,
         updated_at = NOW()
       RETURNING *`,
      [studentId, bahagiId, yunitId, scorePercentage, isPassed, xpEarned, coinsEarned]
    );

    // Update student rewards (XP and coins)
    if (isPassed) {
      await query(
        `UPDATE users SET xp = xp + $1, coins = coins + $2 WHERE id = $3`,
        [xpEarned, coinsEarned, studentId]
      );
    }

    return NextResponse.json({
      success: true,
      progress: progressResult.rows[0],
      scorePercentage: scorePercentage,
      isPassed: isPassed,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      xpEarned: xpEarned,
      coinsEarned: coinsEarned,
      message: isPassed 
        ? `🎉 Congratulations! You passed with ${scorePercentage}%! Earned +${xpEarned} XP and +${coinsEarned} coins!`
        : `Score: ${scorePercentage}%. Try again to pass (need 75%)`
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment', details: error.message },
      { status: 500 }
    );
  }
}
