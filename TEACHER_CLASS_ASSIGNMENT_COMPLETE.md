# Teacher & Class Assignment Enhancement - Complete Documentation

## Overview

This document describes the comprehensive enhancement to the Admin User Management module that implements proper student-teacher-class relationships with dynamic filtering and validation.

---

## Features Implemented

### 1. **Mandatory Teacher Assignment**
- Teachers are now **REQUIRED** when creating or managing students
- Only users with the "Teacher" role appear in the dropdown
- Students cannot be created without a teacher assignment

### 2. **Dynamic Class Filtering by Teacher**
- Class dropdown is **DISABLED** until a teacher is selected
- When a teacher is selected, only their classes appear in the dropdown
- Classes are filtered based on teacher_id relationship
- Real-time filtering when teacher selection changes

### 3. **Proper Data Relationships**
```
Teacher (User with role='TEACHER')
├── created multiple Classes
└── assigned to multiple Students

Student (User with role='USER')
├── assigned to one Teacher (required)
└── assigned to one Class (required, belongs to their teacher)

Class
├── belongs to one Teacher (teacher_id)
└── can have many Students
```

### 4. **Form Validation**
- Both teacher and class selections are validated at form submission
- Server-side validation ensures class belongs to selected teacher
- Clear error messages for validation failures

---

## Database Schema Changes

### Migration: `scripts/migrate-student-class-relationship.sql`

```sql
-- Add class_id foreign key to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
```

**Why these changes:**
- `class_id` creates a foreign key relationship to the `classes` table
- Replaces reliance on `class_name` string field with a proper relational link
- `ON DELETE SET NULL` ensures orphan protection if class is deleted
- Index improves query performance for student lookups by class

---

## Backend API Endpoints

### 1. **GET `/api/admin/classes`**
Fetch classes created by a specific teacher.

**Parameters:**
```
?teacherId={uuid}
```

**Response:**
```json
{
  "success": true,
  "classes": [
    {
      "id": "class-uuid-1",
      "name": "Grade 1 - Morning"
    },
    {
      "id": "class-uuid-2",
      "name": "Grade 1 - Afternoon"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing teacherId parameter
- `404 Not Found` - Teacher doesn't exist
- `500 Internal Server Error` - Database error

**Validation:**
- Checks teacher exists
- Checks teacher has TEACHER role
- Only returns non-archived classes

---

### 2. **POST `/api/admin/create-student` (Updated)**
Create a new student with mandatory teacher and class assignment.

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "student@example.com",
  "password": "tempPassword123",
  "lrn": "123456789012",
  "teacherId": "teacher-uuid",        // REQUIRED
  "classId": "class-uuid"              // REQUIRED
}
```

**Changes from previous version:**
- `teacherId` is now **REQUIRED** (not optional)
- Added `classId` parameter (REQUIRED)
- Removed `className` parameter (derived from classId)
- Enhanced validation:
  - Checks teacher exists and has TEACHER role
  - Checks class exists and is not archived
  - **Validates class belongs to selected teacher**
  
**Response:**
```json
{
  "success": true,
  "userId": "student-uuid"
}
```

**Error Messages:**
- "Teacher selection is required"
- "Class selection is required"
- "Selected teacher does not exist"
- "Selected class does not exist"
- "Selected class does not belong to the selected teacher"
- "User with this email or LRN already exists"

---

### 3. **PATCH `/api/admin/users/[id]` (Updated)**
Update user details including teacher and class assignments.

**Request Body (for students):**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "student@example.com",
  "lrn": "123456789012",
  "role": "USER",
  "className": "Grade 1 - Morning",
  "teacher_id": "teacher-uuid",      // REQUIRED for students
  "class_id": "class-uuid"            // REQUIRED for students
}
```

**Enhanced Validation:**
- For students (role='USER'):
  - Teacher ID is required
  - Class ID is required
  - Class must belong to selected teacher
- For teachers (role='TEACHER'):
  - No teacher/class requirements

**Response:**
```json
{
  "success": true
}
```

**Error Messages:**
- "Teacher is required for student accounts"
- "Class is required for student accounts"
- "Selected class does not belong to the selected teacher"

---

## Frontend Components

### AdminDashboard.tsx Updates

#### State Management
```typescript
// Added states
const [classes, setClasses] = useState<any[]>([]);
const [isLoadingClasses, setIsLoadingClasses] = useState(false);

// Updated student creation object
const [newStudent, setNewStudent] = useState({
  firstName: '',
  lastName: '',
  email: '',
  lrn: '',
  password: '',
  teacherId: '',      // REQUIRED
  classId: '',        // NEW - REQUIRED
});
```

#### New Function: `fetchClasses(teacherId: string)`
```typescript
const fetchClasses = async (teacherId: string) => {
  if (!teacherId) {
    setClasses([]);
    return;
  }
  setIsLoadingClasses(true);
  try {
    const response = await fetch(`/api/admin/classes?teacherId=${teacherId}`);
    const data = await response.json();
    if (response.ok) {
      setClasses(data.classes);
    } else {
      console.error('Failed to fetch classes:', data.error);
      setClasses([]);
    }
  } catch (err) {
    console.error('Failed to fetch classes:', err);
    setClasses([]);
  } finally {
    setIsLoadingClasses(false);
  }
};
```

#### Form Validation (handleCreateStudent)
Added checks:
```typescript
if (!newStudent.teacherId.trim()) {
  setError('Teacher selection is required.');
  return;
}

if (!newStudent.classId.trim()) {
  setError('Class selection is required.');
  return;
}
```

#### UI Changes in Student Creation Modal

**Before:**
- "Assign Teacher (Optional)" - single optional dropdown

**After:**
- "👨‍🏫 Assign Teacher (Required)" - mandatory dropdown
- "📚 Assign Class (Required)" - second dropdown (disabled until teacher selected)

**Teacher Dropdown Behavior:**
```typescript
onChange={(e) => {
  const teacherId = e.target.value;
  setNewStudent({...newStudent, teacherId, classId: ''});
  if (teacherId) {
    fetchClasses(teacherId);  // Load classes for this teacher
  } else {
    setClasses([]);           // Clear classes
  }
}}
```

**Class Dropdown Behavior:**
- Disabled when no teacher selected
- Shows "Select a teacher first" placeholder
- Shows "Loading classes..." while fetching
- Shows "No classes available" if teacher has no classes
- Populated with teacher's classes when ready

### Student Management Modal Updates

**Added Teacher Dropdown:**
- Shows all teachers
- On change: fetches new classes and clears current class selection
- Required for students

**Added Class Dropdown:**
- Disabled until teacher selected
- Dynamically populated based on selected teacher
- Required for students
- Allows changing class assignment

**Teacher Selection Trigger:**
When "Manage" button clicked:
```typescript
if (user.role !== 'TEACHER') {
  fetchTeachers();
  if (user.teacher_id) {
    fetchClasses(user.teacher_id);  // Pre-load classes if student has teacher
  }
}
```

---

## User Experience Flow

### Creating a Student

1. **Click "Create Student" button**
   - Modal opens
   - Teachers list is NOT loaded yet

2. **Select a Teacher**
   - Modal fetches teachers from database
   - User selects teacher from dropdown
   - System automatically fetches classes for that teacher
   - Class dropdown becomes enabled

3. **Select a Class**
   - User selects class from dropdown
   - Only classes created by selected teacher appear

4. **Fill Other Details**
   - First Name
   - Last Name
   - Email
   - LRN (12 digits)
   - Password

5. **Submit Form**
   - Validation checks:
     - All fields filled
     - Teacher selected
     - Class selected
     - LRN is 12 digits
     - Email is valid
   - Student created with teacher_id and class_id saved

### Managing a Student

1. **Click "Manage" button in user list**
   - Manage modal opens
   - Teachers and classes are fetched
   - If student has existing teacher, classes for that teacher are pre-loaded

2. **Change Teacher (Optional)**
   - Select new teacher from dropdown
   - Class list updates automatically
   - Previous class selection cleared

3. **Change Class (Optional)**
   - Select class from updated list

4. **Click "Save Changes"**
   - Validation ensures:
     - Teacher selected
     - Class selected
     - Class belongs to teacher
   - Changes saved to database

---

## Database Queries

### Find all students with their teachers and classes
```sql
SELECT 
  s.first_name, s.last_name, s.lrn,
  t.first_name as teacher_first, t.last_name as teacher_last,
  c.name as class_name
FROM users s
LEFT JOIN users t ON s.teacher_id = t.id
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.role = 'USER'
ORDER BY t.first_name, s.first_name;
```

### Find students missing teacher or class assignment
```sql
SELECT id, first_name, last_name, email
FROM users
WHERE role = 'USER' 
  AND (teacher_id IS NULL OR class_id IS NULL);
```

### Find all classes for a specific teacher
```sql
SELECT id, name
FROM classes
WHERE teacher_id = $1 AND is_archived = FALSE
ORDER BY name;
```

### Count students per teacher
```sql
SELECT 
  t.first_name, t.last_name, COUNT(s.id) as student_count
FROM users t
LEFT JOIN users s ON t.id = s.teacher_id
WHERE t.role = 'TEACHER'
GROUP BY t.id, t.first_name, t.last_name
ORDER BY student_count DESC;
```

---

## Validation Rules

### Server-Side Validation (Required)

**Student Creation:**
- ✅ All required fields present
- ✅ Teacher ID is provided
- ✅ Class ID is provided
- ✅ Teacher exists with TEACHER role
- ✅ Class exists and is not archived
- ✅ **Class.teacher_id matches selected teacher_id**
- ✅ LRN is exactly 12 digits
- ✅ LRN is unique
- ✅ Email is unique and valid format

**Student Update:**
- ✅ If role is USER, teacher_id is required
- ✅ If role is USER, class_id is required
- ✅ If class_id provided, must belong to teacher_id
- ✅ All other validation same as creation

### Client-Side Validation (UI)

**Student Creation:**
- ✅ All fields required before submit
- ✅ Teacher must be selected
- ✅ Class must be selected
- ✅ Class dropdown disabled until teacher selected
- ✅ Show loading state while fetching
- ✅ Show "Select teacher first" if no teacher selected

**Student Update:**
- ✅ Same validation as creation
- ✅ Fetch classes when opening manage modal
- ✅ Fetch classes when teacher selection changes

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Teacher selection is required" | No teacher selected | Select teacher from dropdown |
| "Class selection is required" | No class selected | Select class from dropdown |
| "Selected class does not belong to the selected teacher" | Class belongs to different teacher | Verify class/teacher selection |
| "No classes available" | Selected teacher has no classes | Create classes for this teacher first |
| Class dropdown shows "Select a teacher first" | Teacher not selected yet | Select a teacher from dropdown |
| Classes not loading | API error or teacher not found | Check network, verify teacher exists |

---

## Migration & Deployment Steps

### 1. Database Migration
```bash
# Connect to your PostgreSQL database
psql -U your_user -d your_database -f scripts/migrate-student-class-relationship.sql
```

### 2. Verify Migration
```sql
-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name='users' AND column_name='class_id';

-- Check index exists
SELECT indexname FROM pg_indexes 
WHERE tablename='users' AND indexname='idx_users_class_id';
```

### 3. Deploy Application
- Push code changes
- Restart application
- Test in development environment first

### 4. Test Workflow (See Testing Checklist below)

---

## Testing Checklist

- [ ] **Database Migration**
  - [ ] Migration runs without errors
  - [ ] `class_id` column added to users table
  - [ ] Index created for performance

- [ ] **API Endpoints**
  - [ ] GET `/api/admin/classes?teacherId={uuid}` returns classes for teacher
  - [ ] GET `/api/admin/classes?teacherId=invalid` returns 404
  - [ ] POST create-student with teacher and class succeeds
  - [ ] POST create-student without teacher fails with error
  - [ ] POST create-student without class fails with error
  - [ ] POST create-student with class from different teacher fails
  - [ ] PATCH user accepts teacher_id and class_id
  - [ ] PATCH user validates teacher/class for students

- [ ] **Frontend - Create Student**
  - [ ] Modal opens
  - [ ] Teachers dropdown populated when opened
  - [ ] Class dropdown starts disabled
  - [ ] Selecting teacher loads their classes
  - [ ] Changing teacher clears class selection
  - [ ] Can submit with teacher and class selected
  - [ ] Cannot submit without teacher selected
  - [ ] Cannot submit without class selected
  - [ ] Student created with correct teacher_id and class_id

- [ ] **Frontend - Manage Student**
  - [ ] Open manage modal for student
  - [ ] Current teacher shown in dropdown
  - [ ] Current class shown in dropdown
  - [ ] Can change teacher
  - [ ] Changing teacher updates class options
  - [ ] Can change class
  - [ ] Cannot submit without teacher
  - [ ] Cannot submit without class
  - [ ] Changes saved correctly

- [ ] **Edge Cases**
  - [ ] Teacher with no classes shows "No classes available"
  - [ ] Changing teacher to one with no classes shows no options
  - [ ] Creating second student for same teacher/class works
  - [ ] Multiple students can have same teacher and class
  - [ ] Student can only be in teacher's own classes

- [ ] **Validation Messages**
  - [ ] Clear error messages appear
  - [ ] Error messages are specific (teacher vs class)
  - [ ] Success messages on creation/update

---

## Files Changed Summary

| File | Change | Type |
|------|--------|------|
| `scripts/migrate-student-class-relationship.sql` | Add class_id column | New |
| `app/api/admin/classes/route.ts` | Fetch classes by teacher | New |
| `app/api/admin/create-student/route.ts` | Require teacher/class | Updated |
| `app/api/admin/users/[id]/route.ts` | Support class_id | Updated |
| `app/components/AdminDashboard.tsx` | Dynamic filtering UI | Updated |

---

## API Usage Examples

### Example 1: List classes for a teacher
```bash
curl "http://localhost:3000/api/admin/classes?teacherId=teacher-uuid"
```

### Example 2: Create student with teacher and class
```bash
curl -X POST http://localhost:3000/api/admin/create-student \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "password": "temp123",
    "lrn": "123456789012",
    "teacherId": "teacher-uuid",
    "classId": "class-uuid"
  }'
```

### Example 3: Update student teacher/class
```bash
curl -X PATCH http://localhost:3000/api/admin/users/student-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "lrn": "123456789012",
    "role": "USER",
    "className": "Grade 1",
    "teacher_id": "new-teacher-uuid",
    "class_id": "new-class-uuid"
  }'
```

---

## Troubleshooting

### Issue: Class dropdown shows "No classes available"
**Cause:** Selected teacher has no classes
**Solution:** Create classes for this teacher in the teacher panel

### Issue: Changing teacher doesn't update class options
**Cause:** Classes not fetched or stale cache
**Solution:** Hard refresh browser (Ctrl+Shift+R), check network tab for API call

### Issue: Error "Selected class does not belong to teacher"
**Cause:** Class belongs to different teacher (race condition or data issue)
**Solution:** Refresh page and try again, verify selector state matches data

### Issue: Migration fails with "column already exists"
**Cause:** Column was previously added
**Solution:** This is safe, change `ADD COLUMN IF NOT EXISTS` to `ADD COLUMN` (handles idempotency)

---

## Rollback Plan

If issues occur:

1. **Revert code changes** - deploy previous version
2. **Keep database migration** - no data loss, just ignore new columns
3. **Test previous version** - verify functionality restored

No destructive rollback needed - migration is additive only.

---

