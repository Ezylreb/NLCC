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
    bahagi_id: string | number;
    title: string;
    subtitle?: string;
    discussion?: string;
    media_url?: string;
    audio_url?: string;
    lesson_order?: number;
    quarter?: string;
    week_number?: number;
    module_number?: string;
  }): Promise<Lesson> {
    // Convert bahagi_id to number if it's a string
    const bahagiIdNum = typeof data.bahagi_id === 'string' ? parseInt(data.bahagi_id, 10) : data.bahagi_id;

    const normalizedSubtitle = typeof data.subtitle === 'string'
      ? data.subtitle.trim().slice(0, 255)
      : undefined;
    
    return repositories.lesson.create({
      ...data,
      bahagi_id: bahagiIdNum,
      subtitle: normalizedSubtitle,
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
  static async listByBahagi(bahagiId: string | number) {
    console.log('[YunitService.listByBahagi] Called with bahagiId:', bahagiId, 'type:', typeof bahagiId);
    // Convert to number if string (bahagi_id is INTEGER in DB)
    const bahagiIdNum = typeof bahagiId === 'string' ? parseInt(bahagiId, 10) : bahagiId;
    console.log('[YunitService.listByBahagi] Converted bahagiId to:', bahagiIdNum, 'type:', typeof bahagiIdNum);

    // Only fetch lightweight list fields here. Some lessons contain very large
    // content payloads, and selecting every column can exceed the DB read timeout.
    const result = await repositories.lesson.raw(`
      SELECT
        id,
        bahagi_id,
        title,
        subtitle,
        lesson_order,
        quarter,
        week_number,
        module_number,
        is_published,
        is_archived,
        created_at,
        updated_at
      FROM lesson
      WHERE bahagi_id = $1
      ORDER BY lesson_order ASC NULLS LAST, created_at ASC
    `, [bahagiIdNum]);

    console.log('[YunitService.listByBahagi] Repository returned:', result.length, 'lessons');
    if (result.length > 0) {
      console.log('[YunitService.listByBahagi] First lesson:', result[0]);
    }
    return result;
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
