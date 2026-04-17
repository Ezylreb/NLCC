/**
 * Services Index
 * Central export point for all business logic services
 */

export { BahagiService } from './BahagiService';
export { YunitService } from './YunitService';
export { AssessmentService } from './AssessmentService';
export { GamificationService, type RewardEvent, type AchievementUnlockedEvent } from './GamificationService';
export { AnalyticsService } from './AnalyticsService';

import BahagiService from './BahagiService';
import YunitService from './YunitService';
import AssessmentService from './AssessmentService';
import GamificationService from './GamificationService';
import AnalyticsService from './AnalyticsService';

export const services = {
  bahagi: BahagiService,
  yunit: YunitService,
  assessment: AssessmentService,
  gamification: GamificationService,
  analytics: AnalyticsService,
};

export default services;
