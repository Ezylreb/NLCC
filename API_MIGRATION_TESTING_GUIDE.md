# API Migration Testing Guide

## Status: TESTING PHASE READY

### Phase 5 Migration Completion ✅

**Components Successfully Migrated:**
- ✅ [lib/api-client.ts](lib/api-client.ts) - Complete API wrapper created
- ✅ [app/components/StudentComponents/AssessmentScreen.tsx](app/components/StudentComponents/AssessmentScreen.tsx) - Student assessment submission
- ✅ [app/components/StudentComponents/BahagiView.tsx](app/components/StudentComponents/BahagiView.tsx) - Student bahagi listing  
- ✅ [app/components/StudentComponents/YunitView.tsx](app/components/StudentComponents/YunitView.tsx) - Student yunit listing
- ✅ [app/components/TeacherComponents/ClassDetailPage.tsx](app/components/TeacherComponents/ClassDetailPage.tsx) - Teacher CRUD operations

**Remaining Components to Migrate:**
See [COMPONENT_MIGRATION_TRACKER.md](COMPONENT_MIGRATION_TRACKER.md) for full list

---

## ✅ QUICK TEST CHECKLIST

### Student Flow Testing

**1. Can Student View Bahagis?**
- [ ] Navigate to student dashboard
- [ ] Go to class and view bahagis list
- ✅ Uses: `apiClient.bahagi.fetchAll()`
- Expected: List of phases displayed

**2. Can Student View Yunits?**
- [ ] Select a bahagi
- [ ] View list of units (yunits)
- ✅ Uses: `apiClient.yunit.fetchByBahagi(bahagiId)`
- Expected: Lessons appear with content

**3. Can Student Take Assessment?**
- [ ] Click on a yunit with assessment
- [ ] Assessment loads with questions
- ✅ Uses: `apiClient.assessment.fetch({yunit_id})`
- Expected: Questions appear, can select answers

**4. Can Student Submit Assessment?**
- [ ] Select all answers
- [ ] Click Submit
- ✅ Uses: `apiClient.assessment.submit(assessmentId, data)`
- Expected: Success message, results shown

---

### Teacher Flow Testing

**1. Can Teacher Create Yunit?**
- [ ] Go to a bahagi
- [ ] Click "Create Yunit"
- [ ] Fill form and save
- ✅ Uses: `apiClient.yunit.create(data)`
- Expected: Yunit appears in list

**2. Can Teacher Create Assessment?**
- [ ] Go to a bahagi
- [ ] Click "Create Assessment"
- [ ] Add questions and save
- ✅ Uses: `apiClient.assessment.create(data)`
- Expected: Assessment appears in list

**3. Can Teacher Update Yunit?**
- [ ] Click edit on yunit
- [ ] Modify title/description
- [ ] Save
- ✅ Uses: `apiClient.yunit.update(id, data)`
- Expected: Changes reflected immediately

**4. Can Teacher Delete Yunit?**
- [ ] Click delete on yunit
- [ ] Confirm
- ✅ Uses: `apiClient.yunit.delete(id)`
- Expected: Yunit removed from list

**5. Can Teacher Delete Assessment?**
- [ ] Click delete on assessment
- [ ] Confirm
- ✅ Uses: `apiClient.assessment.delete(id)`
- Expected: Assessment removed from list

---

## 🧪 AUTOMATED TEST TEMPLATE

Create `tests/api-client.test.ts`:

```typescript
import { apiClient } from '@/lib/api-client';

describe('API Client - Bahagi Operations', () => {
  it('should fetch all bahagis', async () => {
    const response = await apiClient.bahagi.fetchAll();
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });

  it('should fetch bahagi by ID', async () => {
    const response = await apiClient.bahagi.fetchById(1);
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });

  it('should create new bahagi', async () => {
    const response = await apiClient.bahagi.create({
      title: 'Test Bahagi',
      description: 'Test Description',
      teacher_id: 'test-teacher'
    });
    expect(response.success).toBe(true);
    expect(response.data?.id).toBeDefined();
  });

  it('should update bahagi', async () => {
    const response = await apiClient.bahagi.update(1, {
      title: 'Updated Title'
    });
    expect(response.success).toBe(true);
  });

  it('should archive bahagi', async () => {
    const response = await apiClient.bahagi.archive(1);
    expect(response.success).toBe(true);
  });

  it('should delete bahagi', async () => {
    const response = await apiClient.bahagi.delete(1);
    expect(response.success).toBe(true);
  });
});

describe('API Client - Yunit Operations', () => {
  it('should fetch yunits by bahagi', async () => {
    const response = await apiClient.yunit.fetchByBahagi(1);
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data?.yunits)).toBe(true);
  });

  it('should create new yunit', async () => {
    const response = await apiClient.yunit.create({
      bahagi_id: 1,
      title: 'Test Yunit',
      description: 'Test Description'
    });
    expect(response.success).toBe(true);
  });

  it('should update yunit', async () => {
    const response = await apiClient.yunit.update(1, {
      title: 'Updated Yunit'
    });
    expect(response.success).toBe(true);
  });

  it('should delete yunit', async () => {
    const response = await apiClient.yunit.delete(1);
    expect(response.success).toBe(true);
  });
});

describe('API Client - Assessment Operations', () => {
  it('should fetch assessments', async () => {
    const response = await apiClient.assessment.fetch({
      bahagi_id: 1
    });
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data?.assessments)).toBe(true);
  });

  it('should submit assessment', async () => {
    const response = await apiClient.assessment.submit(1, {
      student_id: 'test-student',
      answers: [0, 1, 2],
      total_questions: 3
    });
    expect(response.success).toBe(true);
  });

  it('should get assessment attempts', async () => {
    const response = await apiClient.assessment.getAttempts(1, 'test-student');
    expect(response.success).toBe(true);
  });
});

describe('API Client - Analytics Operations', () => {
  it('should get student performance', async () => {
    const response = await apiClient.analytics.getStudentPerformance('test-student');
    expect(response.success).toBe(true);
  });

  it('should get class statistics', async () => {
    const response = await apiClient.analytics.getClassStats('test-class');
    expect(response.success).toBe(true);
  });

  it('should get activity stats', async () => {
    const response = await apiClient.analytics.getActivityStats();
    expect(response.success).toBe(true);
  });
});
```

---

## 📊 BROWSER CONSOLE TESTING

While testing, open Developer Tools (F12) and paste these commands:

### Test Fetch Bahagis
```javascript
import { apiClient } from '@/lib/api-client';
const result = await apiClient.bahagi.fetchAll();
console.log('Bahagis:', result);
```

### Test Create Yunit  
```javascript
const result = await apiClient.yunit.create({
  bahagi_id: 1,
  title: 'Test Yunit',
  description: 'From console'
});
console.log('Created:', result);
```

### Test Submit Assessment
```javascript
const result = await apiClient.assessment.submit(1, {
  student_id: 'test-123',
  answers: [0, 1, 2],
  total_questions: 3
});
console.log('Submitted:', result);
```

---

## 🔍 COMMON ISSUES & FIXES

### Issue 1: "Cannot find module '@/lib/api-client'"
**Solution:** Ensure `lib/api-client.ts` exists and TypeScript path is correct
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue 2: "API Error: Unauthorized"
**Solution:** Check that user is authenticated and has proper bearer token

### Issue 3: "Parameter format incorrect"
**Solution:** Use snake_case for API parameters:
- ❌ `bahagiId` 
- ✅ `bahagi_id`

### Issue 4: "response.data is undefined"
**Solution:** Check API response format - should have `success` and `data` fields

---

## ✅ DEPLOYMENT VALIDATION

Before deploying to production:

1. **Test all CRUD operations locally**
   - [ ] Create, Read, Update, Delete for each entity
   - [ ] Verify error handling works

2. **Test with real database**
   - [ ] Use test database for safety
   - [ ] Run full test suite

3. **Page load performance**
   - [ ] Check Network tab for slow requests
   - [ ] Verify caching works properly

4. **Error responses**
   - [ ] Test with invalid inputs
   - [ ] Verify error messages are user-friendly

5. **Backward compatibility**
   - [ ] Old endpoints should still work
   - [ ] Both old and new endpoints working in parallel

---

## 📋 NEXT STEPS

### Phase 6: Update Remaining Components
- [ ] EditBahagiForm.tsx
- [ ] AdminDashboard.tsx
- [ ] AvatarCustomization.tsx
- [ ] And 20+ others (see COMPONENT_MIGRATION_TRACKER.md)

### Phase 7: Comprehensive Testing
- [ ] Run unit tests for each service
- [ ] Run integration tests (end-to-end flows)
- [ ] Load testing (500+ concurrent users)
- [ ] Error scenario testing

### Phase 8: Deployment
- [ ] Deploy behind feature flag
- [ ] Monitor EventBus queue
- [ ] Monitor database connection pool
- [ ] Setup alerting for failures
- [ ] Plan deprecation of old endpoints

