import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const { studentId, response, isCorrect } = await request.json();

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { error: 'Assessment ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Verify assessment exists
    const assessmentCheck = await query(
      'SELECT id FROM bahagi_assessment WHERE id = $1',
      [assessmentId]
    );

    if (assessmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Insert assessment response
    const result = await query(
      `INSERT INTO assessment_response (student_id, assessment_id, response, is_correct, completion_date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, student_id, assessment_id, response, is_correct, completion_date`,
      [studentId, assessmentId, response ? JSON.stringify(response) : null, isCorrect || false]
    );

    return NextResponse.json({ 
      response: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    let queryStr = 'SELECT id, student_id, assessment_id, response, is_correct, completion_date FROM assessment_response WHERE assessment_id = $1';
    const queryParams = [assessmentId];

    if (studentId) {
      queryStr += ' AND student_id = $2';
      queryParams.push(studentId);
    }

    queryStr += ' ORDER BY completion_date DESC';

    const result = await query(queryStr, queryParams);

    return NextResponse.json({ 
      responses: result.rows 
    });
  } catch (error) {
    console.error('Error fetching assessment responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment responses' },
      { status: 500 }
    );
  }
}
