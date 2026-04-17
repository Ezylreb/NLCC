'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';

interface TeacherAnalyticsDashboardProps {
  classId: string;
  bahagiId?: string;
  teacherId: string;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  averageScore: number;
  totalSubmissions: number;
  correctAnswers: number;
  assessmentsCompleted: number;
}

interface AssignmentAnalytic {
  assessmentId: string;
  assessmentTitle: string;
  classAverage: number;
  totalAttempts: number;
  correctAttempts: number;
  difficultyScore: number; // 0-100, higher = harder
}

export const TeacherAnalyticsDashboard: React.FC<TeacherAnalyticsDashboardProps> = ({
  classId,
  bahagiId,
  teacherId
}) => {
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<AssignmentAnalytic[]>([]);
  const [classStats, setClassStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);

  // Fetch analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [studentResponse, assignmentResponse, statsResponse] = await Promise.all([
          apiClient.analytics.getStudentPerformance(teacherId),
          apiClient.analytics.getAssignmentAnalytics(bahagiId || classId),
          apiClient.analytics.getClassStats(classId)
        ]);

        if (studentResponse.success && assignmentResponse.success && statsResponse.success) {
          const studentData = studentResponse.data?.students || [];
          const assignmentData = assignmentResponse.data?.assessments || [];
          const statsData = statsResponse.data?.stats;

          setStudentPerformance(studentData);
          setAssessmentAnalytics(assignmentData);
          setClassStats(statsData);

          // Calculate score distribution
          const distribution = [
            { range: '0-20%', count: studentData?.filter((s: any) => s.averageScore < 20).length || 0 },
            { range: '20-40%', count: studentData?.filter((s: any) => s.averageScore >= 20 && s.averageScore < 40).length || 0 },
            { range: '40-60%', count: studentData?.filter((s: any) => s.averageScore >= 40 && s.averageScore < 60).length || 0 },
            { range: '60-80%', count: studentData?.filter((s: any) => s.averageScore >= 60 && s.averageScore < 80).length || 0 },
            { range: '80-100%', count: studentData?.filter((s: any) => s.averageScore >= 80).length || 0 }
          ];
          setScoreDistribution(distribution);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [classId, bahagiId, timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-purple rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const classAverage = classStats?.classAverage || 0;
  const totalAssignments = classStats?.totalAssignments || 0;
  const completionRate = classStats?.completionRate || 0;
  const studentCount = studentPerformance.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-white">📊 Analytics Dashboard</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-bold text-sm uppercase transition-all ${
                timeRange === range
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {range === 'week' ? '📅 Week' : range === 'month' ? '📆 Month' : '📊 All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 font-bold mb-2">CLASS AVERAGE</p>
          <p className="text-4xl font-black text-brand-sky">{classAverage.toFixed(1)}%</p>
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-brand-sky h-full transition-all"
              style={{ width: `${classAverage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 font-bold mb-2">STUDENTS</p>
          <p className="text-4xl font-black text-brand-purple">{studentCount}</p>
          <p className="text-xs text-slate-500 font-bold mt-2">Active students</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 font-bold mb-2">ASSIGNMENTS</p>
          <p className="text-4xl font-black text-green-400">{totalAssignments}</p>
          <p className="text-xs text-slate-500 font-bold mt-2">Total created</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 font-bold mb-2">COMPLETION RATE</p>
          <p className="text-4xl font-black text-orange-400">{completionRate.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 font-bold mt-2">Avg per assignment</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
          <h3 className="text-lg font-black text-white mb-6">📈 Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#a78bfa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Question Difficulty */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
          <h3 className="text-lg font-black text-white mb-6">🎯 Question Difficulty</h3>
          <div className="space-y-4">
            {assessmentAnalytics.slice(0, 5).map((assessment) => (
              <div key={assessment.assessmentId}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white truncate flex-1">
                    {assessment.assessmentTitle.substring(0, 30)}...
                  </p>
                  <span className="text-xs font-black text-slate-400 ml-2">
                    {assessment.difficultyScore}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      assessment.difficultyScore < 30
                        ? 'bg-green-500'
                        : assessment.difficultyScore < 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${assessment.difficultyScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Performance Rankings */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
        <h3 className="text-lg font-black text-white mb-6">🏆 Student Performance Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Average</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Completed</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Correct</th>
              </tr>
            </thead>
            <tbody>
              {studentPerformance
                .sort((a, b) => b.averageScore - a.averageScore)
                .map((student, index) => (
                  <tr key={student.studentId} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-4 text-sm font-black text-slate-400">#{index + 1}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white">{student.studentName}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-sky">
                          {student.averageScore.toFixed(1)}%
                        </span>
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-sky h-full"
                            style={{ width: `${student.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-300">
                      {student.assessmentsCompleted}/{student.totalSubmissions}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-green-400">
                      {student.correctAnswers}/{student.totalSubmissions}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Performance */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
        <h3 className="text-lg font-black text-white mb-6">📝 Assignment Performance Detail</h3>
        <div className="grid grid-cols-1 gap-4">
          {assessmentAnalytics.map((assessment) => {
            const successRate = assessment.totalAttempts > 0 
              ? (assessment.correctAttempts / assessment.totalAttempts) * 100 
              : 0;

            return (
              <div
                key={assessment.assessmentId}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{assessment.assessmentTitle}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {assessment.totalAttempts} attempts • {successRate.toFixed(0)}% success rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-brand-sky">{assessment.classAverage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">class avg</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-purple to-brand-sky h-full transition-all"
                    style={{ width: `${assessment.classAverage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
