# Assessment Deletion Fix

## Problem
Assessment deletion appeared to not be working in the TeacherDashboard. When teachers deleted assessments, the UI still showed them in the list.

## Root Cause
There were **TWO issues**:

### Issue 1: Archived Assessments Not Filtered (PRIMARY ISSUE)
- When assessments were deleted, they were marked as `is_archived = true` in the database
- However, the `listByBahagi()` and `listByYunit()` service methods had no filtering for archived assessments
- This caused deleted assessments to still appear in the teacher's view

**Affected files:**
- `lib/services/AssessmentService.ts` lines 319-344

### Issue 2: UI Not Refreshing After Deletion (SECONDARY ISSUE)
- The `handleDeleteAssessment` function in TeacherDashboardV2 had a TODO comment indicating the refresh wasn't implemented
- After deletion, the assessment list wasn't being reloaded

**Affected files:**
- `app/components/TeacherDashboardV2.tsx` line 566-580

---

## Solution Implemented

### Fix 1: Filter Archived Assessments in Service Layer ✅
**File:** `lib/services/AssessmentService.ts`

Updated both methods to exclude archived assessments by default:

```typescript
// BEFORE
static async listByBahagi(bahagiId: string | number, options?: { studentView?: boolean }) {
  const result = await repositories.assessment.raw(`
    SELECT ... FROM bahagi_assessment
    WHERE bahagi_id = $1
    ORDER BY ...
  `, [bahagiIdNum]);
  return result.map((row) => this.transformAssessment(row, options));
}

// AFTER
static async listByBahagi(bahagiId: string | number, options?: { studentView?: boolean; includeArchived?: boolean }) {
  const archivedFilter = options?.includeArchived ? '' : 'AND is_archived = false';
  const result = await repositories.assessment.raw(`
    SELECT ... FROM bahagi_assessment
    WHERE bahagi_id = $1 ${archivedFilter}
    ORDER BY ...
  `, [bahagiIdNum]);
  return result.map((row) => this.transformAssessment(row, options));
}
```

**Changes:**
- Added optional `includeArchived` parameter to `listByBahagi()` and `listByYunit()`
- By default, filters out archived assessments: `AND is_archived = false`
- Teachers can still view archived assessments if needed by passing `includeArchived: true`

---

### Fix 2: Refresh UI After Deletion ✅
**File:** `app/components/TeacherDashboardV2.tsx`

Updated the delete handler to call the refresh function:

```typescript
// BEFORE
const handleDeleteAssessment = async (lessonId: string, assessmentId: string) => {
    try {
        const response = await apiClient.assessment.deleteAssessment(parseInt(assessmentId));
        if (response.success) {
            alert('✅ Assessment deleted successfully!');
            // TODO: Refresh Bahagi view
        } else {
            alert(`❌ Error: ${response.error}`);
        }
    } catch (err) {
        console.error('Error deleting assessment:', err);
        alert('❌ Failed to delete assessment');
    }
};

// AFTER
const handleDeleteAssessment = async (lessonId: string, assessmentId: string) => {
    try {
        const response = await apiClient.assessment.deleteAssessment(parseInt(assessmentId));
        if (response.success) {
            alert('✅ Assessment deleted successfully!');
            // Refresh Bahagi view to show updated assessment list
            await handleRefreshBahagi();
        } else {
            alert(`❌ Error: ${response.error}`);
        }
    } catch (err) {
        console.error('Error deleting assessment:', err);
        alert('❌ Failed to delete assessment');
    }
};
```

**Changes:**
- Removed TODO comment
- Added call to `handleRefreshBahagi()` after successful deletion
- This reloads the bahagi list with the updated (archived) assessments filtered out

---

## How It Works Now

### Deletion Flow
1. Teacher clicks delete button on assessment
2. Confirmation dialog appears
3. On confirm:
   - API marks assessment as `is_archived = true`
   - Success alert shown
   - `handleRefreshBahagi()` called
   - New request to `/api/rest/assessments?bahagiId=...`
   - Service filters with `is_archived = false`
   - UI updates without the deleted assessment
4. Teacher sees deleted assessment immediately removed from list

### Data Flow
```
TeacherDashboard
  ↓ click delete
handleDeleteAssessment()
  ↓
apiClient.assessment.deleteAssessment()
  ↓
DELETE /api/rest/assessments?id=123
  ↓
AssessmentService.archive() → is_archived = true
  ↓
handleRefreshBahagi()
  ↓
apiClient.bahagi.fetchAll()
  ↓
GET /api/rest/assessments?bahagiId=456
  ↓
AssessmentService.listByBahagi() → filters is_archived = false
  ↓
Returns only active (non-archived) assessments
  ↓
UI updates instantly
```

---

## Testing

### To Verify the Fix:

1. **Create an Assessment**
   - Go to Class Detail
   - Create a new assessment with a title
   - Verify it appears in the list

2. **Delete the Assessment**
   - Click the 🗑️ delete button
   - Confirm the deletion
   - **Expected:** Assessment immediately disappears from the list

3. **Check Database (Optional)**
   - Query: `SELECT * FROM bahagi_assessment WHERE title = 'Test' AND is_archived = true`
   - Should show the deleted assessment marked as archived

4. **Refresh the Page**
   - Refresh browser
   - Deleted assessment should NOT appear (because it's filtered out)

---

## Backward Compatibility

The fix includes an optional `includeArchived` parameter:
- Default: `false` (archived assessments filtered out)
- Teachers can view archived assessments if needed by passing `includeArchived: true`

This maintains backward compatibility while fixing the issue.

---

## Files Modified

1. **lib/services/AssessmentService.ts**
   - Updated `listByBahagi()` method
   - Updated `listByYunit()` method

2. **app/components/TeacherDashboardV2.tsx**
   - Updated `handleDeleteAssessment()` function

---

## Related Files (No Changes Needed)

These files work correctly with the fix:
- `app/api/rest/assessments/route.ts` - DELETE endpoint (already working)
- `app/components/TeacherComponents/ClassDetailPage.tsx` - Also uses same pattern
- `lib/api-client.ts` - API client (no changes needed)

---

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Archived assessments still visible | ✅ FIXED | Filter in service layer |
| UI not refreshing after delete | ✅ FIXED | Call handleRefreshBahagi() |

**Result:** Assessment deletion now works properly. Deleted (archived) assessments are:
- Removed from UI immediately
- Not shown when teacher refreshes
- Still in database (soft delete) for potential restoration
- Properly filtered by the service layer

---

**Last Updated:** April 22, 2026
