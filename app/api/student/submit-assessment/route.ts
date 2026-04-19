/**
 * @deprecated Use POST /api/rest/assessments/[id]/submit instead.
 * This route uses Supabase and is no longer the active submission path.
 * Kept for reference only — will return a redirect notice.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use POST /api/rest/assessments/{id}/submit instead.",
      redirect: "/api/rest/assessments"
    },
    { status: 410 }
  );
}
