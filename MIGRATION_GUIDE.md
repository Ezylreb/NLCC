# Quick Migration Guide - Old to New API

## 🔄 **Quick Reference: Endpoint Migration**

### **Bahagi Management**

| Operation | Old Endpoint | New Endpoint | Notes |
|-----------|--------------|--------------|-------|
| Create | `POST /api/teacher/create-bahagi` | `POST /api/rest/bahagis` | Body unchanged |
| List | `GET /api/teacher/bahagi?teacherId=X` | `GET /api/rest/bahagis?teacherId=X` | Query params unchanged |
| Get | N/A | `GET /api/rest/bahagis/[id]` | **NEW** |
| Update | `PATCH /api/teacher/update-bahagi` | `PATCH /api/rest/bahagis?id=X` | Use query param for ID |
| Archive | `PUT /api/teacher/archive-bahagi` | `DELETE /api/rest/bahagis?id=X` | No permanent param = archive |
| Delete | `DELETE /api/teacher/delete-bahagi` | `DELETE /api/rest/bahagis?id=X&permanent=true` | Add permanent param |

### **Yunit Management**

| Operation | Old Endpoint | New Endpoint | Notes |
|-----------|--------------|--------------|-------|
| Create | `POST /api/teacher/create-yunit` OR `/api/teacher/manage-yunit` | `POST /api/rest/yunits` | Unified |
| List | `GET /api/teacher/manage-yunit?bahagiId=X` | `GET /api/rest/yunits?bahagiId=X` | Same query params |
| Get | N/A | `GET /api/rest/yunits/[id]` | **NEW** - includes assessments |
| Update | `PUT /api/teacher/update-yunit` | `PATCH /api/rest/yunits?id=X` | Use query param for ID |
| Archive | `PUT /api/teacher/archive-yunit` | `DELETE /api/rest/yunits?id=X` | No permanent = archive |

### **Assessment Management**

| Operation | Old Endpoint | New Endpoint | Notes |
|-----------|--------------|--------------|-------|
| Create | `POST /api/teacher/create-assessment` OR `/api/teacher/manage-assessment` | `POST /api/rest/assessments` | Unified |
| List | `GET /api/teacher/yunit-assessments?yunitId=X` | `GET /api/rest/assessments?yunitId=X` | Same filter |
| Get | N/A | `GET /api/rest/assessments/[id]` | **NEW** |
| Update | `PUT /api/teacher/update-assessment` | `PATCH /api/rest/assessments?id=X` | Use query param |
| Archive | `PUT /api/teacher/archive-assessment` | `DELETE /api/rest/assessments?id=X` | No permanent = archive |
| Publish | `PUT /api/teacher/publish-assessment` | `PATCH /api/rest/assessments?id=X` with `is_published: true` | Integrated |
| Delete | `DELETE /api/teacher/delete-assessment` | `DELETE /api/rest/assessments?id=X&permanent=true` | Add permanent param |

### **Answer Submission**

| Operation | Old Endpoint | New Endpoint | Changes |
|-----------|--------------|--------------|---------|
| Validate & Save | `POST /api/teacher/validate-answer` + `POST /api/teacher/save-yunit-answer` | `POST /api/rest/assessments/[id]/submit` | **MERGED** - One endpoint does both |
| Get Previous | `GET /api/teacher/get-yunit-answer` | `GET /api/rest/assessments/[id]/attempts` | Same data |

### **Analytics & rewards**

| Operation | Old Endpoint | New Endpoint | Notes |
|-----------|--------------|--------------|-------|
| Student Perf | `GET /api/teacher/analytics/student-performance` | `GET /api/rest/analytics?type=student&studentId=X` | Query param driven |
| Class Stats | `GET /api/teacher/analytics/class-stats` | `GET /api/rest/analytics?type=class&classId=X` | Same data |
| Assignment Stats | `GET /api/teacher/analytics/assignment-analytics` | `GET /api/rest/analytics?type=assessment&assessmentId=X` | New format |
| Leaderboard | N/A | `GET /api/rest/analytics?type=leaderboard&limit=10` | **NEW** |
| Student Rewards | `GET /api/student/rewards?studentId=X` | `GET /api/rest/analytics?type=student&studentId=X` | Moved to unified analytics |

---

## 🔧 **Code Examples**

### **Frontend - Create Bahagi**

**Before**:
```typescript
const res = await fetch('/api/teacher/create-bahagi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Math 101',
    yunit: 'Basics',
    description: 'Learn math basics',
    teacherId: userId,
    className: 'Grade 1'
  })
});
const { bahagi } = await res.json();
```

**After**:
```typescript
const res = await fetch('/api/rest/bahagis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Math 101',
    yunit: 'Basics',
    description: 'Learn math basics',
    teacher_id: userId,  // Changed: teacher_id instead of teacherId
    class_name: 'Grade 1'  // Changed: class_name instead of className
  })
});

if (!res.ok) throw new Error(res.statusText);

const { success, data: bahagi } = await res.json();
// bahagi has same structure as before
```

### **Frontend - Submit Assessment**

**Before** (Validation + Save were separate):
```typescript
// Step 1: Validate
const validRes = await fetch('/api/teacher/validate-answer-enhanced', {
  method: 'POST',
  body: JSON.stringify({
    assessment: assessmentObj,
    studentAnswer: userAnswer,
    assessmentType: 'multiple-choice'
  })
});
const { isCorrect, pointsEarned, feedback } = await validRes.json();

// Step 2: Save (separate API call)
const saveRes = await fetch('/api/teacher/save-yunit-answer', {
  method: 'POST',
  body: JSON.stringify({
    yunitId, assessmentId, studentId,
    studentAnswer: userAnswer,
    isCorrect, pointsEarned, assessmentType: 'multiple-choice',
    attemptNumber: 1
  })
});
const { success } = await saveRes.json();
```

**After** (Combined into one endpoint):
```typescript
// One call does both validation AND saving
const res = await fetch(`/api/rest/assessments/${assessmentId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    yunitId,
    studentId,
    studentAnswer: userAnswer,
    attemptNumber: 1
  })
});

if (!res.ok) throw new Error(res.statusText);

const { success, data } = await res.json();
const { 
  answerId, 
  isCorrect, 
  pointsEarned, 
  feedback,       // Auto-generated
  correctAnswer,  // Auto-generated
  partialCredit   // Auto-calculated
} = data;
```

### **Frontend - Get Analytics**

**Before** (Multiple endpoints):
```typescript
// Student performance
const perfRes = await fetch('/api/teacher/analytics/student-performance?studentId=123');
const perf = await perfRes.json();

// Grades
const gradesRes = await fetch('/api/teacher/gradebook?studentId=123');
const grades = await gradesRes.json();

// Leaderboard (didn't exist)
```

**After** (Unified):
```typescript
// All analytics through one endpoint with query param
const perfRes = await fetch('/api/rest/analytics?type=student&studentId=123');
const perf = await perfRes.json();

// Object will have same data as before

// Get leaderboard (NEW!)
const leaderRes = await fetch('/api/rest/analytics?type=leaderboard&limit=10');
const leaderboard = await leaderRes.json();
```

### **Backend - Using Services Directly**

**New recommended pattern** (used internally):

```typescript
import { 
  BahagiService, 
  AssessmentService, 
  GamificationService 
} from '@/lib/services';
import { eventBus } from '@/lib/events';

// Create bahagi
const bahagi = await BahagiService.create({
  title: 'Math',
  teacher_id: userId,
  yunit: 'Basics'
});

// Get assessment
const assessment = await AssessmentService.getById(assessmentId);

// Validate answer (instantly)
const validation = await AssessmentService.validateAnswer(assessment, studentAnswer);

// Save answer
const saved = await AssessmentService.saveAnswer(
  yunitId, assessmentId, studentId, assessment, studentAnswer, 1
);

// Emit event (triggers async reward processing)
await eventBus.emit({
  type: EventType.ASSESSMENT_SUBMITTED,
  timestamp: new Date(),
  userId: studentId,
  assessmentId,
  studentId,
  yunitId,
  isCorrect: validation.isCorrect,
  pointsEarned: validation.pointsEarned,
  attemptNumber: 1,
  assessmentType: assessment.assessment_type
});

// API returns immediately (no wait for reward processing)
return { success: true, validation };
```

---

## 📝 **Response Format Changes**

### **Success Response** (All new endpoints)

```typescript
{
  success: true,
  data: {
    // Entity object or array
  }
}
```

### **Error Response** (All new endpoints)

```typescript
{
  error: "Human readable error",
  detail?: "Optional error detail",  // Only in development
  errors?: ["Validation error 1", "Validation error 2"]  // For validation
}
```

### **Status Codes**
- `200 OK` - GET, PATCH successful
- `201 Created` - POST successful
- `400 Bad Request` - Validation failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🚨 **Breaking Changes**

### **Parameter Naming**
- `teacherId` → `teacher_id`
- `bahagiId` → `bahagi_id`
- `yunitId` → `yunit_id`
- `studentId` → `student_id`
- `className` → `class_name`
- `mediaUrl` → `media_url`

### **ID Parameters**
**Old**: IDs sometimes in URL path
```
PUT /api/teacher/update-bahagi (send{id: '123'} in body)
```

**New**: IDs in query params
```
PATCH /api/rest/bahagis?id=123
```

### **Soft vs Hard Delete**
**Old**: Different endpoints
```
PUT /api/teacher/archive-bahagi  (soft delete)
DELETE /api/teacher/delete-bahagi  (hard delete)
```

**New**: Same endpoint with query param
```
DELETE /api/rest/bahagis?id=123           (soft delete/archive)
DELETE /api/rest/bahagis?id=123&permanent=true  (hard delete)
```

### **Answer Submission Combined**
**Old**: Separate validate + save
```
POST /api/teacher/validate-answer (validation only)
POST /api/teacher/save-yunit-answer (save only)
```

**New**: Single endpoint
```
POST /api/rest/assessments/[id]/submit (validates & saves)
```

---

## ✅ **Migration Checklist**

- [ ] Update all `fetch()` calls in React components
- [ ] Update parameter naming (camelCase → snake_case)
- [ ] Replace validate + save with single submit call
- [ ] Update error handling (now returns `{ error, detail }`)
- [ ] Replace analytics calls with unified endpoint
- [ ] Test all API calls in browser DevTools Network tab
- [ ] Verify data structures match (usually identical)
- [ ] Check leaderboard now available
- [ ] Test file uploads to `/api/rest/upload`

---

**All changes are backward compatible if old endpoints remain in place** 👍
