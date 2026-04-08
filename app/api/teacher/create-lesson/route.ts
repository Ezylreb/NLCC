import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { title, description, category, icon, color, teacherId, className } = await request.json();

    if (!title || !category || !teacherId) {
      return NextResponse.json({ error: 'Title, Category, and Teacher ID are required' }, { status: 400 });
    }

    // Generate a unique ID for the lesson (slug-style) - limited to safe length just in case
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 40);
    const id = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

    console.log(`Attempting to create lesson: ${id} for teacher: ${teacherId} in class: ${className}`);

    const insertRes = await query(
      `INSERT INTO lessons (id, title, description, category, icon, color, status, students_count, rating, teacher_id, class_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [id, title, description || '', category, icon || '📚', color || 'bg-brand-purple', 'Published', 0, 5.0, teacherId, className || 'General']
    );

    // Link teacher to lesson - wrap in try-catch to prevent blocking the main response
    try {
      await query(
        "INSERT INTO activity_logs (user_id, action, type, details) VALUES ($1, $2, $3, $4)",
        [teacherId, 'Lesson Created', 'system', `Teacher created lesson: ${title} (${id})`]
      );
    } catch (logError) {
      console.warn('Non-blocking activity log failed:', logError);
    }

    console.log(`Successfully created lesson: ${id}`);
    return NextResponse.json({ success: true, lesson: insertRes.rows[0] });
  } catch (error: any) {
    console.error('CRITICAL: Create Lesson Error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
    });
    return NextResponse.json({ 
        error: 'Failed to publish lesson', 
        details: error.message,
        code: error.code 
    }, { status: 500 });
  }
}
