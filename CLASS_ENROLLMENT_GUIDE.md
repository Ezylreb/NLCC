# 👥 Class Enrollment System - Teacher Guide

## Overview

The Class Enrollment System allows teachers to **control which students can access their classes**. Only enrolled students will see the teacher's lessons, assessments, and class content in their student dashboard.

**Key Feature**: Students see ONLY the classes they are explicitly enrolled in by their teacher.

---

## System Architecture

### Database Schema

**`class_enrollments` Table**
```
id              INT PRIMARY KEY
class_id        INT (foreign key to classes)
student_id      UUID (foreign key to users)
enrolled_by_teacher_id UUID (teacher who enrolled them)
enrolled_at     TIMESTAMP
UNIQUE(class_id, student_id) - prevents duplicate enrollments
```

### Data Flow

```
Teacher Views Classes
    ↓
Teacher Clicks "Manage Students"
    ↓
Teacher Searches for Student by Name/Email
    ↓
Teacher Clicks "Enroll"
    ↓
System Creates class_enrollments Record
    ↓
Student Can Now See Class & Content in Dashboard
```

---

## How to Use

### 1. Access Class Management (Teacher Dashboard)

1. Log in as a teacher
2. Navigate to your Teacher Dashboard
3. Click the **"Classes"** tab
4. View all your classes in grid layout

### 2. Manage Students for a Class

1. Find the class you want to manage
2. Click the **"👥 Manage Students"** button at bottom of class card
3. You'll see the **Student Management Interface**

### 3. Search & Enroll Students

**Search Bar**
- Type student's name or email (minimum 2 characters)
- Results show only students NOT already enrolled in this class
- Shows student name, email, and enrollment status

**Enroll Button**
- Click the **"+ Enroll"** button next to a student
- Student is immediately added to the class
- Success message appears (remains for 3 seconds)
- Student can now see this class in their dashboard

### 4. View Enrolled Students

The **"✅ Enrolled Students"** section shows:
- Student name and email
- Enrollment date (when student was added)
- Trash icon to remove student

### 5. Remove Students

1. Find the student in the "Enrolled Students" list
2. Click the **trash/delete icon** on the right
3. Confirm removal in popup dialog
4. Student is immediately removed
5. Student **will no longer see this class** on their dashboard

---

## Backend API Endpoints

### 1. Search Students

**Endpoint**: `GET /api/teacher/search-students`

**Parameters**:
- `q` (string): Search query (min 2 characters)
- `classId` (required): The class ID to search for

**Response**:
```json
{
  "results": [
    {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isEnrolled": false
    }
  ]
}
```

**Usage**: Automatically called by ManageClassStudents component

---

### 2. Get Enrolled Students

**Endpoint**: `GET /api/teacher/class-students`

**Parameters**:
- `classId` (required): The class ID

**Response**:
```json
{
  "classId": 123,
  "className": "Math 101",
  "totalEnrolled": 25,
  "students": [
    {
      "id": "uuid-here",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "enrolledAt": "2026-04-09T10:30:00Z"
    }
  ]
}
```

---

### 3. Enroll Student

**Endpoint**: `POST /api/teacher/class-students`

**Request Body**:
```json
{
  "classId": 123,
  "studentId": "uuid-here"
}
```

**Response**:
```json
{
  "message": "Student enrolled successfully",
  "enrollment": {
    "id": 456,
    "classId": 123,
    "studentId": "uuid-here",
    "enrolledAt": "2026-04-09T10:30:00Z"
  }
}
```

**Error Codes**:
- `409 Conflict`: Student already enrolled in this class
- `403 Forbidden`: You don't own this class
- `400 Bad Request`: Invalid studentId or classId

---

### 4. Unenroll Student

**Endpoint**: `DELETE /api/teacher/unenroll-student`

**Parameters**:
- `classId` (required): The class ID
- `studentId` (required): The student UUID

**Response**:
```json
{
  "message": "Student unenrolled successfully",
  "classId": 123,
  "studentId": "uuid-here"
}
```

---

## Student Dashboard Integration

### Updated Endpoint: `/api/student/enrolled-classes`

This endpoint now **only returns classes where the student is enrolled** via the `class_enrollments` table.

**Old Behavior**: Showed all classes from all teachers (security issue)

**New Behavior**: Shows only classes where `class_enrollments.student_id = logged_in_student_id`

**Response**:
```json
{
  "studentId": "uuid-here",
  "enrolledCount": 3,
  "classes": [
    {
      "id": 123,
      "title": "Mathematics Basics",
      "description": "Learn foundational math",
      "teacher": "Mr. Johnson",
      "teacherEmail": "johnson@school.edu",
      "teacherId": "teacher-uuid",
      "bahagiCount": 5
    }
  ]
}
```

---

## Security Features

### 1. Teacher Ownership Verification
- Every enrollment action verifies the teacher owns the class
- Only class teacher can enroll/unenroll students
- Prevents unauthorized access

### 2. Student Privacy
- Students only see classes they're enrolled in
- No cross-class visibility
- Search results filter to exclude already-enrolled students

### 3. Data Isolation
- `enrolled_by_teacher_id` tracks who enrolled which student
- Audit trail for compliance
- UNIQUE constraint prevents duplicate enrollments

### 4. Role-Based Access
```
Teacher: Can manage enrollments for their classes
Student: Can only see enrolled classes
Admin: Can view/manage all enrollments (if needed)
```

---

## Workflow Scenarios

### Scenario 1: New Class, Need Students

1. Create your class (if not done already)
2. Go to Classes tab
3. Click "Manage Students" on the new class
4. Search for first student by name (e.g., "Ali")
5. Click "Enroll" next to their name
6. Repeat for all students
7. Student receives access immediately

### Scenario 2: Remove Student Mid-Semester

1. Click "Manage Students" on the class
2. Scroll down to "Enrolled Students" section
3. Find student name in the list
4. Click the red trash icon
5. Confirm removal
6. Student no longer sees this class
7. Their progress data remains in database (for records)

### Scenario 3: Bulk Enrollment

1. Click "Manage Students"
2. Search for students one at a time or by common criteria
3. Click "Enroll" for each result
4. Uses show success message for each enrollment
5. Continue until all students are enrolled

### Scenario 4: Check Who's Enrolled

1. Click "Manage Students" on any class
2. View "✅ Enrolled Students" section
3. See full list with enrollment dates
4. Know exactly who has access

---

## Troubleshooting

### Issue: Student not found in search

**Cause**: Student account doesn't exist or has different name

**Solution**:
1. Verify student email address
2. Check if student role is set to 'student' (not admin/staff)
3. Search by different part of name
4. Create student account if needed

---

### Issue: "Student already enrolled" error

**Cause**: Student is already in this class

**Solution**:
1. Check the "✅ Enrolled Students" list
2. Student name should already appear
3. No action needed (they're good)

---

### Issue: Can't see "Manage Students" button

**Cause**: 
- Class hasn't loaded yet
- You're not the class teacher
- Browser version issue

**Solution**:
1. Refresh the page
2. Verify you created/own the class
3. Wait for classes to fully load
4. Try in different browser

---

### Issue: Removed student still sees class

**Cause**: Cache or browser session not updated

**Solution**:
1. Have student refresh their dashboard
2. Clear browser cache (Ctrl+Shift+Delete)
3. Log out and log back in
4. Check database directly in admin panel

---

## Database Migration

To add the enrollment system to an existing database, run:

```bash
# From project root:
psql -U your_user -d your_database -f setup-class-enrollments.sql
```

Or execute the SQL in your database admin tool.

---

## Configuration & Customization

### Modify Search Results Limit

File: `/api/teacher/search-students/route.ts`

```typescript
LIMIT 20  // Change 20 to your preferred limit
```

### Customize Enrollment Validation

File: `/api/teacher/class-students/route.ts`

```typescript
// Add custom checks before enrollment
if (student.status === 'inactive') {
    return error('Cannot enroll inactive students');
}
```

### Change Component Styling

File: `/components/TeacherComponents/ManageClassStudents.tsx`

Colors and sizes are configurable via Tailwind classes.

---

## Best Practices

### ✅ Do's
- Enroll students at the start of semester/unit
- Check enrollment list before starting lessons
- Remove access when student transfers classes
- Use search to quickly find students
- Communicate enrollment changes to students

### ❌ Don'ts
- Create multiple class enrollments for same student/class
- Expect removed students to have automatic access restored
- Share teacher account for cross-class enrollments
- Bypass enrollment system for "quick access"
- Assume all students are auto-enrolled (they're not!)

---

## Feature Roadmap

**Coming Soon**:
- [ ] Bulk upload student list (CSV import)
- [ ] Email notification to students on enrollment
- [ ] Class roster export to PDF
- [ ] Student attendance tracking per class
- [ ] Automatic enrollment via code/invite link
- [ ] Semester/cohort templates

---

## Support

**Questions?**

For technical issues or feature requests, contact system administrator.

**Email Templates**: If you need to communicate enrollments to students, see below.

### Email to Student (Enrollment)

---

**Subject**: You've been enrolled in [ClassName]

Hello [Student Name],

You have been enrolled in **[ClassName]** taught by **[Teacher Name]**.

You can now access this class in your student dashboard:
1. Log in to your account
2. Go to the Lessons tab
3. Select "[ClassName]"
4. Start learning!

**Class Description**: [Class Description]

Best regards,
[School Name]

---

---

## API Security Notes

### Authentication
All endpoints require authentication (user must be logged in)

### Authorization
- Teachers can only manage their own classes
- Students can only access their enrolled classes
- Admins can access all (role-based)

### Rate Limiting
- Search: 100 requests per minute per user
- Enrollment: 50 requests per minute per user
- Unenrollment: 50 requests per minute per user

### Data Validation
All inputs are validated server-side:
- Student IDs checked against database
- Class ownership verified
- Email addresses normalized
- Search queries sanitized

---

## Integration Summary

### Files Created
- `/api/teacher/search-students/route.ts` - Student search endpoint
- `/api/teacher/class-students/route.ts` - Enrollment management (GET/POST)
- `/api/teacher/unenroll-student/route.ts` - Student removal endpoint
- `/components/TeacherComponents/ManageClassStudents.tsx` - UI component
- `setup-class-enrollments.sql` - Database migration

### Files Modified
- `/app/components/TeacherDashboard.tsx` - Added manage-class tab and navigation
- `/app/api/student/enrolled-classes/route.ts` - Now filters by class_enrollments

### Database Tables
- `class_enrollments` - New table for tracking enrollments
- Updated: `classes`, `users` - Foreign key relationships

---

**System Ready!** 🎉

Teachers can now control student access on a per-class basis, ensuring students only see content from classes they're enrolled in.
