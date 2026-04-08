# Yunit and Assessment Publishing Fix

## Overview
Yunit and Assessments are key components of the Teacher's lesson creation workflow:
- **Yunit** - Learning units/discussions within a lesson that contain content and media
- **Assessment** - Quizzes/tests that evaluate student learning for a lesson

## Problem Summary
The Yunit and Assessment publishing was failing due to missing or misaligned database table schemas. The API endpoints were trying to insert data into database tables that either:
1. Didn't exist
2. Were missing required columns
3. Had different column names than what the API expected

## Root Cause Analysis

### Schema Mismatch Issues
The database had multiple conflicting schema definitions for yunits and assessments:

1. **Original Bahagi Schema** (scripts/add-lesson-schema.sql):
   - yunits referenced `bahagi_id` (Course sections)
   - assessments referenced `yunit_id`
   - Designed for a course/lesson module system

2. **Teacher Dashboard Schema** (API expectations):
   - yunits expected `lesson_id`, `class_id`, `teacher_id`
   - assessments expected `lesson_id`, `class_id`, `teacher_id`, `type`, `instructions`, `reward`, `questions`
   - Designed for direct lesson-based creation

### API Endpoints Expecting
- **create-yunit**: `title`, `content`, `mediaUrl`, `lesson_id`, `class_id`, `teacher_id`
- **create-assessment**: `title`, `type`, `instructions`, `reward`, `lesson_id`, `class_id`, `teacher_id`, `questions`

### Database Misalignment
When teachers tried to create yunits or assessments, the API would attempt to INSERT with columns that either:
- Didn't exist in the table
- Had different names (e.g., `assessment_type` vs `type`)
- Had incorrect data types

## Solutions Applied

### 1. **Created Unified Migration Script** (`scripts/migrate-yunits-assessments.mjs`)
✅ **Comprehensive migration that:**
- Checks if yunits table exists, creates or updates it
- Adds missing columns: `content`, `media_url`, `lesson_id`, `class_id`, `teacher_id`
- Preserves existing bahagi-related columns for backward compatibility
- Checks if assessments table exists, creates or updates it
- Adds missing columns: `type`, `instructions`, `reward`, `lesson_id`, `class_id`, `teacher_id`, `questions`
- Preserves existing columns: `yunit_id`, `assessment_type`, `question_data`, `xp_reward`, `coins_reward`
- Creates assessment_responses table for storing student answers
- Creates student_rewards table for tracking XP and coin earnings
- Creates 9 performance indexes for fast queries

**Migration Status:** ✅ Successfully executed
```
✅ yunits table updated with 5 new columns
✅ assessments table updated with 7 new columns
✅ assessment_responses table verified
✅ student_rewards table verified
✅ 9 performance indexes created
✅ Database ready for yunit/assessment creation
```

### 2. **Improved Error Logging**
✅ **Updated API error handling:**
- create-yunit: Now logs full error details (message, stack, code, detail)
- create-assessment: Now logs full error details for debugging
- Returns error details in response for frontend to display

### 3. **Updated Schema Definition** (`init_db.sql`)
✅ **Added complete table definitions:**
- yunits - With all columns (preserves both bahagi-based and lesson-based approaches)
- assessments - With all columns (supports both systems)
- assessment_responses - For storing student quiz answers
- student_rewards - For tracking student XP/coins earned
- All supporting indexes for performance

## Table Schemas

### Yunits Table
```sql
CREATE TABLE yunits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,                          -- Required for API
    media_url VARCHAR(500),                -- Required for API
    lesson_id VARCHAR(255),                -- Required for API
    class_id UUID REFERENCES classes(id),  -- Required for API
    teacher_id UUID NOT NULL REFERENCES users(id),  -- Required for API
    bahagi_id UUID,                        -- For backward compatibility
    subtitle VARCHAR(255),                 -- Original column
    description TEXT,                      -- Original column
    content_guide TEXT,                    -- Original column
    display_order INT DEFAULT 0,           -- Original column
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Assessments Table
```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,             -- Required for API
    instructions TEXT,                     -- Required for API
    reward INT DEFAULT 10,                 -- Required for API
    lesson_id VARCHAR(255),                -- Required for API
    class_id UUID REFERENCES classes(id),  -- Required for API
    teacher_id UUID NOT NULL REFERENCES users(id),  -- Required for API
    questions JSONB DEFAULT '[]',          -- Required for API
    yunit_id UUID REFERENCES yunits(id),   -- For backward compatibility
    assessment_type VARCHAR(50),           -- Original column
    question_data JSONB,                   -- Original column
    xp_reward INT DEFAULT 10,              -- Original column
    coins_reward INT DEFAULT 5,            -- Original column
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Assessment Responses Table
```sql
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_data JSONB DEFAULT '{}',      -- Student's answers
    is_correct BOOLEAN,                    -- Whether response is correct
    score INT,                             -- Score earned
    attempted_at TIMESTAMP DEFAULT NOW(),  -- When student attempted
    completed_at TIMESTAMP                 -- When student completed
);
```

### Student Rewards Table
```sql
CREATE TABLE student_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    yunit_id UUID REFERENCES yunits(id) ON DELETE CASCADE,
    xp_earned INT DEFAULT 0,
    coins_earned INT DEFAULT 0,
    earned_at TIMESTAMP DEFAULT NOW()
);
```

## How It Works Now

### Yunit Creation Flow
1. **Teacher clicks "Create Yunit"** in Class > Lesson detail
2. **Opens CreateYunitForm** with fields:
   - Discussion Title (required)
   - Content/Body (required)
   - Media URL (optional)
3. **Submits form** with: `title`, `content`, `mediaUrl`, `classId`, `lessonId`, `teacherId`
4. **API POST `/api/teacher/create-yunit`:**
   - Validates required fields
   - Inserts into yunits table
   - Returns created yunit
5. **Success Message** → "✅ Yunit created successfully!"

### Assessment Creation Flow
1. **Teacher clicks "Create Assessment"** in Class > Lesson detail
2. **Opens CreateAssessmentForm** with fields:
   - Assessment Title (required)
   - Assessment Type (multiple-choice, short-answer, etc.)
   - Instructions (optional)
   - Reward in Stars (default: 10)
   - Questions (with options for multiple-choice)
3. **Submits form** with: `title`, `type`, `instructions`, `reward`, `classId`, `lessonId`, `teacherId`, `questions`
4. **API POST `/api/teacher/create-assessment`:**
   - Validates required fields and type
   - Validates assessment type against allowed types
   - Inserts into assessments table
   - Returns created assessment
5. **Success Message** → "✅ Assessment created successfully!"

## Database Relationships

```
users (teacher)
  ├── lessons (teacher_id)
  │   ├── yunits (lesson_id) ← Content delivery
  │   └── assessments (lesson_id) ← Student evaluation
  │       ├── assessment_responses (assessment_id) ← Student answers
  │       └── student_rewards (assessment_id) ← Rewards earned
  └── classes (teacher_id)
      ├── yunits (class_id) ← Class-based organization
      └── assessments (class_id) ← Class-based evaluation
```

## Validation & Type Checking

### Valid Assessment Types
The system validates assessment types against this list:
- `multiple-choice` - Standard multiple choice questions
- `short-answer` - Open-ended text responses
- `checkbox` - Multi-select checkboxes
- `media-audio` - Audio recording submission
- `scramble` - Word/phrase scrambling
- `matching` - Matching pairs

Any other type will be rejected with error: "Invalid assessment type"

## File Updates

| File | Changes |
|------|---------|
| `scripts/migrate-yunits-assessments.mjs` | NEW - Comprehensive migration script |
| `app/api/teacher/create-yunit/route.ts` | Improved error logging |
| `app/api/teacher/create-assessment/route.ts` | Improved error logging |
| `init_db.sql` | Added complete yunits, assessments, assessment_responses, student_rewards table definitions |

## Backward Compatibility

✅ The migration preserves all existing columns:
- Keeps `bahagi_id` for Bahagi-based system compatibility
- Keeps `assessment_type` and `question_data` for existing data
- Keeps `xp_reward` and `coins_reward` for existing rewards system
- Adds new columns required by Teacher Dashboard

This ensures existing data and systems continue to work while supporting the new Teacher Dashboard features.

## Testing

### Manual Test - Creating Yunit
1. Navigate to Teacher Dashboard
2. Click on a Class → Open Class
3. Click on a Lesson → Lesson Details
4. Click "Create Yunit"
5. Fill in:
   - Title: "Introducing Nouns"
   - Content: "Nouns are words that name people..."
   - (Optional) Media URL: (leave empty or add URL)
6. Click "Create"
7. **Expected Result:** ✅ "Yunit created successfully!"

### Manual Test - Creating Assessment
1. Navigate to Teacher Dashboard
2. Click on a Class → Open Class
3. Click on a Lesson → Lesson Details
4. Click "Create Assessment"
5. Fill in:
   - Title: "Noun Quiz"
   - Type: "Multiple Choice"
   - Instructions: "Select the correct noun..."
   - Reward: 20
   - Questions: Add sample questions
6. Click "Create"
7. **Expected Result:** ✅ "Assessment created successfully!"

## Performance Considerations

### Indexes Created
- `idx_yunits_lesson_id` - Fast filtering by lesson
- `idx_yunits_teacher_id` - Fast filtering by teacher
- `idx_yunits_class_id` - Fast filtering by class
- `idx_assessments_lesson_id` - Fast filtering by lesson
- `idx_assessments_teacher_id` - Fast filtering by teacher
- `idx_assessments_type` - Fast filtering by type
- `idx_assessment_responses_student_id` - Fast student answer lookup
- `idx_assessment_responses_assessment_id` - Fast assessment answer lookup
- `idx_student_rewards_student_id` - Fast reward lookup

These indexes enable efficient queries for:
- Loading yunits for a lesson
- Loading assessments for a lesson
- Finding student responses
- Calculating student rewards

## Related Systems

### Student Answer Submission
When a student completes an assessment:
1. Answers stored in `assessment_responses` table
2. Score calculated based on correctness
3. Rewards (XP/coins) added to `student_rewards` table
4. Student profile updated with new totals

### Progress Tracking
- `lesson_progress` table tracks completion percentage
- `assessment_responses` records each attempt
- `student_rewards` accumulates XP and coins

## Future Enhancements

Potential improvements:
- Add assessment difficulty levels
- Add time limits for assessments
- Add randomized question order
- Add partial credit support
- Add branching logic for adaptive quizzes
- Add bulk assessment creation from templates
- Add assessment analytics dashboard

---
**Status:** ✅ FIXED
**Date:** 2026-04-08
**Migration Verified:** All tables and columns in place
**Next Steps:** Teachers can now publish Yunits and Assessments successfully
