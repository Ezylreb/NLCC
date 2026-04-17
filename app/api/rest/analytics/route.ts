/**
 * Consolidated Analytics REST API
 * Replaces: /api/teacher/analytics/*, /api/teacher/gradebook, /api/teacher/stats
 * 
 * Endpoints:
 * GET /api/rest/analytics/student/:studentId - Get student performance
 * GET /api/rest/analytics/class/:classId - Get class statistics
 * GET /api/rest/analytics/assessment/:assessmentId - Get assignment analytics
 * GET /api/rest/analytics/leaderboard - Get top performers
 */

import { NextRequest, NextResponse } from 'next/server';
import AnalyticsService from '@/lib/services/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'student': {
        const studentId = searchParams.get('studentId');
        if (!studentId) {
          return NextResponse.json(
            { error: 'Student ID is required' },
            { status: 400 }
          );
        }

        const performance = await AnalyticsService.getStudentPerformance(studentId);
        return NextResponse.json({ success: true, data: performance });
      }

      case 'class': {
        const classId = searchParams.get('classId');
        if (!classId) {
          return NextResponse.json(
            { error: 'Class ID is required' },
            { status: 400 }
          );
        }

        const stats = await AnalyticsService.getClassStatistics(classId);
        return NextResponse.json({ success: true, data: stats });
      }

      case 'assessment': {
        const assessmentId = searchParams.get('assessmentId');
        if (!assessmentId) {
          return NextResponse.json(
            { error: 'Assessment ID is required' },
            { status: 400 }
          );
        }

        const analytics = await AnalyticsService.getAssignmentAnalytics(assessmentId);
        return NextResponse.json({ success: true, data: analytics });
      }

      // TODO: Implement leaderboard and activity endpoints
      // case 'leaderboard': {
      //   const limit = parseInt(searchParams.get('limit') || '10');
      //   const leaderboard = await AnalyticsService.getLeaderboard(limit);
      //   return NextResponse.json({ success: true, data: leaderboard });
      // }
      //
      // case 'activity': {
      //   const days = parseInt(searchParams.get('days') || '30');
      //   const activity = await AnalyticsService.getActivityStatistics(days);
      //   return NextResponse.json({ success: true, data: activity });
      // }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[GET /api/rest/analytics]', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', detail: error.message },
      { status: 500 }
    );
  }
}
