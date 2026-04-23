import { NextRequest, NextResponse } from 'next/server';

// Enhanced answer validation with partial credit support
export async function POST(req: NextRequest) {
  try {
    const { assessment, studentAnswer, assessmentType } = await req.json();

    if (!assessment || studentAnswer === undefined) {
      return NextResponse.json(
        { error: 'Missing assessment or answer' },
        { status: 400 }
      );
    }

    let isCorrect = false;
    let pointsEarned = 0;
    let correctAnswer: any = null;
    let feedback = '';
    let partialCredit = false;

    switch (assessmentType) {
      case 'multiple-choice': {
        isCorrect = studentAnswer === assessment.correctAnswer;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = assessment.correctAnswer;
        feedback = isCorrect ? 'Correct!' : `The correct answer is: ${assessment.correctAnswer}`;
        break;
      }

      case 'short-answer': {
        const normalized = studentAnswer.toLowerCase().trim();
        const correctNormalized = assessment.correctAnswer.toLowerCase().trim();
        isCorrect = normalized === correctNormalized;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = assessment.correctAnswer;
        feedback = isCorrect ? 'Correct!' : `Expected: ${assessment.correctAnswer}`;
        break;
      }

      case 'checkbox': {
        const correctAnswers = Array.isArray(assessment.correctAnswers)
          ? assessment.correctAnswers
          : assessment.options;

        const studentAnswers = Array.isArray(studentAnswer)
          ? studentAnswer
          : [studentAnswer];

        // Calculate partial credit
        const correctCount = studentAnswers.filter((ans: string) =>
          correctAnswers.includes(ans)
        ).length;

        const incorrectCount = studentAnswers.filter((ans: string) =>
          !correctAnswers.includes(ans)
        ).length;

        // Full credit only if all selections match exactly
        isCorrect = studentAnswers.length === correctAnswers.length &&
          correctCount === correctAnswers.length &&
          incorrectCount === 0;

        if (isCorrect) {
          pointsEarned = assessment.points;
        } else if (correctCount > 0) {
          // Partial credit: award points for correct selections
          const partialPercentage = correctCount / correctAnswers.length;
          pointsEarned = Math.round(assessment.points * partialPercentage);
          partialCredit = true;
        } else {
          pointsEarned = 0;
        }

        correctAnswer = correctAnswers;
        feedback = isCorrect
          ? 'Correct! All selections match.'
          : partialCredit
          ? `Partial credit: ${correctCount}/${correctAnswers.length} correct selections`
          : `Expected: ${correctAnswers.join(', ')}`;
        break;
      }

      case 'matching': {
        const studentPairs = studentAnswer; // Object: { index: selectedValue }
        const correctPairs = assessment.options; // Array: [{ left, right }]

        let matchedCount = 0;

        for (const [indexStr, selectedRight] of Object.entries(studentPairs)) {
          const index = parseInt(indexStr);
          if (index < correctPairs.length && correctPairs[index].right === selectedRight) {
            matchedCount++;
          }
        }

        isCorrect = matchedCount === correctPairs.length;

        if (isCorrect) {
          pointsEarned = assessment.points;
        } else if (matchedCount > 0) {
          // Partial credit: award points for correct matches
          const partialPercentage = matchedCount / correctPairs.length;
          pointsEarned = Math.round(assessment.points * partialPercentage);
          partialCredit = true;
        } else {
          pointsEarned = 0;
        }

        correctAnswer = assessment.options.map((opt: any) => opt.right);
        feedback = isCorrect
          ? 'All pairs matched correctly!'
          : partialCredit
          ? `Partial credit: ${matchedCount}/${correctPairs.length} pairs matched`
          : 'No pairs matched. Try again.';
        break;
      }

      case 'scramble-word': {
        const studentOrder = Array.isArray(studentAnswer) ? studentAnswer : [];
        const correctOrder = assessment.correctOrder || assessment.options || [];

        isCorrect = JSON.stringify(studentOrder) === JSON.stringify(correctOrder);
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = correctOrder;
        feedback = isCorrect ? 'Words in correct order!' : `Expected order: ${correctOrder.join(' ')}`;
        break;
      }

      case 'audio': {
        // Audio validation with file checks
        const audioFile = studentAnswer?.file || studentAnswer?.url;
        const audioMeta = studentAnswer?.metadata || {};
        
        // Validate audio file exists and has reasonable duration
        const duration = audioMeta.duration || 0;
        const isValidAudio = audioFile && (typeof audioFile === 'string' && audioFile.length > 0);
        const hasMinimalDuration = duration > 3; // At least 3 seconds
        
        isCorrect = false; // Audio always requires manual review
        pointsEarned = 0; // Pending teacher review
        correctAnswer = assessment.instructions || 'Audio recording received';
        
        if (!isValidAudio) {
          feedback = '❌ Audio file not found. Please re-record and submit.';
        } else if (!hasMinimalDuration && duration > 0) {
          feedback = '⚠️ Audio is very short (less than 3 seconds). Teacher will review.';
        } else {
          feedback = `✅ Audio recorded successfully (${duration?.toFixed(1)}s). Teacher will grade this submission.`;
        }
        
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown assessment type: ${assessmentType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      isCorrect,
      pointsEarned,
      totalPoints: assessment.points,
      correctAnswer,
      feedback,
      partialCredit,
      assessmentType
    });
  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json(
      { error: 'Failed to validate answer' },
      { status: 500 }
    );
  }
}
