'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level?: string;
    enrolledAt?: string;
}

interface ManageClassStudentsProps {
    classId: number;
    className: string;
    teacherId: string;
}

export const ManageClassStudents: React.FC<ManageClassStudentsProps> = ({
    classId,
    className,
    teacherId
}) => {
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
    const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Load available and enrolled students
    useEffect(() => {
        fetchAvailableStudents();
        fetchEnrolledStudents();
    }, [classId]);

    const fetchAvailableStudents = async () => {
        try {
            setIsLoadingAvailable(true);
            setError('');
            const res = await fetch(
                `/api/teacher/available-students?classId=${classId}&teacherId=${teacherId}`
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch students: ${res.statusText}`);
            }

            const data = await res.json();
            setAvailableStudents(data.students || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load students');
        } finally {
            setIsLoadingAvailable(false);
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            setIsLoadingEnrolled(true);
            const res = await fetch(
                `/api/teacher/class-students?classId=${classId}&teacherId=${teacherId}`
            );

            if (!res.ok) {
                throw new Error('Failed to fetch enrolled students');
            }

            const data = await res.json();
            setEnrolledStudents(data.students || []);
        } catch (err) {
            console.error('Error fetching enrolled students:', err);
        } finally {
            setIsLoadingEnrolled(false);
        }
    };

    // Enroll a student
    const handleEnrollStudent = async (studentId: string, studentName: string) => {
        try {
            setIsEnrolling(studentId);
            setError('');
            const res = await fetch(`/api/teacher/class-students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId, studentId, teacherId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Enrollment failed');
            }

            setSuccessMessage(`${studentName} has been added to ${className}!`);

            // Refresh both lists
            await fetchAvailableStudents();
            await fetchEnrolledStudents();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Enrollment failed');
        } finally {
            setIsEnrolling(null);
        }
    };

    // Unenroll a student
    const handleUnenrollStudent = async (studentId: string, studentName: string) => {
        if (!window.confirm(`Remove ${studentName} from ${className}?`)) {
            return;
        }

        try {
            setIsRemoving(studentId);
            setError('');
            const res = await fetch(
                `/api/teacher/unenroll-student?classId=${classId}&studentId=${studentId}&teacherId=${teacherId}`,
                { method: 'DELETE' }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Removal failed');
            }

            setSuccessMessage(`${studentName} has been removed from ${className}`);

            // Refresh both lists
            await fetchAvailableStudents();
            await fetchEnrolledStudents();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Removal failed');
        } finally {
            setIsRemoving(null);
        }
    };

    return (
        <div className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white mb-2">📚 Manage Class Students</h2>
                <p className="text-sm text-slate-400">{className}</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                    ⚠️ {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
                    ✓ {successMessage}
                </div>
            )}

            {/* Available Students Table */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">➕ Available Students</h3>

                {isLoadingAvailable ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                    </div>
                ) : availableStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                        All available students have been enrolled! 🎉
                    </p>
                ) : (
                    <div className="overflow-x-auto border border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Level</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Email</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-300">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {availableStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-white font-medium">
                                            {student.firstName} {student.lastName}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-brand-purple/20 text-brand-purple">
                                                {student.level === 'kinder2' ? 'Kinder 2' : 'Kinder 1'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{student.email}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    handleEnrollStudent(student.id, `${student.firstName} ${student.lastName}`)
                                                }
                                                disabled={isEnrolling === student.id}
                                                className="bg-brand-sky hover:bg-brand-sky/80 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2"
                                            >
                                                {isEnrolling === student.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    '➕'
                                                )}
                                                Add
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Enrolled Students Section */}
            <div className="border-t border-slate-700 pt-6 space-y-3">
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
                    <p className="text-sm text-slate-500 text-center py-8">
                        No students enrolled yet. Add students from the table above.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {enrolledStudents.map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-3 rounded-lg transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm">
                                        {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400">{student.email}</p>
                                    {student.enrolledAt && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() =>
                                        handleUnenrollStudent(student.id, `${student.firstName} ${student.lastName}`)
                                    }
                                    disabled={isRemoving === student.id}
                                    className="ml-3 flex items-center justify-center bg-red-900/50 hover:bg-red-900 disabled:bg-slate-700 text-red-300 hover:text-red-200 p-2 rounded-lg transition-colors"
                                    title="Remove student from class"
                                >
                                    {isRemoving === student.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-blue-300">
                <p className="font-semibold mb-1">ℹ️ How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Select students from the table above to add them to your class</li>
                    <li>Each student shows their name, level (Kinder 1 or 2), and email</li>
                    <li>Click the "Add" button to enroll a student in your class</li>
                    <li>Remove students anytime using the trash button below</li>
                </ul>
            </div>
        </div>
    );
};
