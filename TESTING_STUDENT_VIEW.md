# Quick Testing Guide - Student View Features

## Step 1: Ensure Database is Ready
```bash
# Run migrations (if not already done)
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'; node migrate-now.mjs
```

Expected output:
```
✅ Migration completed successfully!
```

## Step 2: Create Test Data

Using the Admin Dashboard or SQL directly:

### Via SQL (if you have direct DB access)
```sql
-- You should already have:
-- 1. Teacher user (role='TEACHER')
-- 2. Student user (role='USER') 
-- 3. Class created by that teacher
-- 4. Bahagis/Yunits created by that teacher

-- Update student to assign to teacher and class
UPDATE users 
SET teacher_id = 'TEACHER_UUID', 
    class_id = 'CLASS_UUID'
WHERE id = 'STUDENT_UUID' AND role = 'USER';
```

### Via Admin Dashboard
1. Go to Admin Dashboard
2. Create a teacher (if not exists)
3. Create a student
4. In "Create Student" modal:
   - Select teacher from dropdown ✅
   - Select class from dropdown ✅
   - Create student
5. Student now has teacher_id and class_id assigned

## Step 3: Test Student Login Flow

1. **Login as Student:**
   - Email: student@example.com
   - Password: (the password you set)
   - Should land in Student Dashboard

2. **Navigate to Mag-Aral:**
   - Click "📚 Mag-Aral" tab in sidebar
   - Should see `TeacherLessonsView` (NOT ClassView)
   - Header shows: "Learning from [TeacherName] in [ClassName]"

3. **Verify Stats Display:**
   - 📖 Total Lessons count
   - ✅ Completed count
   - ⏳ In Progress count
   - ⚡ Available XP total

## Step 4: Test Lesson Cards

For each visible lesson card, verify:

### Card Structure ✅
- [ ] Shows "Bahagi X, Yunit 1" at top
- [ ] Shows "X of Y units completed"
- [ ] 📖 Libro button is visible
- [ ] Lesson image/icon displays
- [ ] Title and description visible
- [ ] Progress bar shows completion percentage

### Card Styling ✅
- [ ] First lesson is fully visible (unlocked)
- [ ] Subsequent lessons show 🔒 overlay if not unlocked
- [ ] Difficulty badge shows (Beginner/Intermediate/Advanced)
- [ ] XP reward displays (⚡ +XXP)

### Buttons ✅
- [ ] "🚀 Simulan +10XP" button is active for unlocked lessons
- [ ] "📋 Assignment" button visible
- [ ] "🎁 Rewards" button visible
- [ ] Completed lessons show "✅ Completed" instead

### Hover Effects ✅
- [ ] Lesson card cards slightly on hover
- [ ] Border changes color on hover (purple-ish)
- [ ] Buttons show hover state

## Step 5: Test Interactions

### Click on First Lesson
1. Click anywhere on unlocked lesson card (or click 🚀 button)
2. Should navigate to BahagiView
3. Should show all Yunits in that Bahagi
4. Can click a Yunit to start assessment
5. Can click back button to return to lessons

### Try Clicking Locked Lesson
1. Try clicking on locked lesson card
2. Should NOT open
3. Should show 🔒 overlay message

### Empty State Test
Create a student assigned to a teacher with NO lessons:
1. Login as that student
2. Mag-Aral should show empty state
3. Message: "No lessons yet"
4. Message: "Your teacher hasn't posted any lessons yet"

## Step 6: Test API Endpoints Directly

### Test Teacher Info Endpoint
```bash
# In browser console or curl
fetch('/api/student/teacher-info?studentId=STUDENT_UUID')
  .then(r => r.json())
  .then(console.log)
```

Expected response:
```json
{
  "studentId": "...",
  "teacherId": "...",
  "teacherName": "Test Teacher",
  "teacherEmail": "teacher@example.com",
  "classId": "...",
  "className": "Class Name",
  "isAssigned": true
}
```

### Test Teacher Lessons Endpoint
```bash
fetch('/api/student/teacher-lessons?studentId=STUDENT_UUID&teacherId=TEACHER_UUID')
  .then(r => r.json())
  .then(console.log)
```

Expected response:
```json
{
  "studentId": "...",
  "teacherId": "...",
  "totalLessons": 3,
  "completedLessons": 0,
  "lessons": [
    {
      "id": "bahagi-1",
      "bahagiNumber": 1,
      "title": "Pagpapakilala sa Sarili",
      "isUnlocked": true,
      "isCompleted": false,
      ...
    }
  ]
}
```

## Step 7: Troubleshooting

### Issue: Seeing ClassView instead of TeacherLessonsView
**Solution:**
- Check that student has `teacher_id` set
- Verify teacher_id matches a TEACHER role user
- Check browser console for errors
- Refresh page

### Issue: All lessons showing as locked
**Solution:**
- First lesson should ALWAYS be unlocked
- Check `display_order` in database
- Verify bahagis have `teacher_id` set correctly

### Issue: No lessons displaying
**Solution:**
- Verify teacher has created bahagis
- Check that lessons are not archived (`is_archived = false`)
- Verify student's teacher_id matches lesson's teacher_id
- Check API response using browser console

### Issue: Images not loading on cards
**Solution:**
- Check that `image_url` in database is valid
- Verify image URL is accessible
- Check browser console for 404 errors
- Falls back to default 📚 icon if no image

## Step 8: Performance Testing

1. **Load with many lessons:**
   - Create teacher with 10+ bahagis
   - Verify page loads smoothly
   - Check browser performance tab

2. **Load with many yunits:**
   - Create bahagi with 10+ yunits
   - Click lesson to see yunit list
   - Verify smooth scrolling

3. **Network throttling:**
   - Slow 3G speed in DevTools
   - Verify loading states display
   - Verify error messages appear if request fails

## Common Test Scenarios

### Scenario A: Perfect Setup ✅
- Student → Teacher → Class → Bahagis/Yunits
- Result: Mag-Aral shows all lessons from teacher
- First lesson unlocked, others locked
- Can complete lessons and unlock next

### Scenario B: No Teacher Assigned ❌
- Student has NULL teacher_id
- Result: Falls back to ClassView
- Shows class selection instead of lessons

### Scenario C: Multiple Teachers
- Student assigned to Teacher A
- Teacher B also uploaded lessons
- Result: ** ONLY ** shows Teacher A's lessons
- Other teachers' content is filtered out

### Scenario D: Teacher with Many Classes
- Teacher has 5 classes
- Multiple classes have lessons
- Each student only sees THEIR assigned class lessons
- Result: Student sees only their class' lessons

## Success Checklist

- [ ] Student sees TeacherLessonsView, not ClassView
- [ ] Stats display correctly
- [ ] First lesson is unlocked
- [ ] Locked lessons show overlay
- [ ] Can click unlocked lesson
- [ ] Empty state works when no lessons
- [ ] API endpoints return correct data
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Images load correctly
- [ ] Only teacher's lessons visible
- [ ] Only student's class lessons visible
- [ ] Back button returns to dashboard

## Notes

- Each component file has inline comments explaining the logic
- Check browser DevTools Console for API response details
- Network tab shows API calls and their response times
- Clear browser cache if seeing stale data
- Restart dev server (`npm run dev`) if changes not reflecting

---

Need help? Check:
1. `/STUDENT_VIEW_IMPLEMENTATION.md` - Full technical docs
2. `/app/api/student/teacher-info/route.ts` - Teacher info API
3. `/app/components/StudentComponents/TeacherLessonsView.tsx` - Main view component
