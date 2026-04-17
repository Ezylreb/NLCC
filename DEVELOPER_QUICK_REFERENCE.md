# Developer Quick Reference - API Migration

## How to Migrate Your Component in 5 Minutes

### Step 1: Add Import
```typescript
import { apiClient } from '@/lib/api-client';
```

### Step 2: Replace fetch() Calls

#### Pattern A: Fetch Data (OLD → NEW)

**OLD CODE:**
```typescript
const res = await fetch(`/api/teacher/manage-yunit?bahagiId=${bahagiId}`);
if (!res.ok) throw new Error('Failed to fetch');
const data = await res.json();
setYunits(data.yunits || []);
```

**NEW CODE:**
```typescript
const response = await apiClient.yunit.fetchByBahagi(bahagiId);
if (response.success) {
  setYunits(response.data?.yunits || []);
} else {
  throw new Error(response.error);
}
```

---

#### Pattern B: Create Data (OLD → NEW)

**OLD CODE:**
```typescript
const res = await fetch('/api/teacher/manage-yunit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bahagiId: data.bahagiId,
    title: data.title,
    description: data.description
  })
});
if (!res.ok) throw new Error('Failed to create');
const result = await res.json();
```

**NEW CODE:**
```typescript
const result = await apiClient.yunit.create({
  bahagi_id: data.bahagiId,  // ← Note: snake_case
  title: data.title,
  description: data.description
});
if (!result.success) throw new Error(result.error);
```

---

#### Pattern C: Update Data (OLD → NEW)

**OLD CODE:**
```typescript
const res = await fetch('/api/teacher/update-yunit', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: yunitId,
    title: data.title,
    description: data.description
  })
});
```

**NEW CODE:**
```typescript
const result = await apiClient.yunit.update(yunitId, {
  title: data.title,
  description: data.description
});
```

---

#### Pattern D: Delete Data (OLD → NEW)

**OLD CODE:**
```typescript
const res = await fetch(`/api/teacher/delete-yunit?id=${yunitId}`, {
  method: 'DELETE'
});
```

**NEW CODE:**
```typescript
const result = await apiClient.yunit.delete(yunitId);
```

---

#### Pattern E: Submit Assessment (OLD → NEW)

**OLD CODE:**
```typescript
const res = await fetch('/api/student/assessments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId,
    yunitId,
    bahagiId,
    assessmentId: assessment.id,
    answers,
    totalQuestions
  })
});
```

**NEW CODE:**
```typescript
const result = await apiClient.assessment.submit(Number(assessment.id), {
  student_id: studentId,
  yunit_id: Number(yunitId),
  bahagi_id: Number(bahagiId),
  answers,
  total_questions: totalQuestions
});
```

---

## API Reference

### Bahagi (Module)
```typescript
// Read
apiClient.bahagi.fetchAll(teacherId?)              // GET /api/rest/bahagis
apiClient.bahagi.fetchById(id)                      // GET /api/rest/bahagis/{id}

// Create
apiClient.bahagi.create({ title, description, teacher_id, ... })

// Update
apiClient.bahagi.update(id, { title, description, ... })

// Delete
apiClient.bahagi.delete(id)                         // Permanent delete
apiClient.bahagi.archive(id)                        // Soft delete
apiClient.bahagi.restore(id)                        // Restore from archive
apiClient.bahagi.publish(id)                        // Make public
```

### Yunit (Lesson)
```typescript
// Read
apiClient.yunit.fetchByBahagi(bahagiId)            // GET /api/rest/yunits?bahagi_id=X
apiClient.yunit.fetchById(id)                       // GET /api/rest/yunits/{id}

// Create
apiClient.yunit.create({ bahagi_id, title, description, ... })

// Update
apiClient.yunit.update(id, { title, description, ... })

// Delete
apiClient.yunit.delete(id)                          // Permanent delete
apiClient.yunit.archive(id)                         // Soft delete
apiClient.yunit.restore(id)                         // Restore from archive
```

### Assessment
```typescript
// Read
apiClient.assessment.fetch({ yunit_id?, bahagi_id? })  // GET with filters
apiClient.assessment.fetchById(id)                       // GET /api/rest/assessments/{id}
apiClient.assessment.getAttempts(id, studentId?)        // GET attempts

// Create
apiClient.assessment.create({ yunit_id, bahagi_id, title, questions, ... })

// Update
apiClient.assessment.update(id, { title, questions, ... })

// Delete
apiClient.assessment.delete(id)

// Submit
apiClient.assessment.submit(id, {
  student_id,
  answers,
  yunit_id?,
  bahagi_id?,
  total_questions?
})
```

### Analytics
```typescript
apiClient.analytics.getStudentPerformance(studentId)
apiClient.analytics.getClassStats(classId)
apiClient.analytics.getAssignmentAnalytics(assignmentId)
apiClient.analytics.getActivityStats()
```

### Upload
```typescript
apiClient.upload.uploadFile(file, type?)
```

---

## Parameter Naming Convention

**All API parameters use snake_case:**

| Old | New |
|-----|-----|
| `userId` | `user_id` |
| `studentId` | `student_id` |
| `teacherId` | `teacher_id` |
| `bahagiId` | `bahagi_id` |
| `yunitId` | `yunit_id` |
| `assessmentId` | `assessment_id` |
| `classId` | `class_id` |
| `isArchived` | `is_archived` |
| `isPublished` | `is_published` |
| `mediaUrl` | `media_url` |
| `imageUrl` | `image_url` |

---

## Response Format

All API responses follow this format:

```typescript
interface APIResponse<T = any> {
  success: boolean;          // true/false
  data?: T;                  // Response data (if success)
  error?: string;            // Error message (if failed)
  message?: string;          // Optional message
}
```

**Success Example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Introduction",
    "description": "Learn basics"
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "error": "Bahagi not found"
}
```

---

## Error Handling

### Good Practice ✅
```typescript
try {
  const result = await apiClient.yunit.create({ ... });
  if (result.success) {
    alert('✅ Created successfully');
  } else {
    alert(`❌ ${result.error}`);
  }
} catch (err: any) {
  alert(`❌ ${err.message}`);
}
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module" | Missing import | Add `import { apiClient } from '@/lib/api-client'` |
| "BAD REQUEST" | Wrong parameter name | Use snake_case for params |
| "NOT FOUND" | Invalid ID | Verify ID exists in database |
| "UNAUTHORIZED" | Not authenticated | Check auth token |

---

## Checklists for Migration

### For Each Component:

- [ ] Add import of `apiClient`
- [ ] Find all old fetch() calls
- [ ] Replace with apiClient methods
- [ ] Update parameter names (camelCase → snake_case)
- [ ] Update response handling (`.json()` → `.data?.field`)
- [ ] Test in browser
- [ ] Verify no console errors
- [ ] Check Network tab for /api/rest calls

### Before Committing:

- [ ] All old `/api/teacher/*` calls removed
- [ ] All old `/api/student/*` calls removed  
- [ ] All old `/api/admin/*` calls removed
- [ ] No `fetch()` calls directly (use apiClient)
- [ ] Component tested locally
- [ ] No TypeScript errors

---

## Migration Statistics

**As of today:**
- ✅ 5 critical components migrated (Core student/teacher flows)
- ⏳ 72 components remaining
- 📊 Estimated completion: 2-3 hours (10 minutes per component)

**To migrate your component:**
1. Search for `fetch(` in your file
2. Count how many API calls (usually 1-5)
3. Replace with apiClient methods (use patterns above)
4. Update parameter names
5. Test
6. Done! ✅

---

## Support

**Common Questions:**

**Q: Do I need to update the `/api/rest` endpoints?**  
A: No! The endpoints are tested and ready. Just use the apiClient wrapper.

**Q: Can I mix old fetch() and new apiClient?**  
A: No - for consistency, migrate entire component to apiClient.

**Q: What if my component has multiple API calls?**  
A: Replace each one using the examples above. Chain with `.then()` or async/await.

**Q: How do I know if my component is fully migrated?**  
A: Search for "fetch(" in file - should return 0 results (excluding imports).

