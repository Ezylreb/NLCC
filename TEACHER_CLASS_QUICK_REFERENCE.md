# Teacher & Class Assignment - Quick Reference

## 🎯 What Changed

**Before:** Teacher was optional, classes were static dropdowns  
**Now:** Teacher is required, classes dynamically filter based on selected teacher

---

## ✨ Key Features

✅ **Teacher is REQUIRED** - Every student must have a teacher  
✅ **Dynamic Class Filtering** - Class dropdown only shows teacher's classes  
✅ **Smart Class Selection** - Class dropdown disabled until teacher picked  
✅ **Pre-loading Classes** - Open manage modal and classes auto-load if student has teacher  
✅ **Full Validation** - Server validates class belongs to selected teacher  

---

## 🚀 For Admins

### Creating a Student

1. Click **"+ Create Student"**
2. Fill Name, Email, LRN, Password
3. **👨‍🏫 Select Teacher** (now required)
4. **📚 Select Class** (appears after teacher selected)
5. Click **"CREATE ACCOUNT"**

### Managing a Student

1. Go to **User Management** tab
2. Find student, click **"Manage"**
3. Change **👨‍🏫 Teacher** if needed
4. Change **📚 Class** if needed (must be teacher's class)
5. Click **"SAVE CHANGES"**

---

## 📊 Data Flow

```
Admin Creates Student
    ↓
Selects Teacher from dropdown
    ↓
System fetches Teacher's Classes
    ↓
Admin selects Class from filtered list
    ↓
Student saved with:
    - teacher_id
    - class_id
    - class_name (for display)
```

---

## 🔗 Relationships

```
Teacher
├── has many Classes
└── has many Students (assigned to them)

Class
├── belongs to Teacher
└── has many Students (in class)

Student
├── belongs to Teacher (required)
└── belongs to Class (required, must be teacher's class)
```

---

## 📋 Database

### New Column
```sql
users.class_id (UUID) → references classes(id)
```

### Migration
```bash
scripts/migrate-student-class-relationship.sql
```

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/teachers` | GET | Get all teachers |
| `/api/admin/classes` | GET | Get classes for teacher |
| `/api/admin/create-student` | POST | Create student (with teacher + class) |
| `/api/admin/users/[id]` | PATCH | Update user (with teacher + class) |

### New Parameters

**create-student:**
- `teacherId` (required) - UUID of teacher
- `classId` (required) - UUID of class

**update user:**
- `teacher_id` (required for students) - UUID of teacher
- `class_id` (required for students) - UUID of class

---

## ✅ Validation

**Must Have:**
- Teacher selected ✓
- Class selected ✓
- Class belongs to teacher ✓

**Error Messages:**
- "Teacher selection is required"
- "Class selection is required"
- "Selected class does not belong to the selected teacher"

---

## 🧪 Quick Test

1. **Create a class** (if not exists)
   - Teacher: "Juan"
   - Class: "Grade 1 - Morning"

2. **Create a student** via Admin Dashboard
   - Select Teacher: "Juan"
   - Select Class: "Grade 1 - Morning"
   - Submit

3. **Verify** in database
   ```sql
   SELECT s.first_name, t.first_name as teacher, c.name as class
   FROM users s
   JOIN users t ON s.teacher_id = t.id
   JOIN classes c ON s.class_id = c.id
   WHERE s.role = 'USER' LIMIT 1;
   ```

---

## 📁 Files Changed

- `scripts/migrate-student-class-relationship.sql` ← **NEW**
- `app/api/admin/classes/route.ts` ← **NEW**
- `app/api/admin/create-student/route.ts` ← Updated
- `app/api/admin/users/[id]/route.ts` ← Updated
- `app/components/AdminDashboard.tsx` ← Updated

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| "No classes available" | Create classes for teacher |
| Class dropdown disabled | Select teacher first |
| "Class doesn't belong to teacher" | Select class created by teacher |
| Empty class list | Teacher has no classes |

---

## 💡 UI Changes

### Before
```
Register Student Modal
├── First Name
├── Last Name
├── Email
├── LRN
├── Password
├── Assign Class (static dropdown) [REMOVED]
└── Assign Teacher (optional) [CHANGED]
```

### After
```
Register Student Modal
├── First Name
├── Last Name
├── Email
├── LRN
├── Password
├── 👨‍🏫 Assign Teacher (REQUIRED) [dynamic list]
└── 📚 Assign Class (REQUIRED) [filtered by teacher]
```

---

## 📝 SQL Queries

**Get student with teacher and class:**
```sql
SELECT s.first_name, t.first_name as teacher, c.name as class
FROM users s
LEFT JOIN users t ON s.teacher_id = t.id
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.id = 'student-uuid';
```

**Get all students for a class:**
```sql
SELECT first_name, last_name, email
FROM users
WHERE class_id = 'class-uuid' AND role = 'USER'
ORDER BY first_name;
```

**Get all classes for teacher:**
```sql
SELECT id, name
FROM classes
WHERE teacher_id = 'teacher-uuid' AND is_archived = FALSE;
```

---

## 🔄 Migration Steps

1. Run SQL migration on database
2. Deploy code changes
3. Test create student workflow
4. Test manage student workflow
5. Done! ✅

---

## 📞 Support

**Error:** Cannot submit form with teacher/class selected  
→ Check browser console for error messages

**Error:** Classes dropdown shows "No classes available"  
→ Create classes for the selected teacher

**Error:** API returns "class not found"  
→ Query database to verify class exists, teacher_id matches

---

