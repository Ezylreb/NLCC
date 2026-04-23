import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ASSESSMENT_COMPLETION_XP } from '@/lib/constants/xp-rewards';

const getQuestionType = (assessment: any, question: any) =>
  question?.type || question?.question_type || assessment?.type || assessment?.assessment_type || 'multiple-choice';

const normalizeOptionText = (option: any) => {
  if (typeof option === 'string') {
    return option;
  }

  return option?.text ?? option?.option_text ?? '';
};

const normalizeMatchingPairs = (question: any) => {
  if (Array.isArray(question?.pairs) && question.pairs.length > 0) {
    return question.pairs.map((pair: any) => ({
      left: pair?.left ?? pair?.text ?? '',
      correctMatch: pair?.correctMatch ?? pair?.match ?? '',
    }));
  }

  if (!Array.isArray(question?.options)) {
    return [];
  }

  return question.options.map((option: any) => ({
    left: option?.left ?? option?.text ?? option?.option_text ?? '',
    correctMatch: option?.correctMatch ?? option?.match ?? '',
  }));
};

const isQuestionCorrect = (assessment: any, question: any, studentAnswer: any) => {
  const type = getQuestionType(assessment, question);

  if (type === 'multiple-choice') {
    return studentAnswer === question?.correctAnswer;
  }

  if (type === 'checkbox') {
    const correct = Array.isArray(question?.correctAnswer) ? question.correctAnswer : [];
    const given = Array.isArray(studentAnswer) ? studentAnswer : [];
    return JSON.stringify([...given].sort()) === JSON.stringify([...correct].sort());
  }

  if (type === 'short-answer') {
    const normalizedAnswer = String(studentAnswer ?? '').trim().toLowerCase();
    const expected = String(question?.correctAnswer ?? question?.correct_answer ?? '').trim().toLowerCase();
    if (!expected) {
      return normalizedAnswer.length > 0;
    }
    return normalizedAnswer === expected;
  }

  if (type === 'matching') {
    const pairs = normalizeMatchingPairs(question);
    return pairs.length > 0 && pairs.every((pair: any, idx: number) =>
      String(studentAnswer?.[idx] ?? '').trim().toLowerCase() === String(pair.correctMatch ?? '').trim().toLowerCase()
    );
  }

  if (type === 'scramble-word' || type === 'scramble') {
    const correctWords = Array.isArray(question?.correctAnswer)
      ? question.correctAnswer
      : Array.isArray(question?.scrambleWords)
        ? question.scrambleWords.map((word: any) => typeof word === 'string' ? word : word?.text ?? '')
        : [];
    const givenWords = Array.isArray(studentAnswer) ? studentAnswer : [];

    return JSON.stringify(givenWords.map((word: any) => String(word).trim().toLowerCase())) ===
      JSON.stringify(correctWords.map((word: any) => String(word).trim().toLowerCase()));
  }

  if (type === 'audio' || type === 'media-audio') {
    return studentAnswer === 'audio-recorded';
  }

  return false;
};

const getStudentProgressColumns = async () => {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'student_progress'`
  );

  return new Set(result.rows.map((row: any) => row.column_name));
};

const ensureStudentProgressSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id SERIAL PRIMARY KEY,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bahagi_id INT,
      yunit_id INT,
      score_percentage INT DEFAULT 0,
      is_passed BOOLEAN DEFAULT FALSE,
      xp_earned INT DEFAULT 0,
      coins_earned INT DEFAULT 0,
      attempts INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS bahagi_id INT`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS yunit_id INT`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS score_percentage INT DEFAULT 0`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT FALSE`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 0`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS coins_earned INT DEFAULT 0`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
};

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
      totalQuestions,
      isRetake
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

      if (question && isQuestionCorrect(assessment, question, studentAnswer)) {
        correctCount++;
      }
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= 75;

    // Get rewards for this yunit
    const rewardResult = await query(
      `SELECT * FROM bahagi_reward WHERE yunit_id = $1`,
      [yunitId]
    ).catch(() => ({ rows: [] }));

    // Save student progress
    await ensureStudentProgressSchema();
    const progressColumns = await getStudentProgressColumns().catch(() => new Set<string>());
    const hasRewardColumns = progressColumns.has('xp_earned') && progressColumns.has('coins_earned');
    const hasAttemptsColumn = progressColumns.has('attempts');

    const existingProgress = await query(
      `SELECT id, attempts
       FROM student_progress
       WHERE student_id = $1 AND yunit_id = $2
       LIMIT 1`,
      [studentId, yunitId]
    );

    const previousAttemptCount = parseInt(existingProgress.rows[0]?.attempts || 0, 10);
    const isRepeatAttempt = Boolean(isRetake) || previousAttemptCount > 0;

    let xpEarned = 0;
    let coinsEarned = 0;

    if (isPassed && !isRepeatAttempt) {
      xpEarned = ASSESSMENT_COMPLETION_XP;
      for (const reward of rewardResult.rows) {
        if (reward.reward_type === 'coins') {
          coinsEarned = reward.amount;
        }
      }
    }

    const progressResult = existingProgress.rows.length > 0
      ? hasRewardColumns && hasAttemptsColumn
        ? await query(
            `UPDATE student_progress
             SET bahagi_id = $3,
                 score_percentage = $4,
                 is_passed = $5,
                 xp_earned = $6,
                 coins_earned = $7,
                 attempts = COALESCE(attempts, 0) + 1,
                 updated_at = NOW()
             WHERE student_id = $1 AND yunit_id = $2
             RETURNING *`,
            [studentId, yunitId, bahagiId, scorePercentage, isPassed, xpEarned, coinsEarned]
          )
        : await query(
            `UPDATE student_progress
             SET bahagi_id = $3,
                 score_percentage = $4,
                 is_passed = $5,
                 updated_at = NOW()
             WHERE student_id = $1 AND yunit_id = $2
             RETURNING *`,
            [studentId, yunitId, bahagiId, scorePercentage, isPassed]
          )
      : hasRewardColumns && hasAttemptsColumn
        ? await query(
            `INSERT INTO student_progress 
             (student_id, bahagi_id, yunit_id, score_percentage, is_passed, xp_earned, coins_earned, attempts)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
             RETURNING *`,
            [studentId, bahagiId, yunitId, scorePercentage, isPassed, xpEarned, coinsEarned]
          )
        : await query(
            `INSERT INTO student_progress 
             (student_id, bahagi_id, yunit_id, score_percentage, is_passed)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [studentId, bahagiId, yunitId, scorePercentage, isPassed]
          );

    // Update student rewards (XP and coins)
    if (isPassed) {
      await query(
        `UPDATE users SET xp = COALESCE(xp, 0) + $1, coins = COALESCE(coins, 0) + $2 WHERE id = $3`,
        [xpEarned, coinsEarned, studentId]
      ).catch(() => null);
    }

    const totalAttempts = previousAttemptCount + 1;
    const retakeCount = Math.max(totalAttempts - 1, 0);

    return NextResponse.json({
      success: true,
      progress: progressResult.rows[0],
      scorePercentage: scorePercentage,
      isPassed: isPassed,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      totalAttempts,
      retakeCount,
      isRetake: isRepeatAttempt,
      xpEarned: xpEarned,
      coinsEarned: coinsEarned,
      message: isPassed 
        ? isRepeatAttempt
          ? `Natapos mo muli ang assessment na ito sa ${scorePercentage}%. Walang dagdag na XP o coins sa retake.`
          : `🎉 Congratulations! You passed with ${scorePercentage}%! Earned +${xpEarned} XP and +${coinsEarned} coins!`
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
