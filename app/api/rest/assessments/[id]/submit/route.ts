/**
 * Submit Assessment Answer
 * POST /api/rest/assessments/[id]/submit
 * Handles: validation, saving answer, awarding rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import AssessmentService from '@/lib/services/AssessmentService';
import GamificationService from '@/lib/services/GamificationService';
import { eventBus, EventType, type AssessmentSubmittedEvent } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();

    const {
      yunitId,
      studentId,
      studentAnswer,
      attemptNumber = 1,
    } = body;

    if (!yunitId || !studentId) {
      return NextResponse.json(
        { error: 'Yunit ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Get assessment
    const assessment = await AssessmentService.getById(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Validate answer
    const validation = await AssessmentService.validateAnswer(assessment, studentAnswer);

    // Save answer
    const savedAnswer = await AssessmentService.saveAnswer(
      yunitId,
      assessmentId,
      studentId,
      assessment,
      studentAnswer,
      attemptNumber
    );

    // Emit assessment submitted event (async handlers will process rewards, achievements, etc.)
    const submissionEvent: AssessmentSubmittedEvent = {
      type: EventType.ASSESSMENT_SUBMITTED,
      timestamp: new Date(),
      userId: studentId,
      assessmentId,
      studentId,
      yunitId,
      isCorrect: validation.isCorrect,
      pointsEarned: validation.pointsEarned,
      attemptNumber,
      assessmentType: assessment.assessment_type,
      metadata: {
        feedback: validation.feedback,
        partialCredit: validation.partialCredit,
      },
    };

    // Emit event (async handlers will process)
    await eventBus.emit(submissionEvent);

    return NextResponse.json({
      success: true,
      data: {
        answerId: savedAnswer.id,
        isCorrect: validation.isCorrect,
        pointsEarned: validation.pointsEarned,
        feedback: validation.feedback,
        correctAnswer: validation.correctAnswer,
        partialCredit: validation.partialCredit,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/rest/assessments/[id]/submit]', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment', detail: error.message },
      { status: 500 }
    );
  }
}
