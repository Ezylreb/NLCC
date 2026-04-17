/**
 * Gamification Service
 * Business logic for rewards, achievements, and gamification events
 */

import { repositories } from '@/lib/database/repository';
import type { StudentReward, Trophy } from '@/lib/database/types';

export interface RewardEvent {
  studentId: string;
  assessmentId?: string;
  yunitId?: string;
  xpEarned?: number;
  coinsEarned?: number;
  reason: 'assessment-correct' | 'lesson-complete' | 'milestone' | 'daily-streak' | 'custom';
  metadata?: Record<string, any>;
}

export interface AchievementUnlockedEvent {
  studentId: string;
  trophyType: string;
  title: string;
  icon: string;
  description?: string;
}

export class GamificationService {
  /**
   * Award reward to student
   */
  static async awardReward(event: RewardEvent): Promise<StudentReward> {
    const reward = await repositories.reward.create({
      student_id: event.studentId,
      assessment_id: event.assessmentId || null,
      yunit_id: event.yunitId || null,
      xp_earned: event.xpEarned || 0,
      coins_earned: event.coinsEarned || 0,
      reward_type: 'xp',
      earned_at: new Date(),
    } as any);

    // Emit event for async processing
    await this.emitRewardEvent(event);

    return reward;
  }

  /**
   * Get student's total rewards
   */
  static async getStudentTotals(studentId: string) {
    const rewards = await repositories.reward.raw(
      `SELECT 
        COALESCE(SUM(xp_earned), 0) as total_xp,
        COALESCE(SUM(coins_earned), 0) as total_coins
       FROM student_rewards 
       WHERE student_id = $1`,
      [studentId]
    );

    return {
      totalXp: parseInt((rewards[0] as any)?.total_xp || 0),
      totalCoins: parseInt((rewards[0] as any)?.total_coins || 0),
    };
  }

  /**
   * Get recent rewards
   */
  static async getRecentRewards(studentId: string, limit: number = 20) {
    return repositories.reward.findAll({
      where: { student_id: studentId },
      orderBy: 'earned_at DESC',
      limit,
    });
  }

  /**
   * Award trophy/achievement
   */
  static async awardTrophy(event: AchievementUnlockedEvent): Promise<Trophy> {
    return repositories.trophy.create({
      student_id: event.studentId,
      trophy_type: event.trophyType,
      title: event.title,
      icon: event.icon,
      earned_at: new Date(),
    } as any);
  }

  /**
   * Get student's trophies
   */
  static async getStudentTrophies(studentId: string) {
    return repositories.trophy.findAll({
      where: { student_id: studentId },
      orderBy: 'earned_at DESC',
    });
  }

  /**
   * Check for milestone achievements
   */
  static async checkMilestones(studentId: string): Promise<AchievementUnlockedEvent[]> {
    const achievements: AchievementUnlockedEvent[] = [];
    const totals = await this.getStudentTotals(studentId);

    // First lesson milestone
    const completions = await repositories.reward.raw(
      'SELECT COUNT(*) as count FROM student_rewards WHERE student_id = $1',
      [studentId]
    );
    const completionCount = parseInt((completions[0] as any)?.count || 0);

    if (completionCount === 1) {
      const existing = await repositories.trophy.findAll({
        where: { student_id: studentId, trophy_type: 'first_lesson' },
      });

      if (existing.length === 0) {
        achievements.push({
          studentId,
          trophyType: 'first_lesson',
          title: 'First Flight',
          icon: '🎯',
          description: 'Completed your first lesson',
        });
      }
    }

    // XP milestones
    const xpMilestones = [
      { xp: 100, type: 'century', title: 'Century', icon: '💯' },
      { xp: 500, type: 'quester', title: 'Quester', icon: '🗂️' },
      { xp: 1000, type: 'champion', title: 'Champion', icon: '👑' },
      { xp: 5000, type: 'legend', title: 'Legend', icon: '⭐' },
    ];

    for (const milestone of xpMilestones) {
      if (totals.totalXp >= milestone.xp) {
        const existing = await repositories.trophy.findAll({
          where: { student_id: studentId, trophy_type: milestone.type },
        });

        if (existing.length === 0) {
          achievements.push({
            studentId,
            trophyType: milestone.type,
            title: milestone.title,
            icon: milestone.icon,
            description: `Earned ${milestone.xp} XP`,
          });
        }
      }
    }

    return achievements;
  }

  /**
   * Get leaderboard (top students by XP)
   */
  static async getLeaderboard(limit: number = 10) {
    return repositories.reward.raw(
      `SELECT 
        student_id, 
        COALESCE(SUM(xp_earned), 0) as total_xp,
        COUNT(*) as total_rewards
       FROM student_rewards
       GROUP BY student_id
       ORDER BY total_xp DESC
       LIMIT $1`,
      [limit]
    );
  }

  /**
   * Get student's rank on leaderboard
   */
  static async getStudentRank(studentId: string) {
    const result = await repositories.reward.raw(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT student_id, SUM(xp_earned) as total_xp
         FROM student_rewards
         GROUP BY student_id
       ) leaderboard
       WHERE total_xp > (
         SELECT COALESCE(SUM(xp_earned), 0)
         FROM student_rewards
         WHERE student_id = $1
       )`,
      [studentId]
    );

    return parseInt((result[0] as any)?.rank || 1);
  }

  /**
   * Emit reward event for async processing (placeholder for event bus)
   */
  private static async emitRewardEvent(event: RewardEvent): Promise<void> {
    // This will be connected to EventBus in Phase 4
    // For now, we'll just emit locally
    console.log('[GamificationService] Reward event:', event);
  }

  /**
   * Validate reward data
   */
  static validateRewardData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.studentId) {
      errors.push('Student ID is required');
    }

    if ((data.xpEarned || 0) < 0 || (data.coinsEarned || 0) < 0) {
      errors.push('XP and coins must be non-negative');
    }

    if (!data.reason) {
      errors.push('Reason is required');
    }

    const validReasons = ['assessment-correct', 'lesson-complete', 'milestone', 'daily-streak', 'custom'];
    if (data.reason && !validReasons.includes(data.reason)) {
      errors.push(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default GamificationService;
