# Teacher Assignment Feature - Quick Reference

## What's New

When admins create or manage students in the Admin Dashboard, they can now:
- 🎯 **Assign a teacher** during student creation
- 👨‍🏫 **Select from registered teachers** (dropdown list)
- ✏️ **Change teacher assignments** for existing students
- 🗑️ **Remove teacher assignment** when needed

---

## For the Admin

### Creating a Student with a Teacher

1. Click **"+ Create Student"**
2. Fill in basics: Name, Email, LRN, Password
3. **NEW:** Pick a teacher from the "Assign Teacher (Optional)" dropdown
4. Click **"CREATE ACCOUNT"**

### Managing a Student's Teacher

1. Go to **User Management** tab
2. Click **"Manage"** on any student
3. Use the **"Assigned Teacher"** dropdown to:
   - Assign a new teacher
   - Change existing teacher
   - Remove teacher (select "No Teacher Assigned")
4. Click **"SAVE CHANGES"**

---

## Technical Details

### Database
- `users.teacher_id` - UUID foreign key to teacher's user record
- Index for fast lookups
- NULL-compatible (optional assignment)

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/teachers` | GET | Get list of available teachers |
| `/api/admin/create-student` | POST | Create student (with optional teacher) |
| `/api/admin/users/{id}` | PATCH | Update student (including teacher) |

### Authentication
- Only admins can assign teachers (handled by middleware)
- Validates teacher exists before saving
- Logs all assignments for audit trail

---

## Behavior

✅ **Teacher selection is OPTIONAL** - Create students without assigning teacher
✅ **Dropdown only shows teachers** - Filters by role='TEACHER'
✅ **Handles edge cases** - Graceful when no teachers exist
✅ **Dynamic updates** - Dropdown fetches teachers on modal open
✅ **Validation** - Server validates teacher exists
✅ **Audit trail** - Activity logs record assignments

---

## Database Migration Required

Run this first:

```bash
# File: scripts/migrate-student-teacher-relationship.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);
```

---

## Files Changed

- ✨ `scripts/migrate-student-teacher-relationship.sql` - Database migration
- ✨ `app/api/admin/teachers/route.ts` - New endpoint (GET teachers)
- 🔄 `app/api/admin/create-student/route.ts` - Added teacherId parameter
- 🔄 `app/api/admin/users/[id]/route.ts` - Added teacher_id support
- 🔄 `app/components/AdminDashboard.tsx` - Added UI components

---

## Testing

1. Create a teacher account first
2. Create student and assign to teacher
3. Verify in Manage dialog (should show assigned teacher)
4. Change teacher assignment
5. Create student without teacher (optional test)
6. Check database: `SELECT id, first_name, teacher_id FROM users WHERE role='USER';`

---

## Error Messages You Might See

| Message | Means | Fix |
|---------|-------|-----|
| "Selected teacher does not exist" | Invalid teacher ID sent | Select a teacher from dropdown |
| "No teachers available" | No TEACHER role accounts exist | Create a teacher first |
| "Loading teachers..." | API call in progress | Wait, dropdown will populate |
| Email already in use | Duplicate email | Use different email |
| LRN must be exactly 12 digits | Invalid LRN format | Use 12-digit LRN |

---

## Queries for Database Admin

```sql
-- Find all students and their assigned teachers
SELECT 
  s.first_name, s.last_name, s.lrn,
  t.first_name as teacher_first, t.last_name as teacher_last
FROM users s
LEFT JOIN users t ON s.teacher_id = t.id
WHERE s.role = 'USER'
ORDER BY s.first_name;

-- Find students without a teacher
SELECT id, first_name, last_name, email
FROM users
WHERE role = 'USER' AND teacher_id IS NULL;

-- Find all students for a specific teacher
SELECT s.first_name, s.last_name, s.lrn
FROM users s
WHERE s.teacher_id = 'teacher-uuid-here'
ORDER BY s.first_name;

-- Count students per teacher
SELECT 
  t.first_name, t.last_name, COUNT(s.id) as student_count
FROM users t
LEFT JOIN users s ON t.id = s.teacher_id
WHERE t.role = 'TEACHER'
GROUP BY t.id, t.first_name, t.last_name
ORDER BY student_count DESC;
```

---

## FAQ

**Q: Can students be created without a teacher?**
A: Yes! Teacher assignment is optional. Students can be assigned to a teacher later.

**Q: Can I change a student's teacher?**
A: Yes! Use the Manage dialog to update teacher assignment anytime.

**Q: What happens if I delete a teacher?**
A: The teacher_id for their students will be set to NULL (no orphans).

**Q: Can multiple students have the same teacher?**
A: Yes! One teacher can be assigned to many students.

**Q: Can a teacher be reassigned?**
A: Yes! You can change a student's teacher at any time.

**Q: Is there an audit trail?**
A: Yes! All assignments are logged in `activity_logs` table.

---

