import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Check if columns exist
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('teacher_id', 'class_id')
    `);
    
    const hasTeacherId = result.rows.some(r => r.column_name === 'teacher_id');
    const hasClassId = result.rows.some(r => r.column_name === 'class_id');
    
    return NextResponse.json({
      teacherId: hasTeacherId ? 'exists' : 'missing',
      classId: hasClassId ? 'exists' : 'missing',
      allColumns: result.rows,
      needsMigration: !hasTeacherId || !hasClassId
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Running migrations...');
    
    // Add teacher_id column
    try {
      await query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ teacher_id column added');
    } catch (err: any) {
      console.log('ℹ️ teacher_id column:', err.message);
    }
    
    // Add class_id column
    try {
      await query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL
      `);
      console.log('✅ class_id column added');
    } catch (err: any) {
      console.log('ℹ️ class_id column:', err.message);
    }
    
    // Create indexes
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id)`);
      console.log('✅ teacher_id index created');
    } catch (err: any) {
      console.log('ℹ️ teacher_id index:', err.message);
    }
    
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id)`);
      console.log('✅ class_id index created');
    } catch (err: any) {
      console.log('ℹ️ class_id index:', err.message);
    }
    
    // Verify completion
    const verifyResult = await query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('teacher_id', 'class_id')
    `);
    
    const hasTeacherId = verifyResult.rows.some(r => r.column_name === 'teacher_id');
    const hasClassId = verifyResult.rows.some(r => r.column_name === 'class_id');
    
    return NextResponse.json({
      status: 'success',
      message: 'Migration completed',
      teacherId: hasTeacherId ? 'exists' : 'missing',
      classId: hasClassId ? 'exists' : 'missing',
      success: hasTeacherId && hasClassId
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
