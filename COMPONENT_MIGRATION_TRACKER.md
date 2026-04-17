# Component Migration Tracker

## Status: IN PROGRESS

### Priority 1: Critical Student Components (Assessment Flow)

- [ ] **AssessmentScreen.tsx** - Fetch & Submit assessments
  - **Old**: `GET /api/student/assessments`, `POST /api/student/assessments`
  - **New**: `GET /api/rest/assessments`, `POST /api/rest/assessments/[id]/submit`
  - **Impact**: Student cannot complete assessments
  - **Lines**: 55 (GET), 161 (POST)

- [ ] **BahagiView.tsx** - Fetch bahagis for student
  - **Old**: `GET /api/student/bahagis?studentId=...&classId=...`
  - **New**: `GET /api/rest/bahagis?student_id=...&class_id=...`
  - **Lines**: 39

- [ ] **YunitView.tsx** - Fetch yunits for student
  - **Old**: `GET /api/student/yunits?studentId=...&bahagiId=...`
  - **New**: `GET /api/rest/yunits?bahagi_id=...`
  - **Lines**: 39

### Priority 2: Critical Teacher Components (CRUD Operations)

- [ ] **ClassDetailPage.tsx** - Teacher manages bahagis, yunits, assessments
  - **Old Endpoints:**
    - `GET /api/teacher/manage-yunit?bahagiId=...` (Line 77)
    - `GET /api/teacher/manage-assessment?bahagiId=...` (Line 96)
    - `POST /api/teacher/manage-yunit` (Line 136)
    - `PATCH /api/teacher/update-bahagi` (Line 223)
    - `PATCH /api/teacher/update-yunit` (Line 262)
    - `POST /api/teacher/manage-assessment` (Line 294)
    - `PATCH /api/teacher/archive-bahagi` (Line 328)
    - `DELETE /api/teacher/delete-bahagi` (Line 357)
    - `DELETE /api/teacher/delete-yunit` (Line 533)
    - `DELETE /api/teacher/delete-assessment` (Line 595)
  - **New Endpoints:** All map to `/api/rest/[bahagis|yunits|assessments]`
  - **Impact**: Teacher cannot manage content

- [ ] **EditBahagiForm.tsx** - Create/Edit bahagi
  - **Old**: Media upload to `/api/upload-media`
  - **New**: Upload to `/api/rest/upload`
  - **Lines**: 81

### Priority 3: Other Components

- [ ] **AvatarCustomization.tsx** - Avatar operations
- [ ] **AdminDashboard.tsx** - Admin functions
- [ ] **Dashboard.tsx** - User stats
- [ ] **Dashboard.tsx** - User stats
- [ ] **SettingsPage.tsx** - User preferences
- [ ] And 20+ others (see below)

---

## Complete Component List & Migration Status

### Pages & Layouts
- [ ] app/page.tsx - `/api/admin/settings` → `/api/rest/settings`
- [ ] app/layout.tsx - `/api/user?email=...` → `/api/rest/users?email=...`

### Student Components
- [ ] StudentComponents/AssessmentScreen.tsx - ✅ PRIORITY
- [ ] StudentComponents/BahagiView.tsx - ✅ PRIORITY
- [ ] StudentComponents/YunitView.tsx - ✅ PRIORITY
- [ ] StudentComponents/ClassView.tsx - `GET /api/student/enrolled-classes`
- [ ] StudentComponents/MagAralPage.tsx - `GET /api/student/teacher-info`
- [ ] StudentComponents/TeacherLessonsView.tsx - `GET /api/student/teacher-lessons`
- [ ] StudentComponents/StudentLessonsPage.tsx - `GET /api/student/get-lessons`

### Teacher Components
- [ ] TeacherComponents/ClassDetailPage.tsx - ✅ PRIORITY
- [ ] TeacherComponents/EditBahagiForm.tsx - ✅ PRIORITY
- [ ] TeacherComponents/EditAssessmentV2Form.tsx - `GET /api/teacher/edit-assessment`

### Other Components
- [ ] AvatarCustomization.tsx - `/api/student/avatar`
- [ ] AvatarShop.tsx - `/api/student/avatar-items`
- [ ] AvatarDisplay.tsx - `/api/student/avatar`
- [ ] AssignmentsPage.tsx - `/api/teacher/assignments`, `/api/upload`
- [ ] Dashboard.tsx - `/api/user/stats`
- [ ] LessonScreen.tsx - `/api/lessons/[id]`, `/api/user/lesson-progress`
- [ ] AuthPage.tsx - `/api/auth`
- [ ] SettingsPage.tsx - `/api/user`
- [ ] AdminDashboard.tsx - `/api/admin/*` endpoints

---

## API Parameter Mapping

### Old → New Parameter Names

| Old | New | Examples |
|-----|-----|----------|
| `userId` | `user_id` | `/api/rest/users?user_id=123` |
| `studentId` | `student_id` | `/api/rest/assessments?student_id=123` |
| `teacherId` | `teacher_id` | `/api/rest/bahagis?teacher_id=123` |
| `bahagiId` | `bahagi_id` | `/api/rest/yunits?bahagi_id=123` |
| `yunitId` | `yunit_id` | `/api/rest/assessments?yunit_id=123` |
| `classId` | `class_id` | `/api/rest/bahagis?class_id=123` |
| `assessmentId` | `assessment_id` | `/api/rest/assessments/123` |

---

## Migration Patterns

### Pattern 1: Fetch List
```tsx
// OLD
const res = await fetch(`/api/teacher/manage-yunit?bahagiId=${bahagiId}`);
const data = await res.json();

// NEW
import { apiClient } from '@/lib/api-client';
const data = await apiClient.yunit.fetchByBahagi(bahagiId);
```

### Pattern 2: Create
```tsx
// OLD
const res = await fetch('/api/teacher/manage-yunit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bahagiId, title, description, discussion, mediaUrl })
});

// NEW
const data = await apiClient.yunit.create({
  bahagi_id: bahagiId,
  title,
  description,
  discussion,
  media_url: mediaUrl
});
```

### Pattern 3: Update
```tsx
// OLD
const res = await fetch('/api/teacher/update-bahagi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: bahagiId, title, description })
});

// NEW
const data = await apiClient.bahagi.update(bahagiId, {
  title,
  description
});
```

### Pattern 4: Delete
```tsx
// OLD
const res = await fetch(`/api/teacher/delete-bahagi?id=${bahagiId}`, {
  method: 'DELETE'
});

// NEW
const data = await apiClient.bahagi.delete(bahagiId);
```

### Pattern 5: Submit Assessment
```tsx
// OLD
const res = await fetch('/api/student/assessments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId, yunitId, bahagiId, assessmentId, answers, totalQuestions
  })
});

// NEW
const data = await apiClient.assessment.submit(assessmentId, {
  student_id: studentId,
  answers,
  yunit_id: yunitId,
  bahagi_id: bahagiId,
  total_questions: totalQuestions
});
```

---

## Migration Steps

1. ✅ Create `/lib/api-client.ts` with all endpoint methods
2. ⏳ Update Priority 1 student components (AssessmentScreen, BahagiView, YunitView)
3. ⏳ Update Priority 2 teacher components (ClassDetailPage, EditBahagiForm)
4. ⏳ Update remaining components systematically
5. ⏳ Run comprehensive API endpoint tests
6. ⏳ Deploy with feature flag or parallel endpoints

---

## Testing Checklist

- [ ] Student can fetch and view bahagis
- [ ] Student can fetch and view yunits
- [ ] Student can fetch assessment
- [ ] Student can submit assessment
- [ ] Teacher can create bahagi
- [ ] Teacher can create yunit
- [ ] Teacher can create assessment
- [ ] Teacher can update bahagi
- [ ] Teacher can update yunit
- [ ] Teacher can delete bahagi
- [ ] Teacher can delete yunit
- [ ] Teacher can delete assessment

