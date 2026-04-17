/**
 * Bahagi Service
 * Business logic for course section management
 */

import { repositories } from '@/lib/database/repository';
import type { Bahagi } from '@/lib/database/types';

export class BahagiService {
  /**
   * Create a new Bahagi
   */
  static async create(data: {
    title: string;
    yunit: string;
    description?: string;
    image_url?: string;
    icon_type?: string;
    teacher_id: string;
    class_name?: string;
  }): Promise<Bahagi> {
    return repositories.bahagi.create({
      ...data,
      is_open: true,
      is_published: false,
      is_archived: false,
    } as any);
  }

  /**
   * Update Bahagi
   */
  static async update(id: string, data: Partial<Bahagi>): Promise<Bahagi | null> {
    return repositories.bahagi.update(id, data as any);
  }

  /**
   * Get Bahagi by ID
   */
  static async getById(id: string): Promise<Bahagi | null> {
    return repositories.bahagi.findById(id);
  }

  /**
   * List all Bahagis for a teacher
   */
  static async listByTeacher(teacherId: string, className?: string) {
    const where: Record<string, any> = { teacher_id: teacherId };
    if (className) {
      where.class_name = className;
    }

    const bahagis = await repositories.bahagi.findAll({ where, orderBy: 'created_at DESC' });

    // Enrich with child counts
    return Promise.all(
      bahagis.map(async (bahagi) => {
        const yunits = await repositories.lesson.raw(
          'SELECT COUNT(*) as count FROM lesson WHERE bahagi_id = $1',
          [bahagi.id]
        );

        const assessments = await repositories.assessment.raw(
          'SELECT COUNT(*) as count FROM bahagi_assessment WHERE bahagi_id = $1',
          [bahagi.id]
        );

        const rewards = await repositories.reward.raw(
          'SELECT SUM(xp_earned) as total FROM student_rewards WHERE assessment_id IN (SELECT id FROM bahagi_assessment WHERE bahagi_id = $1)',
          [bahagi.id]
        );

        return {
          ...bahagi,
          lessonCount: parseInt((yunits[0] as any)?.count || 0),
          assessmentCount: parseInt((assessments[0] as any)?.count || 0),
          totalXP: parseInt((rewards[0] as any)?.total || 0),
        };
      })
    );
  }

  /**
   * Publish Bahagi (make visible to students)
   */
  static async publish(id: string): Promise<Bahagi | null> {
    return repositories.bahagi.update(id, { is_published: true } as any);
  }

  /**
   * Unpublish Bahagi
   */
  static async unpublish(id: string): Promise<Bahagi | null> {
    return repositories.bahagi.update(id, { is_published: false } as any);
  }

  /**
   * Archive Bahagi (soft delete)
   */
  static async archive(id: string): Promise<Bahagi | null> {
    return repositories.bahagi.update(id, { is_archived: true } as any);
  }

  /**
   * Restore Bahagi (inverse of archive)
   */
  static async restore(id: string): Promise<Bahagi | null> {
    return repositories.bahagi.update(id, { is_archived: false } as any);
  }

  /**
   * Delete Bahagi permanently (cascade to lessons and assessments)
   */
  static async delete(id: string): Promise<boolean> {
    return repositories.bahagi.delete(id, false); // Hard delete
  }

  /**
   * Validate Bahagi data
   */
  static validateCreateData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (!data.yunit || typeof data.yunit !== 'string' || data.yunit.trim().length === 0) {
      errors.push('Yunit is required and must be a non-empty string');
    }

    if (!data.teacher_id || typeof data.teacher_id !== 'string') {
      errors.push('Teacher ID is required');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default BahagiService;
