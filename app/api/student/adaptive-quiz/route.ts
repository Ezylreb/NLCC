import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ASSESSMENT_COMPLETION_XP } from '@/lib/constants/xp-rewards';

// Assign difficulty: 1=easy, 2=medium, 3=hard
function getDifficulty(type: string): number {
  switch (type) {
    case 'multiple-choice': return 1;
    case 'checkbox': return 1;
    case 'short-answer': return 2;
    case 'media-audio': return 2;
    case 'scramble': return 3;
    case 'scramble-word': return 3;
    case 'matching': return 3;
    default: return 1;
  }
}

// GET: Fetch all questions for a bahagi, organized for adaptive quiz
export async function GET(request: NextRequest) {
  try {
    const bahagiId = request.nextUrl.searchParams.get('bahagiId');
    const studentId = request.nextUrl.searchParams.get('studentId');

    if (!bahagiId || !studentId) {
      return NextResponse.json({ error: 'bahagiId and studentId required' }, { status: 400 });
    }

    // Fetch all assessments for this bahagi
    const result = await query(
      `SELECT id, title, type, content, points, assessment_order
       FROM bahagi_assessment
       WHERE bahagi_id = $1 AND (is_archived IS NULL OR is_archived = false)
       ORDER BY assessment_order ASC, id ASC`,
      [bahagiId]
    );

    // Flatten all questions from assessments
    const allQuestions: any[] = [];
    for (const assessment of result.rows) {
      const content = typeof assessment.content === 'string'
        ? (() => {
            try {
              return JSON.parse(assessment.content);
            } catch {
              return null;
            }
          })()
        : assessment.content;

      const questions = content?.questions;
      if (questions && Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qType = q.type || assessment.type;

          // Build pairs for matching questions from options if pairs not set
          let pairs = q.pairs || null;
          if (qType === 'matching' && !pairs && Array.isArray(q.options)) {
            const matchOptions = q.options.filter((o: any) => o && (o.match || o.text));
            const shuffledMatches = matchOptions
              .map((o: any) => o.match || o.text || '')
              .sort(() => Math.random() - 0.5);
            pairs = matchOptions.map((o: any) => ({
              left: o.text || '',
              correctMatch: o.match || o.text || '',
              rightOptions: shuffledMatches,
            }));
          }

          // Normalize options to strings for non-matching types
          const options = qType !== 'matching' && Array.isArray(q.options)
            ? q.options.map((o: any) => typeof o === 'string' ? o : (o?.text || ''))
            : q.options || null;

          // For scramble-word, derive correctAnswer from scrambleWords if not explicitly set
          let correctAnswer = q.correctAnswer ?? null;
          if (!correctAnswer && (qType === 'scramble-word' || qType === 'scramble') && q.scrambleWords?.length) {
            correctAnswer = q.scrambleWords.map((w: any) => (typeof w === 'string' ? w : w.text || '').trim()).filter(Boolean);
          }

          allQuestions.push({
            id: `${assessment.id}-${i}`,
            assessmentId: assessment.id,
            type: qType,
            question: q.question || assessment.title,
            options,
            correctAnswer,
            questionMedia: q.questionMedia || null,
            scrambleWords: q.scrambleWords || null,
            pairs,
            xp: q.xp || 10,
            coins: q.coins || 5,
            points: q.xp || assessment.points || 10,
            difficulty: getDifficulty(qType),
          });
        }
      } else {
        // Fallback: use top-level assessment fields as a single question
        if (assessment.title) {
          allQuestions.push({
            id: `${assessment.id}-0`,
            assessmentId: assessment.id,
            type: assessment.type,
            question: assessment.title,
            options: assessment.options || null,
            correctAnswer: assessment.correct_answer ?? null,
            questionMedia: null,
            scrambleWords: null,
            pairs: null,
            xp: 10,
            coins: 5,
            points: assessment.points || 10,
            difficulty: getDifficulty(assessment.type),
          });
        }
      }
    }

    // Sort by difficulty for adaptive ordering
    const sorted = allQuestions.sort((a, b) => a.difficulty - b.difficulty);

    return NextResponse.json({
      success: true,
      bahagiId: Number(bahagiId),
      totalQuestions: sorted.length,
      questions: sorted,
      previousAttempts: 0,
    });
  } catch (error: any) {
    console.error('[GET /api/student/adaptive-quiz] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Submit completed adaptive quiz results
export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      bahagiId,
      answers,        // Array of { questionId, answer, isCorrect }
      totalQuestions,
      correctCount,
      difficultyLevel,
      timeSpent,
    } = await request.json();

    if (!studentId || !bahagiId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= 75;
    const assessmentIds = [...new Set(
      (Array.isArray(answers) ? answers : [])
        .map((answer: any) => String(answer?.questionId || '').split('-')[0])
        .filter(Boolean)
    )];

    // Standardize assessment/quiz XP while preserving coin scaling.
    const baseCoins = 5;
    const difficultyMultiplier = difficultyLevel || 1;
    const xpEarned = isPassed ? ASSESSMENT_COMPLETION_XP : 0;
    const coinsEarned = isPassed ? Math.round(correctCount * baseCoins * difficultyMultiplier) : Math.round(correctCount * 1);

    const saveResponsesTask = Promise.allSettled(
      (Array.isArray(answers) ? answers : []).map((answer: any) => {
        const assessmentId = String(answer?.questionId || '').split('-')[0];
        if (!assessmentId) {
          return Promise.resolve();
        }

        return query(
          `INSERT INTO assessment_responses 
           (assessment_id, student_id, response_data, is_correct, score, attempted_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [assessmentId, studentId, JSON.stringify(answer.answer), answer.isCorrect, answer.isCorrect ? 1 : 0]
        ).catch(() => {
          // Ignore duplicate insert errors.
          return null;
        });
      })
    );

    const updateRewardsTask = (xpEarned > 0 || coinsEarned > 0)
      ? query(
          `UPDATE users SET xp = COALESCE(xp, 0) + $1, coins = COALESCE(coins, 0) + $2 WHERE id = $3`,
          [xpEarned, coinsEarned, studentId]
        )
      : Promise.resolve();

    const progressAssessmentId = assessmentIds[0];
    const updateProgressTask = progressAssessmentId
      ? query(
          `INSERT INTO lesson_progress (student_id, lesson_id, completed, completion_date, xp_earned, coins_earned, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), NOW())
           ON CONFLICT (student_id, lesson_id) DO UPDATE SET
             completed = GREATEST(lesson_progress.completed::int, $3::int)::boolean,
             xp_earned = GREATEST(lesson_progress.xp_earned, $4),
             coins_earned = GREATEST(lesson_progress.coins_earned, $5),
             completion_date = NOW(),
             updated_at = NOW()`,
          [studentId, progressAssessmentId, isPassed, xpEarned, coinsEarned]
        ).catch((err) => {
          console.error('[POST /api/student/adaptive-quiz] Progress save error:', err);
          return null;
        })
      : Promise.resolve();

    await Promise.all([saveResponsesTask, updateRewardsTask, updateProgressTask]);

    return NextResponse.json({
      success: true,
      scorePercentage,
      isPassed,
      correctCount,
      totalQuestions,
      xpEarned,
      coinsEarned,
      message: isPassed
        ? `🎉 Mahusay! You scored ${scorePercentage}%! Earned +${xpEarned} XP and +${coinsEarned} coins!`
        : `Score: ${scorePercentage}%. You need 75% to pass. Keep practicing!`,
    });
  } catch (error: any) {
    console.error('[POST /api/student/adaptive-quiz] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz', details: error.message },
      { status: 500 }
    );
  }
}
