import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const yunitId = request.nextUrl.searchParams.get('yunitId');

    if (!yunitId) {
      return NextResponse.json(
        { error: 'Yunit ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, title, assessment_type, questions, teacher_id, published_at, created_at 
       FROM assessments 
       WHERE yunit_id = $1
       ORDER BY created_at DESC`,
      [yunitId]
    );

    return NextResponse.json({
      assessments: result.rows
    });
  } catch (error: any) {
    console.error('CRITICAL: Get Yunit Assessments Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail
    });
    return NextResponse.json(
      { error: 'Failed to retrieve assessments', details: error?.message },
      { status: 500 }
    );
  }
}
