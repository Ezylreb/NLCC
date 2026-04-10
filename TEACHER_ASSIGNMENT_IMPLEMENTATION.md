# Teacher Assignment Feature - Complete Implementation Guide

## Overview

The Admin Dashboard now includes full support for assigning teachers to students at creation time and managing those assignments afterward. This implementation ensures proper data persistence in the database and provides an intuitive user interface for managing student-teacher relationships.

---

## What Was Implemented

### 1. Database Enhancement
**Added Teacher-Student Relationship Support**

File: `scripts/migrate-student-teacher-relationship.sql`

Changes made:
- Added `teacher_id` UUID column to `users` table
- Foreign key references `users(id) ON DELETE SET NULL`
- Added database index for quick teacher lookups
- Constraint ensures data integrity

This allows each student (role='USER') to optionally be assigned to a teacher.

---

### 2. Backend API Layer

#### A. New Endpoint: `/api/admin/teachers`
**GET** - Fetch all available teachers

```bash
GET /api/admin/teachers
```

**Response:**
```json
{
  "success": true,
  "teachers": [
    {
      "id": "uuid-1",
      "firstName": "Juan",
      "lastName": "dela Cruz",
      "email": "juan@example.com",
      "fullName": "Juan dela Cruz"
    },
    {
      "id": "uuid-2",
      "firstName": "Maria",
      "lastName": "Santos",
      "email": "maria@example.com",
      "fullName": "Maria Santos"
    }
  ]
}
```

**Features:**
- Orders teachers by first name, then last name
- Only returns users with role='TEACHER'
- Returns formatted full names for display

---

#### B. Updated Endpoint: `/api/admin/create-student`
**POST** - Create a new student with optional teacher assignment

```bash
POST /api/admin/create-student
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Doe",
  "email": "student@example.com",
  "password": "temppassword123",
  "lrn": "123456789012",
  "className": "Kinder 1",
  "teacherId": "uuid-of-teacher"  // Optional
}
```

**New Features:**
- Accepts optional `teacherId` parameter
- Validates teacher exists before creating student
- Records teacher assignment in activity logs
- `teacherId` is optional (student can be created without teacher)

**Error Handling:**
```json
{
  "error": "Selected teacher does not exist",
  "status": 400
}
```

---

#### C. Updated Endpoint: `/api/admin/users/[id]`
**GET** - Fetch user details (now includes teacher_id)

```bash
GET /api/admin/users/{studentId}
```

**Updated GET Response:**
```json
{
  "user": {
    "id": "uuid",
    "first_name": "Juan",
    "last_name": "Doe",
    "email": "student@example.com",
    "lrn": "123456789012",
    "role": "USER",
    "class_name": "Kinder 1",
    "teacher_id": "uuid-of-assigned-teacher",  // NEW
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**PATCH** - Update user details (now supports teacher assignment)

```bash
PATCH /api/admin/users/{studentId}
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Doe",
  "email": "student@example.com",
  "lrn": "123456789012",
  "role": "USER",
  "className": "Kinder 1",
  "teacher_id": "uuid-of-new-teacher"  // NEW: Can update teacher assignment
}
```

**New Features:**
- Validates teacher exists before updating
- Returns helpful error messages
- Supports clearing teacher assignment by setting to `null`

---

### 3. Frontend UI Components

#### A. Student Creation Modal
**"Register Student" Dialog**

New field added: **"Assign Teacher (Optional)"**
- Dropdown populated with registered teachers
- Teachers fetched when modal opens
- Shows "Loading teachers..." while fetching
- Shows "No teachers available" if none exist
- Optional field (can skip selection)
- Displays teacher names in readable format: "FirstName LastName"

**Form Submission:**
- Teacher assignment included in creation request
- Success message confirms account creation
- Form resets on submit (including teacher field)

#### B. Student Management Modal
**"Manage Student" Dialog**

New field added: **"Assigned Teacher"**
- Only shown for users with role != 'TEACHER'
- Pre-populated with current assignment (if any)
- Dropdown fetched on modal open
- Allows changing teacher assignment
- Can clear assignment by selecting "No Teacher Assigned"

**Features:**
- Changes persist to database on "SAVE CHANGES"
- Activity logs record updates
- Proper error handling for invalid selections

#### C. AdminDashboard.tsx Updates

**State Variables Added:**
```typescript
const [teachers, setTeachers] = useState<any[]>([]);
const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
```

**Updated newStudent Object:**
```typescript
const [newStudent, setNewStudent] = useState({
  firstName: '',
  lastName: '',
  email: '',
  lrn: '',
  password: '',
  className: '',
  teacherId: '',  // NEW
});
```

**New Function: `fetchTeachers()`**
- Calls `/api/admin/teachers`
- Populates teachers state
- Handles loading and error states

**Trigger Points:**
- Called when "Create Student" button clicked
- Called when "Manage" clicked on student record

---

## How to Use

### For Admin: Creating a Student with Teacher Assignment

1. Click **"+ Create Student"** button in User Management tab
2. Fill in student details:
   - First Name
   - Last Name
   - Student LRN (12 digits)
   - Login Email
   - Temporary Password
   - Assign Class (optional)
3. **NEW:** Select a teacher from "Assign Teacher (Optional)" dropdown
4. Click **"CREATE ACCOUNT"**
5. Student is created and linked to the selected teacher

### For Admin: Changing a Student's Teacher

1. Go to **"User Management"** tab
2. Find the student in the users list
3. Click **"Manage"** button
4. In the modal, use "Assigned Teacher" dropdown to:
   - Select a teacher to assign
   - Select "No Teacher Assigned" to remove teacher
5. Click **"SAVE CHANGES"**

### For Admin: Creating a Student Without a Teacher

1. Follow creation steps above
2. Leave "Assign Teacher (Optional)" as "No Teacher Assigned"
3. Click **"CREATE ACCOUNT"**
4. Student is created without teacher assignment
5. Teacher can be assigned later through the Manage dialog

---

## Database Migration Steps

Before deploying, run this migration on your database:

```sql
-- Run this migration to add teacher_id support
-- File: scripts/migrate-student-teacher-relationship.sql

-- Add teacher_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);
```

**Steps:**
1. Connect to your PostgreSQL database
2. Execute the migration SQL file
3. Verify the new column exists: `\d users` (psql)
4. Restart your application

---

## Validation & Error Handling

### Client-Side Validation
- Form fields required before submission
- Email format validation
- LRN format validation (12 digits)
- Password length requirements

### Server-Side Validation
- Duplicate email check
- Duplicate LRN check
- Teachers validated to exist before assignment
- Only TEACHER role can be selected as teacher

### Error Messages
Users see clear error messages:
- "Selected teacher does not exist"
- "User with this email or LRN already exists"
- "All fields are required"
- Connection errors with actionable feedback

---

## Database Relationships

```
users (Students)
├── id (UUID primary key)
├── role = 'USER'
├── teacher_id (foreign key → users.id where role='TEACHER')
└── other fields...

users (Teachers)
├── id (UUID primary key)
├── role = 'TEACHER'
└── other fields...
```

**Cascade Behavior:**
- If teacher is deleted: student's teacher_id set to NULL
- Student can be deleted independently
- Multiple students can share same teacher

---

## Activity Logging

All teacher assignments are logged in `activity_logs`:

```sql
INSERT INTO activity_logs (user_id, action, type, details)
VALUES (
  student_id,
  'Student Registered',
  'system',
  'Admin created student: Juan Doe (LRN: 123456789012) with assigned teacher'
);
```

---

## API Examples

### Example 1: Create Student with Teacher

```bash
curl -X POST http://localhost:3000/api/admin/create-student \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Doe",
    "email": "juan.doe@example.com",
    "password": "tempPass123",
    "lrn": "123456789012",
    "className": "Kinder 1",
    "teacherId": "a1b2c3d4-e5f6-7890-abcd-ef0123456789"
  }'
```

### Example 2: Get All Teachers

```bash
curl -X GET http://localhost:3000/api/admin/teachers
```

### Example 3: Update Student's Teacher

```bash
curl -X PATCH http://localhost:3000/api/admin/users/student-id \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Doe",
    "email": "juan.doe@example.com",
    "lrn": "123456789012",
    "role": "USER",
    "className": "Kinder 1",
    "teacher_id": "new-teacher-id"
  }'
```

---

## Features Summary

✅ **Create students with teacher assignment**
✅ **Optional teacher assignment** (not required)
✅ **Modify teacher assignment after creation**
✅ **View assigned teacher in user details**
✅ **Remove teacher assignment**
✅ **Teacher list always current** (only TEACHER role)
✅ **Proper error handling and validation**
✅ **Activity logging** (who assigned what/when)
✅ **Database constraints** (ensure data integrity)
✅ **Index optimization** (fast teacher lookups)

---

## Testing Checklist

- [ ] Run migration script on test database
- [ ] Create new teacher account
- [ ] Create student and assign to teacher
- [ ] Verify student shows with teacher in manage dialog
- [ ] Update student's teacher assignment
- [ ] Create student without teacher (leave blank)
- [ ] Delete teacher and verify student's teacher_id is NULL
- [ ] Check activity logs for teacher assignment records
- [ ] Try assigning non-existent teacher (should fail)
- [ ] Verify teacher dropdown loads only TEACHER role users

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `scripts/migrate-student-teacher-relationship.sql` | Database schema update | New |
| `app/api/admin/teachers/route.ts` | Fetch teachers endpoint | New |
| `app/api/admin/create-student/route.ts` | Add teacherId support | Updated |
| `app/api/admin/users/[id]/route.ts` | Add teacherId support | Updated |
| `app/components/AdminDashboard.tsx` | UI for teacher assignment | Updated |

---

## Next Steps

1. **Deploy Database Migration** - Run the SQL migration in production
2. **Test End-to-End** - Create students with/without teachers
3. **Monitor** - Check activity logs for teacher assignments
4. **Extend** (Optional):
   - Add teacher column to users list view
   - Create reports showing student-teacher assignments
   - Add bulk assignment functionality
   - Add teacher validation in class enrollment

---

