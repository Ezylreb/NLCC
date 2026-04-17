# API Migration Mapping - Phase 5 Continuation

## Quick Reference: Old → New Endpoint Mapping

### Upload Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `POST /api/upload` | `apiClient.upload.uploadFile()` | UploadAPI | uploadFile(file, type?) |

### Teacher Dashboard Stats
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/teacher/stats?teacherId=X` | `apiClient.teacherStats.getStats()` | TeacherStatsService | getStats(teacherId) |
| `GET /api/teacher/assignment-stats?assignmentId=X` | `apiClient.teacherStats.getAssignmentStats()` | TeacherStatsService | getAssignmentStats(assignmentId) |
| `GET /api/teacher/student-detail?studentId=X` | `apiClient.student.getDetails()` | StudentService | getDetails(studentId) |

### Lesson Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/lessons/{id}` | `apiClient.lesson.fetchById()` | LessonService | fetchById(id) |
| `POST /api/teacher/update-lesson` | `apiClient.lesson.update()` | LessonService | update(id, data) |
| `POST /api/teacher/create-lesson` | `apiClient.lesson.addItem()` | LessonService | addItem(id, data) |
| `POST /api/teacher/add-lesson-item` | `apiClient.lesson.addItem()` | LessonService | addItem(id, data) |
| `DELETE /api/teacher/delete-lesson?id=X` | `apiClient.lesson.delete()` | LessonService | delete(id) |

### Bahagi (Module) Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/teacher/bahagi` | `apiClient.bahagi.fetchAll()` | BahagiAPI | fetchAll(teacherId?) |
| `POST /api/teacher/bahagi` | `apiClient.bahagi.create()` | BahagiAPI | create(data) |
| `DELETE /api/teacher/bahagi/{id}` | `apiClient.bahagi.delete()` | BahagiAPI | delete(id) |
| `PATCH /api/teacher/bahagi/{id}` | `apiClient.bahagi.update()` | BahagiAPI | update(id, data) |

### Assignment Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/teacher/assignments` | `apiClient.resource.fetchAssignments()` | ResourceService | fetchAssignments() |
| `POST /api/teacher/create-assignment` | `apiClient.assessment.create()` | AssessmentAPI | create(data) |
| `DELETE /api/teacher/delete-assignment?id=X` | `apiClient.assessment.delete()` | AssessmentAPI | delete(id) |

### Lesson Links Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/teacher/lesson-links` | `apiClient.resource.fetchLinks()` | ResourceService | fetchLinks() |
| `POST /api/teacher/lesson-links` | `apiClient.resource.createLink()` | ResourceService | createLink(data) |
| `DELETE /api/teacher/lesson-links?id=X` | `apiClient.resource.deleteLink()` | ResourceService | deleteLink(id) |

### Class Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `POST /api/teacher/create-class` | `apiClient.class.create()` | ClassService | create(data) |
| `GET /api/teacher/classes` | `apiClient.class.fetchByTeacher()` | ClassService | fetchByTeacher(teacherId) |
| `GET /api/teacher/class-students` | `apiClient.class.getStudents()` | ClassService | getStudents(classId) |

### Student Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/student/enrolled-classes?studentId=X` | `apiClient.student.getEnrolledClasses()` | StudentService | getEnrolledClasses(studentId) |
| `GET /api/student/teacher-info?studentId=X` | `apiClient.student.getDetails()` | StudentService | getDetails(studentId) |

### Admin Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/admin/stats` | `apiClient.admin.getStats()` | AdminAPI | getStats() |
| `GET /api/admin/settings` | `apiClient.admin.getSettings()` | AdminAPI | getSettings() |
| `GET /api/admin/activities?page=X&limit=Y` | `apiClient.admin.getActivities()` | AdminAPI | getActivities(page, limit) |
| `GET /api/admin/teachers` | `apiClient.admin.getTeachers()` | AdminAPI | getTeachers() |
| `POST /api/admin/create-student` | `apiClient.admin.createStudent()` | AdminAPI | createStudent(data) |
| `POST /api/admin/create-teacher` | `apiClient.admin.createTeacher()` | AdminAPI | createTeacher(data) |
| `PATCH /api/admin/users/{id}` | `apiClient.admin.updateUser()` | AdminAPI | updateUser(id, data) |
| `DELETE /api/admin/users/{id}` | `apiClient.admin.deleteUser()` | AdminAPI | deleteUser(id) |

### User Profile Endpoints
| Old | New | Service | Method |
|-----|-----|---------|--------|
| `GET /api/user/stats` | `apiClient.user.getStats()` | UserAPI | getStats(userId) |
| `PATCH /api/user` | `apiClient.user.updateProfile()` | UserAPI | updateProfile(userId, data) |
| `POST /api/user/lesson-progress` | `apiClient.user.updateLessonProgress()` | UserAPI | updateLessonProgress(userId, lessonId, data) |

---

## Component Migration Order (Highest Impact First)

### Tier 1: Maximum Impact (20+ API calls each)
- [ ] **TeacherDashboard.tsx** (20 calls) → 1-2 hours
- [ ] **TeacherDashboardV2.tsx** (12 calls) → 1 hour

### Tier 2: High Impact (10+ API calls)
- [ ] **AdminDashboard.tsx** (10 calls) → 30 min
- [ ] **ClassDetailPage.tsx** (5+ calls) → 30 min

### Tier 3: Medium Impact (5+ API calls)
- [ ] **AssignmentsPage.tsx** (4 calls)
- [ ] **AssessmentAnswerSubmission.tsx** (3 calls)
- [ ] **TeacherBahagi.tsx** (2 calls)
- [ ] **StudentGradebook.tsx** (2 calls)
- [ ] Various other components with 1-2 calls each

### Tier 4: Low Impact (1-2 API calls)
- All remaining components

---

## Migration Status Tracker

### Tier 1: Tier 1 Components
- [ ] TeacherDashboard.tsx
- [ ] TeacherDashboardV2.tsx

### Tier 2: High Impact
- [ ] AdminDashboard.tsx
- [ ] ClassDetailPage.tsx (partially done in Phase 5)
- [ ] StudentComponents/ClassView.tsx

### Tier 3: Medium Impact  
- [ ] AssignmentsPage.tsx
- [ ] TeacherComponents/AssessmentAnswerSubmission.tsx
- [ ] TeacherBahagi.tsx
- [ ] TeacherComponents/StudentGradebook.tsx
- [ ] TeacherComponents/StudentYunitView.tsx
- [ ] TeacherComponents/ManageClassStudents.tsx
- [ ] TeacherComponents/BahagiIconSelector.tsx

### Tier 4: Low Impact
- [ ] LessonScreen.tsx
- [ ] StudentComponents/MagAralPage.tsx
- [ ] StudentComponents/TeacherLessonsView.tsx
- [ ] StudentComponents/StudentLessonsPage.tsx
- [ ] AuthPage.tsx
- [ ] SettingsPage.tsx (partially migrated)
- [ ] AvatarCustomization.tsx (shows as still using fetch)
- [ ] Others

---

## Code Patterns for Migration

### Pattern 1: Upload File
**BEFORE:**
```typescript
const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});
const data = await res.json();
if (res.ok) { /* use data */ }
```

**AFTER:**
```typescript
try {
    const { data, success, error } = await apiClient.upload.uploadFile(file, type);
    if (success) { /* use data */ }
} catch (err) { /* handle error */ }
```

### Pattern 2: Get and Display Data
**BEFORE:**
```typescript
const res = await fetch(`/api/teacher/stats?teacherId=${user.id}`);
const data = await res.json();
if (res.ok) { setStats(data); }
```

**AFTER:**
```typescript
try {
    const { data, success } = await apiClient.teacherStats.getStats(user.id);
    if (success) { setStats(data); }
} catch (err) { /* handle error */ }
```

### Pattern 3: Create Operation with Error
**BEFORE:**
```typescript
const res = await fetch('/api/teacher/bahagi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
if (res.ok) { /* success */ } else { alert('Failed'); }
```

**AFTER:**
```typescript
try {
    const { success, error } = await apiClient.bahagi.create(data);
    if (success) { /* success */ } else { alert(error); }
} catch (err) { alert('Error: ' + err.message); }
```

### Pattern 4: Delete Operation
**BEFORE:**
```typescript
const res = await fetch(`/api/teacher/bahagi/${bahagiId}`, { 
    method: 'DELETE' 
});
const data = await res.json();
if (res.ok) { /* remove from list */ }
```

**AFTER:**
```typescript
try {
    const { success } = await apiClient.bahagi.delete(bahagiId);
    if (success) { /* remove from list */ }
} catch (err) { /* show error */ }
```

---

## Known Edge Cases

### Case 1: Query Parameters
Some old endpoints use query params differently. Map them carefully:
- `?id=X` becomes method parameter: `delete(X)`
- `?teacherId=X` becomes method parameter: `getStats(teacherId)`
- `?page=X&limit=Y` becomes method parameters: `getActivities(page, limit)`

### Case 2: Form Data Uploads
Upload endpoints use FormData:
- Map directly to `apiClient.upload.uploadFile(file, type)`
- Don't try to use post() method for this

### Case 3: Mixed Response Formats
Some endpoints might return different formats:
- Standardize to expect: `{ success: boolean, data?: any, error?: string }`
- Add error handling for backward compatibility

---

## Next Steps

1. **This Phase:** Migrate Tier 1 components (TeacherDashboard + TeacherDashboardV2)
2. **Phase 5B:** Migrate Tier 2 components (AdminDashboard + others)
3. **Phase 5C:** Migrate Tier 3 components (medium impact)
4. **Phase 5D:** Migrate Tier 4 components (low impact + cleanup)
5. **Final:** Run test suite and deploy

**Total Estimated Time:** 4-5 hours for all 77 API calls
