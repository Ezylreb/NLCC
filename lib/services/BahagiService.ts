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
    quarter?: string;
    week_number?: number;
    module_number?: string;
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
   * List all Bahagis for a teacher with efficient counting
   */
  static async listByTeacher(teacherId: string, className?: string) {
    // Build WHERE clause
    const conditions = ['b.teacher_id = $1'];
    const params: any[] = [teacherId];
    
    if (className) {
      conditions.push('b.class_name = $2');
      params.push(className);
    }

    const whereClause = conditions.join(' AND ');

    // Single efficient query with JOINs to get counts
    const query = `
      SELECT 
        b.*,
        COALESCE(COUNT(DISTINCT l.id), 0)::int as "lessonCount",
        COALESCE(COUNT(DISTINCT ba.id), 0)::int as "assessmentCount",
        0 as "totalXP"
      FROM bahagi b
      LEFT JOIN lesson l ON b.id = l.bahagi_id
      LEFT JOIN bahagi_assessment ba ON b.id = ba.bahagi_id
      WHERE ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;

    try {
      const result = await repositories.bahagi.raw(query, params);
      return result;
    } catch (err) {
      console.error('Error fetching bahagi with counts:', err);
      // Fallback to basic query and count separately
      const where: Record<string, any> = { teacher_id: teacherId };
      if (className) {
        where.class_name = className;
      }
      const bahagis = await repositories.bahagi.findAll({ where, orderBy: 'created_at DESC' });
      
      // Try to get counts for each bahagi (less efficient but works)
      const bahagisWithCounts = await Promise.all(
        bahagis.map(async (b) => {
          try {
            // Get lesson count
            const lessonCountResult = await repositories.bahagi.raw(
              'SELECT COUNT(*) as count FROM lesson WHERE bahagi_id = $1',
              [b.id]
            );
            const lessonCount = parseInt(lessonCountResult[0]?.count || '0');

            // Get assessment count
            const assessmentCountResult = await repositories.bahagi.raw(
              'SELECT COUNT(*) as count FROM bahagi_assessment WHERE bahagi_id = $1',
              [b.id]
            );
            const assessmentCount = parseInt(assessmentCountResult[0]?.count || '0');

            return { ...b, lessonCount, assessmentCount, totalXP: 0 };
          } catch (countErr) {
            console.error(`Error counting for bahagi ${b.id}:`, countErr);
            return { ...b, lessonCount: 0, assessmentCount: 0, totalXP: 0 };
          }
        })
      );
      
      return bahagisWithCounts;
    }
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
