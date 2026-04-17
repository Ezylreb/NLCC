/**
 * Event Handlers for Gamification Events
 */

import {
  EventHandler,
  EventType,
  AssessmentSubmittedEvent,
  AchievementUnlockedEvent,
  TrophyEarnedEvent,
  MilestoneReachedEvent,
  Event,
} from './types';
import GamificationService from '@/lib/services/GamificationService';

/**
 * Handler for assessment submissions - calculates rewards and checks milestones
 */
export class RewardCalculationHandler implements EventHandler<AssessmentSubmittedEvent> {
  canHandle(event: Event): boolean {
    return event.type === EventType.ASSESSMENT_SUBMITTED;
  }

  async handle(event: AssessmentSubmittedEvent): Promise<void> {
    // Award reward (if not already awarded)
    if (event.isCorrect && event.pointsEarned > 0) {
      await GamificationService.awardReward({
        studentId: event.studentId,
        assessmentId: event.assessmentId,
        yunitId: event.yunitId,
        xpEarned: event.pointsEarned,
        reason: 'assessment-correct',
        metadata: {
          assessmentType: event.assessmentType,
          attemptNumber: event.attemptNumber,
        },
      });
    }

    // Check for milestones
    const achievements = await GamificationService.checkMilestones(event.studentId);

    // Emit achievement events
    for (const achievement of achievements) {
      console.log(`[RewardCalculationHandler] New achievement for ${event.studentId}:`, achievement);
      // These will be handled by AchievementUnlockedHandler
    }
  }
}

/**
 * Handler for achievement unlocks - awards trophies and points
 */
export class AchievementUnlockedHandler implements EventHandler<AchievementUnlockedEvent> {
  canHandle(event: Event): boolean {
    return event.type === EventType.ACHIEVEMENT_UNLOCKED;
  }

  async handle(event: AchievementUnlockedEvent): Promise<void> {
    // Award trophy
    await GamificationService.awardTrophy({
      studentId: event.userId,
      trophyType: event.achievementId,
      title: event.achievementName,
      icon: event.achievementIcon,
    });

    console.log(`[AchievementUnlockedHandler] Trophy awarded to ${event.userId}:`, event.achievementName);

    // Could emit notification event here for Phase 4.5
    // eventBus.emit(notificationEvent);
  }
}

/**
 * Handler for trophy earned - updates leaderboard
 */
export class TrophyEarnedHandler implements EventHandler<TrophyEarnedEvent> {
  canHandle(event: Event): boolean {
    return event.type === EventType.TROPHY_EARNED;
  }

  async handle(event: TrophyEarnedEvent): Promise<void> {
    // Get student's rank
    const rank = await GamificationService.getStudentRank(event.studentId);

    console.log(`[TrophyEarnedHandler] ${event.studentId} earned trophy. New rank: ${rank}`);

    // Could emit leaderboard update event here
    // eventBus.emit(leaderboardUpdateEvent);
  }
}

/**
 * Handler for milestone reached - celebrates achievement
 */
export class MilestoneReachedHandler implements EventHandler<MilestoneReachedEvent> {
  canHandle(event: Event): boolean {
    return event.type === EventType.MILESTONE_REACHED;
  }

  async handle(event: MilestoneReachedEvent): Promise<void> {
    console.log(
      `[MilestoneReachedHandler] ${event.studentId} reached milestone: ${event.milestoneName} (${event.currentValue}/${event.milestoneTotalValue})`
    );

    // Could award bonus XP or special achievement
    // Could emit notification event
  }
}

/**
 * Register all default handlers
 */
export function registerDefaultHandlers(eventBus: any): void {
  eventBus.subscribe(EventType.ASSESSMENT_SUBMITTED, new RewardCalculationHandler());
  eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, new AchievementUnlockedHandler());
  eventBus.subscribe(EventType.TROPHY_EARNED, new TrophyEarnedHandler());
  eventBus.subscribe(EventType.MILESTONE_REACHED, new MilestoneReachedHandler());
}

export default {
  RewardCalculationHandler,
  AchievementUnlockedHandler,
  TrophyEarnedHandler,
  MilestoneReachedHandler,
  registerDefaultHandlers,
};
