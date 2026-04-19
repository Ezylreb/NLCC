/**
 * Assessment Service
 * Business logic for quiz/test management and answer validation
 */

import { repositories } from '@/lib/database/repository';
import type { BahagiAssessment, YunitAnswer } from '@/lib/database/types';

export class AssessmentService {
  /**
   * Create a new Assessment
   */
  static async create(data: {
    bahagi_id: string | number;
    lesson_id?: string | number;
    title: string;
    assessment_type: string;
    content?: Record<string, any>;
    options?: Record<string, any>;
    correct_answers?: Record<string, any>;
    points?: number;
  }): Promise<BahagiAssessment> {
    // Map field names to actual DB columns
    const dbData: Record<string, any> = {
      bahagi_id: data.bahagi_id,
      title: data.title,
      type: data.assessment_type,  // DB column is 'type', not 'assessment_type'
      points: data.points || 10,
      is_published: false,
      is_archived: false,
    };
    if (data.lesson_id) dbData.lesson_id = data.lesson_id;
    if (data.content) dbData.content = JSON.stringify(data.content);
    if (data.options) dbData.options = JSON.stringify(data.options);
    if (data.correct_answers) dbData.correct_answer = JSON.stringify(data.correct_answers); // DB column is 'correct_answer' (singular)

    return repositories.assessment.create(dbData as any);
  }

  /**
   * Update Assessment
   */
  static async update(id: string, data: Partial<BahagiAssessment>): Promise<BahagiAssessment | null> {
    return repositories.assessment.update(id, data as any);
  }

  /**
   * Get Assessment by ID
   */
  static async getById(id: string): Promise<BahagiAssessment | null> {
    return repositories.assessment.findById(id);
  }

  /**
   * List assessments for a Bahagi
   */
  static async listByBahagi(bahagiId: string) {
    return repositories.assessment.findAll({
      where: { bahagi_id: bahagiId },
      orderBy: 'created_at DESC',
    });
  }

  /**
   * List assessments for a Yunit (Lesson)
   */
  static async listByYunit(yunitId: string) {
    return repositories.assessment.findAll({
      where: { lesson_id: yunitId },
      orderBy: 'created_at DESC',
    });
  }

  /**
   * Publish Assessment
   */
  static async publish(id: string): Promise<BahagiAssessment | null> {
    return repositories.assessment.update(id, { is_published: true } as any);
  }

  /**
   * Unpublish Assessment
   */
  static async unpublish(id: string): Promise<BahagiAssessment | null> {
    return repositories.assessment.update(id, { is_published: false } as any);
  }

  /**
   * Archive Assessment
   */
  static async archive(id: string): Promise<BahagiAssessment | null> {
    return repositories.assessment.update(id, { is_archived: true } as any);
  }

  /**
   * Restore Assessment
   */
  static async restore(id: string): Promise<BahagiAssessment | null> {
    return repositories.assessment.update(id, { is_archived: false } as any);
  }

  /**
   * Delete Assessment permanently
   */
  static async delete(id: string): Promise<boolean> {
    return repositories.assessment.delete(id, false);
  }

  /**
   * Validate student answer
   */
  static async validateAnswer(
    assessment: BahagiAssessment,
    studentAnswer: any
  ): Promise<{
    isCorrect: boolean;
    pointsEarned: number;
    feedback: string;
    correctAnswer: any;
    partialCredit: boolean;
  }> {
    let isCorrect = false;
    let pointsEarned = 0;
    let correctAnswer: any = null;
    let feedback = '';
    let partialCredit = false;

    // Support both DB column name (type) and legacy alias (assessment_type)
    const assessmentType = assessment.type || assessment.assessment_type;
    // Support both DB column name (correct_answer) and legacy alias (correct_answers)
    const correctData = assessment.correct_answer || assessment.correct_answers;

    switch (assessmentType) {
      case 'multiple-choice': {
        isCorrect = studentAnswer === correctData?.answer;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = correctData?.answer;
        feedback = isCorrect ? 'Correct!' : `The correct answer is: ${correctAnswer}`;
        break;
      }

      case 'short-answer': {
        const normalized = String(studentAnswer).toLowerCase().trim();
        const correctNormalized = String(correctData?.answer).toLowerCase().trim();
        isCorrect = normalized === correctNormalized;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = correctData?.answer;
        feedback = isCorrect ? 'Correct!' : `Expected: ${correctAnswer}`;
        break;
      }

      case 'checkbox': {
        const correctAnswers = Array.isArray(correctData?.answers)
          ? correctData.answers
          : [];
        const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];

        const correctCount = studentAnswers.filter((ans: string) => correctAnswers.includes(ans)).length;
        const incorrectCount = studentAnswers.filter((ans: string) => !correctAnswers.includes(ans)).length;

        isCorrect =
          studentAnswers.length === correctAnswers.length && correctCount === correctAnswers.length && incorrectCount === 0;

        if (isCorrect) {
          pointsEarned = assessment.points;
        } else if (correctCount > 0) {
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
            ? `Partial credit: ${correctCount}/${correctAnswers.length} correct`
            : `Expected: ${correctAnswers.join(', ')}`;
        break;
      }

      case 'matching': {
        const correctPairs = correctData?.pairs || {};
        const studentPairs = studentAnswer || {};

        const matchCount = Object.entries(correctPairs).filter(([key, value]) => studentPairs[key] === value).length;
        const totalPairs = Object.keys(correctPairs).length;

        isCorrect = matchCount === totalPairs;
        pointsEarned = isCorrect ? assessment.points : Math.round((assessment.points * matchCount) / totalPairs);
        partialCredit = !isCorrect && matchCount > 0;

        correctAnswer = correctPairs;
        feedback = isCorrect
          ? 'Correct! All pairs match.'
          : partialCredit
            ? `Partial credit: ${matchCount}/${totalPairs} pairs correct`
            : 'No pairs matched correctly';
        break;
      }

      case 'scramble-word': {
        const correctWord = String(correctData?.word).toLowerCase().trim();
        const studentWord = String(studentAnswer).toLowerCase().trim();
        isCorrect = studentWord === correctWord;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = correctWord;
        feedback = isCorrect ? 'Correct!' : `The correct word is: ${correctWord}`;
        break;
      }

      case 'audio':
      case 'media-audio': {
        // Audio answers are submitted for teacher review — award points on submission
        feedback = 'Audio answer submitted for review';
        pointsEarned = question.points || 1;
        isCorrect = true;
        partialCredit = false;
        break;
      }

      default: {
        feedback = 'Unknown assessment type';
      }
    }

    return {
      isCorrect,
      pointsEarned,
      feedback,
      correctAnswer,
      partialCredit,
    };
  }

  /**
   * Save student answer
   */
  static async saveAnswer(
    yunitId: string,
    assessmentId: string,
    studentId: string,
    assessment: BahagiAssessment,
    studentAnswer: any,
    attemptNumber: number = 1
  ): Promise<YunitAnswer> {
    const validation = await this.validateAnswer(assessment, studentAnswer);

    return repositories.answer.create({
      yunit_id: yunitId,
      assessment_id: assessmentId,
      student_id: studentId,
      student_answer: studentAnswer,
      is_correct: validation.isCorrect,
      points_earned: validation.pointsEarned,
      assessment_type: assessment.type || assessment.assessment_type,
      attempt_number: attemptNumber,
      submitted_at: new Date(),
    } as any);
  }

  /**
   * Get student's previous attempts
   */
  static async getAttempts(assessmentId: string, studentId: string) {
    return repositories.answer.findAll({
      where: { assessment_id: assessmentId, student_id: studentId },
      orderBy: 'submitted_at DESC',
    });
  }

  /**
   * Validate assessment data
   */
  static validateCreateData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.bahagi_id) {
      errors.push('Bahagi ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (!data.assessment_type) {
      errors.push('Assessment type is required');
    }

    const validTypes = ['multiple-choice', 'short-answer', 'checkbox', 'audio', 'media-audio', 'matching', 'scramble-word'];
    if (data.assessment_type && !validTypes.includes(data.assessment_type)) {
      errors.push(`Invalid assessment type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Points is optional (defaults to 10, or summed from questions)
    if (data.points !== undefined && data.points !== null && (typeof data.points !== 'number' || data.points <= 0)) {
      errors.push('Points must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AssessmentService;
