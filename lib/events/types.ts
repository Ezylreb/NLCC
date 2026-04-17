/**
 * Event Types for Event-Driven Architecture
 */

export enum EventType {
  // Assessment events
  ASSESSMENT_SUBMITTED = 'assessment.submitted',
  ASSESSMENT_COMPLETED = 'assessment.completed',

  // Learning events
  LESSON_STARTED = 'lesson.started',
  LESSON_COMPLETED = 'lesson.completed',

  // Reward events
  REWARD_EARNED = 'reward.earned',
  MILESTONE_REACHED = 'milestone.reached',

  // Achievement events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  TROPHY_EARNED = 'trophy.earned',

  // Social events
  LEADERBOARD_UPDATE = 'leaderboard.update',
  STREAK_MILESTONE = 'streak.milestone',

  // Notification events
  NOTIFICATION_DISPATCH = 'notification.dispatch',
}

/**
 * Base event interface
 */
export interface BaseEvent {
  type: EventType;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Assessment submission event
 */
export interface AssessmentSubmittedEvent extends BaseEvent {
  type: EventType.ASSESSMENT_SUBMITTED;
  assessmentId: string;
  studentId: string;
  yunitId: string;
  isCorrect: boolean;
  pointsEarned: number;
  attemptNumber: number;
  assessmentType: string;
}

/**
 * Assessment completed event (all attempts done for milestone tracking)
 */
export interface AssessmentCompletedEvent extends BaseEvent {
  type: EventType.ASSESSMENT_COMPLETED;
  assessmentId: string;
  studentId: string;
  finalScore: number;
  totalAttempts: number;
  timeSpent: number; // in seconds
}

/**
 * Lesson completed event
 */
export interface LessonCompletedEvent extends BaseEvent {
  type: EventType.LESSON_COMPLETED;
  yunitId: string;
  studentId: string;
  completedAt: Date;
  assessmentsPassed: number;
}

/**
 * Reward earned event
 */
export interface RewardEarnedEvent extends BaseEvent {
  type: EventType.REWARD_EARNED;
  studentId: string;
  assessmentId?: string;
  yunitId?: string;
  xpEarned: number;
  coinsEarned: number;
  reason: string;
}

/**
 * Milestone reached event
 */
export interface MilestoneReachedEvent extends BaseEvent {
  type: EventType.MILESTONE_REACHED;
  studentId: string;
  milestoneName: string;
  milestoneTotalValue: number;
  currentValue: number;
}

/**
 * Achievement unlocked event
 */
export interface AchievementUnlockedEvent extends BaseEvent {
  type: EventType.ACHIEVEMENT_UNLOCKED;
  studentId: string;
  achievementId: string;
  achievementName: string;
  achievementIcon: string;
  awardedPoints?: number;
}

/**
 * Trophy earned event
 */
export interface TrophyEarnedEvent extends BaseEvent {
  type: EventType.TROPHY_EARNED;
  studentId: string;
  trophyType: string;
  trophyTitle: string;
  trophyIcon: string;
}

/**
 * Notification dispatch event
 */
export interface NotificationDispatchEvent extends BaseEvent {
  type: EventType.NOTIFICATION_DISPATCH;
  studentId: string;
  title: string;
  message: string;
  channel: 'push' | 'email' | 'in-app';
  relatedEventTypes?: EventType[];
}

/**
 * Union type for all events
 */
export type Event =
  | AssessmentSubmittedEvent
  | AssessmentCompletedEvent
  | LessonCompletedEvent
  | RewardEarnedEvent
  | MilestoneReachedEvent
  | AchievementUnlockedEvent
  | TrophyEarnedEvent
  | NotificationDispatchEvent;

/**
 * Event handler interface
 */
export interface EventHandler<T extends Event = Event> {
  handle: (event: T) => Promise<void>;
  canHandle: (event: Event) => boolean;
}
