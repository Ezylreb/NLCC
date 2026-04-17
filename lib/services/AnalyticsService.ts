/**
 * Analytics Service
 * Business logic for student performance metrics and statistics
 */

import { repositories } from '@/lib/database/repository';

export interface StudentPerformance {
  studentId: string;
  totalAssessments: number;
  correctAnswers: number;
  averageScore: number;
  masteryPercentage: number;
  recentActivity: any[];
}

export interface ClassStatistics {
  classId: string;
  totalStudents: number;
  averageMastery: number;
  topPerformer: any;
  lowPerformer: any;
  recentSubmissions: number;
}

export class AnalyticsService {
  /**
   * Get student performance metrics
   */
  static async getStudentPerformance(studentId: string): Promise<StudentPerformance> {
    // Get answer stats
    const answerStats = await repositories.answer.raw(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
        AVG(points_earned) as avg_score,
        SUM(points_earned) as total_points
       FROM yunit_answers
       WHERE student_id = $1`,
      [studentId]
    );

    const stats = (answerStats[0] as any) || {};
    const total = parseInt(stats.total || 0);
    const correct = parseInt(stats.correct || 0);

    // Get recent activity
    const recentActivity = await repositories.answer.findAll({
      where: { student_id: studentId },
      orderBy: 'submitted_at DESC',
      limit: 10,
    });

    return {
      studentId,
      totalAssessments: total,
      correctAnswers: correct,
      averageScore: parseFloat(stats.avg_score) || 0,
      masteryPercentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      recentActivity,
    };
  }

  /**
   * Get class statistics
   */
  static async getClassStatistics(classId: string): Promise<ClassStatistics> {
    // Get unique students in class
    const students = await repositories.user.raw(
      'SELECT COUNT(*) as count FROM users WHERE class_name = $1 AND role = $2',
      [classId, 'STUDENT']
    );

    // Get average mastery across class
    const classStats = await repositories.answer.raw(
      `SELECT 
        COUNT(DISTINCT student_id) as students,
        AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as avg_mastery
       FROM yunit_answers`,
      []
    );

    // Get top performer
    const topPerformer = await repositories.answer.raw(
      `SELECT 
        student_id,
        COUNT(*) as total_answers,
        SUM(points_earned) as total_points,
        AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as mastery
       FROM yunit_answers
       GROUP BY student_id
       ORDER BY total_points DESC
       LIMIT 1`,
      []
    );

    // Get low performer
    const lowPerformer = await repositories.answer.raw(
      `SELECT 
        student_id,
        COUNT(*) as total_answers,
        SUM(points_earned) as total_points,
        AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as mastery
       FROM yunit_answers
       GROUP BY student_id
       ORDER BY total_points ASC
       LIMIT 1`,
      []
    );

    // Recent submissions (last 24 hours)
    const recentSubmissions = await repositories.answer.raw(
      `SELECT COUNT(*) as count
       FROM yunit_answers
       WHERE submitted_at > NOW() - INTERVAL '24 hours'`,
      []
    );

    return {
      classId,
      totalStudents: parseInt((students[0] as any)?.count || 0),
      averageMastery: parseFloat((classStats[0] as any)?.avg_mastery || 0),
      topPerformer: topPerformer[0] || null,
      lowPerformer: lowPerformer[0] || null,
      recentSubmissions: parseInt((recentSubmissions[0] as any)?.count || 0),
    };
  }

  /**
   * Get assignment analytics
   */
  static async getAssignmentAnalytics(assignmentId: string) {
    const stats = await repositories.answer.raw(
      `SELECT 
        assessment_id,
        COUNT(*) as total_submissions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_submissions,
        AVG(points_earned) as avg_score,
        MAX(points_earned) as max_score,
        MIN(points_earned) as min_score
       FROM yunit_answers
       WHERE assessment_id = $1
       GROUP BY assessment_id`,
      [assignmentId]
    );

    const stat = (stats[0] as any) || {};

    return {
      assignmentId,
      totalSubmissions: parseInt(stat.total_submissions || 0),
      correctSubmissions: parseInt(stat.correct_submissions || 0),
      successRate:
        parseInt(stat.total_submissions || 0) > 0
          ? Math.round((parseInt(stat.correct_submissions || 0) / parseInt(stat.total_submissions || 0)) * 100)
          : 0,
      averageScore: parseFloat(stat.avg_score) || 0,
      maxScore: parseInt(stat.max_score || 0),
      minScore: parseInt(stat.min_score || 0),
    };
  }

  /**
   * Get student gradebook
   */
  static async getStudentGradebook(studentId: string) {
    const grades = await repositories.answer.raw(
      `SELECT 
        assessment_id,
        COUNT(*) as total_attempts,
        MAX(points_earned) as best_score,
        AVG(points_earned) as average_score,
        MAX(submitted_at) as last_attempt
       FROM yunit_answers
       WHERE student_id = $1
       GROUP BY assessment_id
       ORDER BY assessment_id`,
      [studentId]
    );

    return grades;
  }

  /**
   * Get student grade statistics
   */
  static async getStudentGradeStatistics(studentId: string) {
    const stats = await repositories.answer.raw(
      `SELECT 
        COUNT(*) as total_assessments,
        AVG(points_earned) as average_grade,
        MAX(points_earned) as highest_grade,
        MIN(points_earned) as lowest_grade,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
        COUNT(*) - SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as incorrect_count
       FROM yunit_answers
       WHERE student_id = $1`,
      [studentId]
    );

    const stat = (stats[0] as any) || {};

    return {
      studentId,
      totalAssessments: parseInt(stat.total_assessments || 0),
      averageGrade: parseFloat(stat.average_grade) || 0,
      highestGrade: parseInt(stat.highest_grade || 0),
      lowestGrade: parseInt(stat.lowest_grade || 0),
      correctCount: parseInt(stat.correct_count || 0),
      incorrectCount: parseInt(stat.incorrect_count || 0),
      successRate:
        parseInt(stat.total_assessments || 0) > 0
          ? Math.round((parseInt(stat.correct_count || 0) / parseInt(stat.total_assessments || 0)) * 100)
          : 0,
    };
  }

  /**
   * Get time-based activity statistics
   */
  static async getActivityStatistics(timeWindowDays: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - timeWindowDays);

    const activity = await repositories.answer.raw(
      `SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as submissions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_submissions,
        AVG(points_earned) as avg_score
       FROM yunit_answers
       WHERE submitted_at > $1
       GROUP BY DATE(submitted_at)
       ORDER BY date DESC`,
      [since]
    );

    return activity;
  }
}

export default AnalyticsService;
