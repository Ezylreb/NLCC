'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { exportGradebookToPDF, exportToCSV } from '@/lib/pdf-export';

interface StudentGradebookProps {
  classId: string;
  studentId: string;
  teacherId?: string;
}

interface GradeEntry {
  assessmentId: string;
  assessmentTitle: string;
  bahagiTitle: string;
  yunitTitle: string;
  type: string;
  pointsEarned: number;
  totalPoints: number;
  percentage: number;
  attemptNumber: number;
  submittedAt: string;
  isCorrect: boolean;
}

interface GradeStats {
  overallGPA: number;
  totalPoints: number;
  maxPoints: number;
  completionRate: number;
  bestScore: number;
  worstScore: number;
  improvementTrend: 'up' | 'down' | 'stable';
  assessmentsTaken: number;
}

export const StudentGradebook: React.FC<StudentGradebookProps> = ({
  classId,
  studentId,
  teacherId
}) => {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBahagi, setFilterBahagi] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date');
  const [progressData, setProgressData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadGrades = async () => {
      setIsLoading(true);
      try {
        const [gradesResult, statsResult] = await Promise.all([
          apiClient.student.getDetails(studentId),
          apiClient.analytics.getStudentPerformance(studentId)
        ]);

        if (gradesResult.success && statsResult.success) {
          const gradesData = gradesResult.data;
          const statsData = statsResult.data;

          setGrades(gradesData.grades || []);
          setStats(statsData.stats);

          // Calculate progress over time
          const gradesByDate = (gradesData.grades || [])
            .sort((a: any, b: any) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
            .reduce((acc: any[], grade: any) => {
              const existing = acc.find(d => d.date === new Date(grade.submittedAt).toLocaleDateString());
              if (existing) {
                existing.score = (existing.score + grade.percentage) / 2;
              } else {
                acc.push({
                  date: new Date(grade.submittedAt).toLocaleDateString(),
                  score: grade.percentage
                });
              }
              return acc;
            }, []);

          setProgressData(gradesByDate);
        }
      } catch (err) {
        console.error('Error loading grades:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadGrades();
  }, [classId, studentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-purple rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">Loading gradebook...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-bold">No grades yet</p>
      </div>
    );
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-blue-600';
    if (percentage >= 70) return 'bg-yellow-600';
    if (percentage >= 60) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportGradebookToPDF(
        studentId,
        grades,
        stats,
        `gradebook_${studentId}_${new Date().toISOString().split('T')[0]}.png`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const csvData = grades.map((grade) => ({
        'Assessment Title': grade.assessmentTitle,
        'Bahagi (Module)': grade.bahagiTitle,
        'Yunit (Lesson)': grade.yunitTitle,
        'Score': `${grade.pointsEarned}/${grade.totalPoints}`,
        'Percentage': `${grade.percentage.toFixed(1)}%`,
        'Grade Letter': getGradeLetter(grade.percentage),
        'Submitted': new Date(grade.submittedAt).toLocaleDateString(),
      }));

      exportToCSV(
        csvData,
        `gradebook_${studentId}_${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredGrades = filterBahagi
    ? grades.filter(g => g.bahagiTitle === filterBahagi)
    : grades;

  const sortedGrades = [...filteredGrades].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.percentage - a.percentage;
      case 'title':
        return a.assessmentTitle.localeCompare(b.assessmentTitle);
      case 'date':
      default:
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  });

  const uniqueBahagis = [...new Set(grades.map(g => g.bahagiTitle))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-white">📚 Gradebook</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-400 font-bold">OVERALL GPA</p>
            <p className="text-4xl font-black text-brand-sky">{stats.overallGPA.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
              title="Export gradebook as PDF"
            >
              {isExporting ? '...' : '📄 PDF'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
              title="Export gradebook as CSV"
            >
              {isExporting ? '...' : '📊 CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-xs text-slate-400 font-bold mb-2">TOTAL POINTS</p>
          <p className="text-3xl font-black text-brand-purple">
            {stats.totalPoints}/{stats.maxPoints}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            {Math.round((stats.totalPoints / stats.maxPoints) * 100)}%
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-xs text-slate-400 font-bold mb-2">BEST SCORE</p>
          <p className="text-3xl font-black text-green-400">{stats.bestScore.toFixed(0)}%</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-xs text-slate-400 font-bold mb-2">WORST SCORE</p>
          <p className="text-3xl font-black text-orange-400">{stats.worstScore.toFixed(0)}%</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-xs text-slate-400 font-bold mb-2">COMPLETION</p>
          <p className="text-3xl font-black text-blue-400">{stats.completionRate.toFixed(0)}%</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <p className="text-xs text-slate-400 font-bold mb-2">TREND</p>
          <p className="text-3xl font-black flex items-center gap-2">
            {stats.improvementTrend === 'up' ? (
              <span className="text-green-400">📈</span>
            ) : stats.improvementTrend === 'down' ? (
              <span className="text-red-400">📉</span>
            ) : (
              <span className="text-yellow-400">➡️</span>
            )}
            {stats.improvementTrend === 'up' ? 'Improving' : stats.improvementTrend === 'down' ? 'Declining' : 'Stable'}
          </p>
        </div>
      </div>

      {/* Progress Chart */}
      {progressData.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8">
          <h3 className="text-lg font-black text-white mb-6">📈 Score Progression Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any) => value ? `${value.toFixed(1)}%` : '-'}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                dot={{ fill: '#a78bfa', r: 5 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters & Sorting */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="text-sm font-bold text-slate-400 block mb-2">FILTER BY MODULE</label>
          <select
            value={filterBahagi || ''}
            onChange={(e) => setFilterBahagi(e.target.value || null)}
            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg font-bold focus:border-brand-purple outline-none"
          >
            <option value="">All Modules</option>
            {uniqueBahagis.map((bahagi) => (
              <option key={bahagi} value={bahagi}>
                {bahagi}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-bold text-slate-400 block mb-2">SORT BY</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg font-bold focus:border-brand-purple outline-none"
          >
            <option value="date">📅 Date (Newest)</option>
            <option value="score">📊 Score (Highest)</option>
            <option value="title">🔤 Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grade List */}
      <div className="space-y-3">
        {sortedGrades.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
            <p className="text-slate-400 font-bold">No grades in this module yet</p>
          </div>
        ) : (
          sortedGrades.map((grade) => (
            <div
              key={`${grade.assessmentId}-${grade.attemptNumber}`}
              className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 hover:border-slate-600/50 transition"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black text-white ${getGradeColor(grade.percentage)}`}>
                      {getGradeLetter(grade.percentage)}
                    </span>
                    <h4 className="text-lg font-black text-white">{grade.assessmentTitle}</h4>
                  </div>
                  <p className="text-sm text-slate-400 font-bold">
                    {grade.bahagiTitle} › {grade.yunitTitle}
                  </p>
                  <p className="text-xs text-slate-500 font-bold mt-2">
                    📅 {new Date(grade.submittedAt).toLocaleDateString()} • Attempt {grade.attemptNumber} • {grade.type}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-brand-sky">{grade.percentage.toFixed(1)}%</p>
                  <p className="text-sm text-slate-400 font-bold">{grade.pointsEarned}/{grade.totalPoints} pts</p>
                  {grade.isCorrect && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-900/50 border border-green-700/50 rounded text-xs font-black text-green-400">
                      ✅ Correct
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
