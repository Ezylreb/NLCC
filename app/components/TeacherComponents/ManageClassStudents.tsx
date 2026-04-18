'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level?: string;
    enrolledAt?: string;
}

interface ManageClassStudentsProps {
    classId: number | string;
    className: string;
    teacherId: string;
}

export const ManageClassStudents: React.FC<ManageClassStudentsProps> = ({
    classId,
    className,
    teacherId
}) => {
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(true);

    // Load enrolled students
    useEffect(() => {
        fetchEnrolledStudents();
    }, [classId]);

    const fetchEnrolledStudents = async () => {
        try {
            setIsLoadingEnrolled(true);
            console.log('[ManageClassStudents] Fetching students with:', { classId, teacherId });
            
            const response = await apiClient.class.getStudents(classId, teacherId);

            console.log('[ManageClassStudents] API Response:', response);

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch enrolled students');
            }

            console.log('[ManageClassStudents] Students:', response.data?.students);
            setEnrolledStudents(response.data?.students || []);
        } catch (err) {
            console.error('Error fetching enrolled students:', err);
        } finally {
            setIsLoadingEnrolled(false);
        }
    };

    return (
        <div className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white mb-2">👥 Class Students</h2>
                <p className="text-sm text-slate-400">{className}</p>
                <div className="mt-3 bg-blue-900/20 border border-blue-700/30 text-blue-300 px-4 py-2.5 rounded-lg text-xs">
                    <span className="font-semibold">ℹ️ Note:</span> Student assignments are managed by the administrator. 
                    Students automatically appear here when assigned to your class.
                </div>
            </div>

            {/* Enrolled Students Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-300">
                        ✅ Students in {className} ({enrolledStudents.length})
                    </h3>
                </div>

                {isLoadingEnrolled ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                    </div>
                ) : enrolledStudents.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-sm text-slate-400 font-medium">
                            No students assigned yet
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Students will appear here when the administrator assigns them to this class
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {enrolledStudents.map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm">
                                        {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">{student.email}</p>
                                    {student.enrolledAt && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Assigned: {new Date(student.enrolledAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-700/30">
                                        ✓ Enrolled
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
