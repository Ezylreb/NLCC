/**
 * Yunit Service
 * Business logic for lesson management
 */

import { repositories } from '@/lib/database/repository';
import type { Lesson } from '@/lib/database/types';

export class YunitService {
  /**
   * Create a new Yunit (Lesson)
   */
  static async create(data: {
    bahagi_id: string;
    title: string;
    subtitle?: string;
    discussion?: string;
    media_url?: string;
  }): Promise<Lesson> {
    return repositories.lesson.create({
      ...data,
      is_published: false,
      is_archived: false,
    } as any);
  }

  /**
   * Update Yunit
   */
  static async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    return repositories.lesson.update(id, data as any);
  }

  /**
   * Get Yunit by ID
   */
  static async getById(id: string): Promise<Lesson | null> {
    return repositories.lesson.findById(id);
  }

  /**
   * List all Yunits for a Bahagi
   */
  static async listByBahagi(bahagiId: string) {
    return repositories.lesson.findAll({
      where: { bahagi_id: bahagiId },
      orderBy: 'created_at DESC',
    });
  }

  /**
   * Get Yunit with associated assessments
   */
  static async getWithAssessments(yunitId: string) {
    const yunit = await this.getById(yunitId);
    if (!yunit) return null;

    const assessments = await repositories.assessment.findAll({
      where: { lesson_id: yunitId },
    });

    return {
      ...yunit,
      assessments,
    };
  }

  /**
   * Publish Yunit (make available to students)
   */
  static async publish(id: string): Promise<Lesson | null> {
    return repositories.lesson.update(id, { is_published: true } as any);
  }

  /**
   * Unpublish Yunit
   */
  static async unpublish(id: string): Promise<Lesson | null> {
    return repositories.lesson.update(id, { is_published: false } as any);
  }

  /**
   * Archive Yunit (soft delete)
   */
  static async archive(id: string): Promise<Lesson | null> {
    return repositories.lesson.update(id, { is_archived: true } as any);
  }

  /**
   * Restore Yunit
   */
  static async restore(id: string): Promise<Lesson | null> {
    return repositories.lesson.update(id, { is_archived: false } as any);
  }

  /**
   * Delete Yunit permanently
   */
  static async delete(id: string): Promise<boolean> {
    return repositories.lesson.delete(id, false);
  }

  /**
   * Validate Yunit data
   */
  static validateCreateData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.bahagi_id) {
      errors.push('Bahagi ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (data.title && data.title.length > 500) {
      errors.push('Title must not exceed 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default YunitService;
