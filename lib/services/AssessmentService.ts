/**
 * Assessment Service
 * Business logic for quiz/test management and answer validation
 */

import { repositories } from '@/lib/database/repository';
import type { BahagiAssessment, YunitAnswer } from '@/lib/database/types';

export class AssessmentService {
  private static normalizeType(type?: string): 'multiple-choice' | 'short-answer' | 'checkbox' | 'audio' | 'matching' | 'scramble-word' {
    const typeMap: Record<string, 'multiple-choice' | 'short-answer' | 'checkbox' | 'audio' | 'matching' | 'scramble-word'> = {
      'multiple-choice': 'multiple-choice',
      'short-answer': 'short-answer',
      checkbox: 'checkbox',
      audio: 'audio',
      'media-audio': 'audio',
      matching: 'matching',
      scramble: 'scramble-word',
      'scramble-word': 'scramble-word',
    };

    return typeMap[type || 'multiple-choice'] || 'multiple-choice';
  }

  private static transformAssessment(row: Record<string, any>, options?: { studentView?: boolean }): any {
    const content = typeof row.content === 'string'
      ? (() => {
          try {
            return JSON.parse(row.content);
          } catch {
            return null;
          }
        })()
      : row.content;

    const questions = Array.isArray(content?.questions)
      ? content.questions.map((question: any, questionIndex: number) => this.normalizeQuestionForClient(question, questionIndex, options))
      : [];
    const computedPoints = content?.totalPoints
      ?? row.points
      ?? questions.reduce((sum: number, question: any) => sum + (Number(question?.xp) || 0), 0);

    return {
      ...row,
      content,
      type: row.type || row.assessment_type,
      assessment_type: row.type || row.assessment_type,
      instructions: content?.instructions || row.description || '',
      description: content?.instructions || row.description || '',
      questions,
      correct_answers: questions[0] ? this.buildCorrectAnswers(questions[0]) : undefined,
      points: computedPoints,
      reward: computedPoints,
    };
  }

  private static buildCorrectAnswers(question: any) {
    const normalizedType = this.normalizeType(question?.type || question?.question_type);

    if (normalizedType === 'short-answer') {
      return {
        answer: typeof question?.correctAnswer === 'string'
          ? question.correctAnswer.trim()
          : typeof question?.correct_answer === 'string'
            ? question.correct_answer.trim()
            : '',
      };
    }

    if (normalizedType === 'checkbox') {
      return {
        answers: Array.isArray(question?.correctAnswer)
          ? question.correctAnswer
          : Array.isArray(question?.correct_answer)
            ? question.correct_answer
            : [],
      };
    }

    if (normalizedType === 'matching') {
      return {
        pairs: question?.correctAnswer ?? question?.correct_answer ?? {},
      };
    }

    if (normalizedType === 'scramble-word') {
      return {
        answer: question?.correctAnswer ?? question?.correct_answer ?? [],
      };
    }

    return {
      answer: question?.correctAnswer ?? question?.correct_answer ?? 0,
    };
  }

  private static normalizeQuestionTypeForClient(type?: string): string {
    const typeMap: Record<string, string> = {
      audio: 'media-audio',
      'scramble-word': 'scramble',
    };

    return typeMap[type || ''] || type || 'multiple-choice';
  }

  private static normalizeQuestionForClient(question: any, questionIndex: number, options?: { studentView?: boolean }): any {
    const normalizedType = this.normalizeQuestionTypeForClient(question?.question_type ?? question?.type);
    const normalizedOptions = Array.isArray(question?.options)
      ? question.options.map((option: any, optionIndex: number) => {
          const baseOption = {
            option_text: option?.option_text ?? option?.text ?? '',
            text: option?.text ?? option?.option_text ?? '',
            option_order: option?.option_order ?? optionIndex,
            match: option?.match ?? option?.correctMatch ?? '',
            correctMatch: option?.correctMatch ?? option?.match ?? '',
            media: option?.media ?? null,
            matchMedia: option?.matchMedia ?? null,
          };

          if (options?.studentView) {
            return baseOption;
          }

          return {
            ...option,
            ...baseOption,
            is_correct: option?.is_correct ?? optionIndex === Number(question?.correctAnswer ?? -1),
          };
        })
      : [];

    const explicitCorrect = normalizedOptions.find((option: any) => option.is_correct);
    let normalizedCorrectAnswer: any;

    if (normalizedType === 'short-answer') {
      normalizedCorrectAnswer = typeof question?.correctAnswer === 'string'
        ? question.correctAnswer
        : typeof question?.correct_answer === 'string'
          ? question.correct_answer
          : '';
    } else if (normalizedType === 'checkbox') {
      normalizedCorrectAnswer = Array.isArray(question?.correctAnswer)
        ? question.correctAnswer
        : Array.isArray(question?.correct_answer)
          ? question.correct_answer
          : normalizedOptions
              .map((option: any, optionIndex: number) => option.is_correct ? optionIndex : -1)
              .filter((optionIndex: number) => optionIndex >= 0);
    } else if (normalizedType === 'multiple-choice') {
      normalizedCorrectAnswer = typeof question?.correctAnswer === 'number'
        ? question.correctAnswer
        : normalizedOptions.findIndex((option: any) => option.is_correct);
    } else {
      normalizedCorrectAnswer = question?.correctAnswer ?? question?.correct_answer ?? '';
    }

    const normalizedQuestion = {
      ...question,
      question_text: question?.question_text ?? question?.question ?? '',
      question: question?.question ?? question?.question_text ?? '',
      question_type: normalizedType,
      type: question?.type ?? normalizedType,
      question_order: question?.question_order ?? questionIndex,
      correct_answer: question?.correct_answer ?? question?.correctAnswer ?? (explicitCorrect?.option_text || ''),
      correctAnswer: normalizedCorrectAnswer,
      options: normalizedOptions,
    };

    if (options?.studentView) {
      delete normalizedQuestion.correct_answer;
    }

    return normalizedQuestion;
  }

  private static normalizeQuestionForStorage(question: any, questionIndex: number): any {
    const normalizedType = this.normalizeType(question?.type || question?.question_type);
    const normalizedOptions = Array.isArray(question?.options)
      ? question.options.map((option: any, optionIndex: number) => ({
          ...option,
          text: option?.text ?? option?.option_text ?? '',
          option_text: option?.option_text ?? option?.text ?? '',
          is_correct: Boolean(option?.is_correct),
          option_order: option?.option_order ?? optionIndex,
        }))
      : [];

    const correctOptionIndex = normalizedOptions.findIndex((option: any) => option.is_correct);
    const normalizedShortAnswer = normalizedType === 'short-answer'
      ? String(question?.correctAnswer ?? question?.correct_answer ?? '').trim()
      : undefined;

    return {
      ...question,
      type: normalizedType,
      question_type: this.normalizeQuestionTypeForClient(normalizedType),
      question: question?.question ?? question?.question_text ?? '',
      question_text: question?.question_text ?? question?.question ?? '',
      question_order: question?.question_order ?? questionIndex,
      options: normalizedOptions,
      correctAnswer: normalizedType === 'short-answer'
        ? normalizedShortAnswer
        : question?.correctAnswer ?? (correctOptionIndex >= 0 ? correctOptionIndex : undefined),
      correct_answer: normalizedType === 'short-answer'
        ? normalizedShortAnswer
        : question?.correct_answer ?? question?.correctAnswer ?? '',
    };
  }

  /**
   * Create a new Assessment
   */
  static async create(data: {
    bahagi_id: string | number;
    lesson_id?: string;
    title: string;
    description?: string;
    assessment_type: 'multiple-choice' | 'short-answer' | 'checkbox' | 'audio' | 'matching' | 'scramble-word';
    options?: Record<string, any>;
    correct_answers?: Record<string, any>;
    points: number;
    questions?: any[];
  }): Promise<BahagiAssessment> {
    // Convert bahagi_id to number if it's a string
    const bahagiIdNum = typeof data.bahagi_id === 'string' ? parseInt(data.bahagi_id, 10) : data.bahagi_id;

    const normalizedType = this.normalizeType(data.assessment_type);
    const normalizedQuestions = Array.isArray(data.questions)
      ? data.questions.map((question: any, questionIndex: number) => this.normalizeQuestionForStorage(question, questionIndex))
      : [];

    const result = await repositories.assessment.raw(`
      INSERT INTO bahagi_assessment (
        bahagi_id,
        lesson_id,
        title,
        type,
        content,
        assessment_order,
        is_published,
        is_archived,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
    `, [
      bahagiIdNum,
      data.lesson_id && Number(data.lesson_id) > 0 ? data.lesson_id : null,
      data.title,
      normalizedType,
      JSON.stringify({
        instructions: data.description || '',
        questions: normalizedQuestions,
        totalPoints: data.points,
      }),
      0,
      false,
      false,
    ]);

    return this.transformAssessment(result[0]) as BahagiAssessment;
  }

  /**
   * Update Assessment
   */
  static async update(id: string, data: Partial<BahagiAssessment>): Promise<BahagiAssessment | null> {
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const input = data as any;
    const normalizedType = this.normalizeType(
      input.assessment_type || input.type || input.questions?.[0]?.type || current.type || current.assessment_type
    );
    const normalizedQuestions = Array.isArray(input.questions)
      ? input.questions.map((question: any, questionIndex: number) => this.normalizeQuestionForStorage(question, questionIndex))
      : (current as any).questions || [];
    const totalPoints = input.points
      ?? normalizedQuestions.reduce((sum: number, question: any) => sum + (Number(question?.xp) || 0), 0)
      ?? (current as any).points
      ?? 0;
    const nextBahagiId = input.bahagi_id !== undefined ? Number(input.bahagi_id) : Number((current as any).bahagi_id);
    const nextLessonIdRaw = input.yunit_id ?? input.lesson_id ?? (current as any).lesson_id;
    const nextLessonId = nextLessonIdRaw !== undefined && nextLessonIdRaw !== null && Number(nextLessonIdRaw) > 0
      ? Number(nextLessonIdRaw)
      : null;

    const result = await repositories.assessment.raw(`
      UPDATE bahagi_assessment
      SET bahagi_id = $1,
          lesson_id = $2,
          title = $3,
          type = $4,
          content = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
    `, [
      nextBahagiId,
      nextLessonId,
      input.title || current.title,
      normalizedType,
      JSON.stringify({
        instructions: input.description || input.instructions || (current as any).instructions || '',
        questions: normalizedQuestions,
        totalPoints,
      }),
      id,
    ]);

    return result[0] ? (this.transformAssessment(result[0]) as BahagiAssessment) : null;
  }

  /**
   * Get Assessment by ID
   */
  static async getById(id: string): Promise<BahagiAssessment | null> {
    const result = await repositories.assessment.raw(`
      SELECT id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
      FROM bahagi_assessment
      WHERE id = $1
    `, [id]);

    return result[0] ? (this.transformAssessment(result[0]) as BahagiAssessment) : null;
  }

  /**
   * List assessments for a Bahagi
   */
  static async listByBahagi(bahagiId: string | number, options?: { studentView?: boolean; includeArchived?: boolean }) {
    // Convert to number if string (bahagi_id is INTEGER in DB)
    const bahagiIdNum = typeof bahagiId === 'string' ? parseInt(bahagiId, 10) : bahagiId;
    
    // Filter out archived by default (unless explicitly requested)
    const archivedFilter = options?.includeArchived ? '' : 'AND is_archived = false';
    
    const result = await repositories.assessment.raw(`
      SELECT id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
      FROM bahagi_assessment
      WHERE bahagi_id = $1 ${archivedFilter}
      ORDER BY assessment_order ASC, created_at DESC
    `, [bahagiIdNum]);

    return result.map((row) => this.transformAssessment(row, options));
  }

  /**
   * List assessments for a Yunit (Lesson)
   */
  static async listByYunit(yunitId: string, options?: { studentView?: boolean; firstOnly?: boolean; includeArchived?: boolean }) {
    // Filter out archived by default (unless explicitly requested)
    const archivedFilter = options?.includeArchived ? '' : 'AND is_archived = false';
    
    const result = await repositories.assessment.raw(`
      SELECT id, bahagi_id, lesson_id, title, type, content, assessment_order, is_published, is_archived, created_at, updated_at
      FROM bahagi_assessment
      WHERE lesson_id = $1 ${archivedFilter}
      ORDER BY assessment_order ASC, created_at DESC
    `, [yunitId]);

    const rows = options?.firstOnly ? result.slice(0, 1) : result;
    return rows.map((row) => this.transformAssessment(row, options));
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

    switch (assessment.assessment_type) {
      case 'multiple-choice': {
        isCorrect = studentAnswer === assessment.correct_answers?.answer;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = assessment.correct_answers?.answer;
        feedback = isCorrect ? 'Correct!' : `The correct answer is: ${correctAnswer}`;
        break;
      }

      case 'short-answer': {
        const normalized = String(studentAnswer ?? '').trim();
        isCorrect = normalized.length > 0;
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = assessment.correct_answers?.answer ?? 'Any non-empty answer';
        feedback = isCorrect ? 'Correct!' : 'Please type an answer to continue.';
        break;
      }

      case 'checkbox': {
        const correctAnswers = Array.isArray(assessment.correct_answers?.answers)
          ? assessment.correct_answers.answers
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
        const correctPairs = assessment.correct_answers?.pairs || {};
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
        const correctData = assessment.correct_answers?.answer ?? assessment.correct_answers?.word ?? null;
        const scrambleWords = Array.isArray(assessment.questions?.[0]?.scrambleWords)
          ? assessment.questions[0].scrambleWords
          : [];

        // correctAnswer is an array of words in correct order
        // studentAnswer is also an array of words in student's order
        if (Array.isArray(correctData) && Array.isArray(studentAnswer)) {
          const correctArr = correctData.map((w: string) => String(w).toLowerCase().trim());
          const studentArr = studentAnswer.map((w: string) => String(w).toLowerCase().trim());
          isCorrect = JSON.stringify(studentArr) === JSON.stringify(correctArr);
        } else if (scrambleWords.length && Array.isArray(studentAnswer)) {
          // Fallback: use scrambleWords order as correct answer
          const correctArr = scrambleWords.map((w: any) => (typeof w === 'string' ? w : w.text || '').toLowerCase().trim());
          const studentArr = studentAnswer.map((w: string) => String(w).toLowerCase().trim());
          isCorrect = JSON.stringify(studentArr) === JSON.stringify(correctArr);
        } else {
          // Legacy string comparison fallback
          const correctWord = String(correctData?.word || correctData || '').toLowerCase().trim();
          const studentWord = String(studentAnswer).toLowerCase().trim();
          isCorrect = studentWord === correctWord;
        }
        pointsEarned = isCorrect ? assessment.points : 0;
        correctAnswer = Array.isArray(correctData) ? correctData.join(' ') : String(correctData?.word || correctData || '');
        feedback = isCorrect ? 'Correct!' : `The correct order is: ${correctAnswer}`;
        break;
      }

      case 'audio': {
        // Audio validation would require speech-to-text API
        // For now, mark as pending review
        feedback = 'Audio answer submitted for review';
        pointsEarned = 0;
        isCorrect = false;
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
      assessment_type: assessment.assessment_type,
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
    const normalizedType = data.assessment_type
      ? this.normalizeType(data.assessment_type)
      : this.normalizeType(data.type || data.questions?.[0]?.type);

    if (!data.bahagi_id) {
      errors.push('Bahagi ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (!normalizedType) {
      errors.push('Assessment type is required');
    }

    const validTypes = ['multiple-choice', 'short-answer', 'checkbox', 'audio', 'matching', 'scramble-word'];
    if (normalizedType && !validTypes.includes(normalizedType)) {
      errors.push(`Invalid assessment type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!data.points || typeof data.points !== 'number' || data.points <= 0) {
      errors.push('Points must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AssessmentService;
