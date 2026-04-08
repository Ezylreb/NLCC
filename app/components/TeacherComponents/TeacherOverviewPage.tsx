'use client';

import React, { useState, useEffect } from 'react';

interface TeacherOverviewPageProps {
    stats: any[];
    weeklyChart: any[];
    monthlyChart: any[];
    students: any[];
    user: { id?: string } | null;
}

export const TeacherOverviewPage: React.FC<TeacherOverviewPageProps> = ({
    stats,
    weeklyChart,
    monthlyChart,
    students,
    user
}) => {
    const [chartView, setChartView] = useState<'weekly'|'monthly'>('weekly');

    return (
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-brand-purple/30 transition-all group">
                        <div className="flex justify-start items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white mb-1 tracking-tighter">{stat.value}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Class Progress Chart */}
                <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800/50 rounded-4xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-white">Class Progress Trends</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartView('weekly')}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                                    chartView === 'weekly'
                                        ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >Weekly</button>
                            <button
                                onClick={() => setChartView('monthly')}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                                    chartView === 'monthly'
                                        ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >Monthly</button>
                        </div>
                    </div>

                    {/* Chart */}
                    {(() => {
                        const data = chartView === 'weekly' ? weeklyChart : monthlyChart;
                        const maxVal = Math.max(...data.map(d => d.value), 1);
                        return (
                            <div className="h-64 bg-slate-950/50 rounded-2xl border border-slate-900 flex flex-col px-4 pt-4 pb-2 relative overflow-hidden">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between px-4 py-4 pointer-events-none">
                                    {[100, 75, 50, 25, 0].map(v => (
                                        <div key={v} className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-slate-700 w-5 text-right">{v}</span>
                                            <div className="flex-1 border-t border-slate-800/60" />
                                        </div>
                                    ))}
                                </div>
                                {/* Bars */}
                                <div className="flex-1 flex items-end justify-around gap-2 relative z-10 pb-6">
                                    {data.map((item, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                                            <span className="text-[9px] font-black text-brand-purple opacity-0 group-hover:opacity-100 transition-opacity">{item.value}%</span>
                                            <div
                                                className="w-full rounded-t-lg bg-linear-to-t from-brand-purple/40 to-brand-purple transition-all duration-700 relative"
                                                style={{ height: `${(item.value / maxVal) * 150}px`, minHeight: item.value > 0 ? '4px' : '0' }}
                                            >
                                                <div className="absolute inset-x-0 top-0 h-1 bg-brand-purple/60 rounded-t-lg" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                                {data.every(d => d.value === 0) && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <span className="text-2xl opacity-30">📊</span>
                                        <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">No progress data yet</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Student Activity List */}
                <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/50 rounded-4xl p-8">
                    <h3 className="text-lg font-black text-white mb-6">Student Activity</h3>
                    <div className="flex flex-col gap-5">
                        {students.slice(0, 8).map(student => (
                            <div key={student.id} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center relative shadow-sm">
                                    <span className="text-xs font-black text-slate-400">{student.name[0]}</span>
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                        student.status === 'Online' ? 'bg-emerald-500' : student.status === 'Idle' ? 'bg-amber-500' : 'bg-slate-600'
                                    }`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-white truncate group-hover:text-brand-purple transition-colors">{student.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-linear-to-r from-brand-purple to-brand-sky rounded-full transition-all duration-500" style={{ width: `${student.progress}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500">{student.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
