# 🧪 Local Testing Guide - Assessment System

## ✅ Server Status
- **Development Server:** http://localhost:3000 ✅ Running
- **Database:** Supabase (Cloud) ✅ Connected
- **Migration:** ✅ Schema updated

---

## 📋 Testing Checklist

### Step 1: Login as Teacher
1. Open http://localhost:3000 in browser
2. Login with teacher credentials
3. Navigate to a class (e.g., "Kinder 4")
4. Verify you see the class detail page with Bahagiis

### Step 2: Create Assessment - Multiple Choice
1. Click on first Bahagi/Topic
2. Click **"Create Assessment"** button
3. Fill form:
   - **Title:** "Math Quiz"
   - **Instructions:** "Answer all questions"
   
4. In Questions section:
   - **Question Type:** Multiple Choice (default)
   - **Question Text:** "What is 2+2?"
   - Add Options:
     - Option 1: "2"
     - Option 2: "4" ✓ (select as correct)
     - Option 3: "6"
   - **XP:** 10
   - **Coins:** 5

5. Click floating **"+ Add Question"** button at bottom-left
6. Add second question (same process)
7. Click **"✓ Create Assessment"** button
8. ✅ Should see: "✅ Assessment created successfully!"

### Step 3: Verify Database Storage
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Create another assessment
4. Look for API call: **`manage-assessment`** 
5. Check **Response:**
   ```json
   {
     "success": true,
     "assessment": {
       "id": 2,
       "bahagi_id": 1,
       "title": "...",
       "type": "multiple-choice",
       "content": {
         "instructions": "...",
         "questions": [...],
         "totalPoints": 10
       }
     }
   }
   ```
6. ✅ Should contain all questions in response

### Step 4: Test Floating Button Positioning
1. Open Create Assessment form
2. **Mobile view** (F12, toggle device toolbar, ~375px):
   - Button should be at **bottom-left** (32px from left, 128px from bottom)
   - Button should NOT be hidden by footer buttons
   - Button should be **sticky** (visible when scrolling)
   - ✅ Test: Scroll through questions, button stays visible

3. **Desktop view** (wider screen):
   - Button should be at **bottom-left** (48px from left, 80px from bottom)
   - ✅ Test: Same scrolling behavior

### Step 5: Test All Assessment Types

#### Short Answer
1. Create assessment with:
   - Title: "Essay Question"
   - Question Type: **Short Answer**
   - Question: "What is the capital of France?"
   - **Correct Answer:** "Paris"
   - XP: 15, Coins: 10
2. Submit and verify saves

#### Checkbox (Multiple Answers)
1. Create assessment with:
   - Title: "Prime Numbers"
   - Question Type: **Checkbox**
   - Question: "Select all prime numbers"
   - Options: 2, 3, 4, 5, 6, 7
   - **Correct Answers:** 2, 3, 5, 7 (checkboxes)
   - XP: 20, Coins: 15
2. Submit and verify saves

#### Audio Recording
1. Create assessment with:
   - Title: "Pronunciation"
   - Question Type: **Audio Recording**
   - Question: "Pronounce: Hello"
   - Upload reference audio (any .mp3 file)
   - XP: 15, Coins: 10
2. Submit and verify saves

#### Scramble Word
1. Create assessment with:
   - Title: "Word Scramble"
   - Question Type: **Scramble Word**
   - Question: "Unscramble: OLLEH"
   - **Correct Word:** "HELLO"
   - XP: 10, Coins: 5
2. Submit and verify saves

#### Matching Pairs
1. Create assessment with:
   - Title: "Matching"
   - Question Type: **Matching**
   - Question: "Match countries with capitals"
   - Pairs:
     - Left: "Thailand" → Right: "Bangkok"
     - Left: "Japan" → Right: "Tokyo"
     - Add more pairs with floating button
   - XP: 20, Coins: 15
2. Submit and verify saves

### Step 6: Verify Assessment List Refresh
1. After creating each assessment, verify it appears in the assessment list
2. List should show:
   - Assessment title
   - Assessment type
   - Number of questions
   - Creation date
3. ✅ Each new assessment should appear immediately (no manual refresh needed)

### Step 7: Error Testing
1. Try submitting without title:
   - ✅ Should show: "Please enter an assessment title"

2. Try removing all questions:
   - ✅ Should show: "Please add at least one question"

3. Try submitting empty options:
   - ✅ Should show validation message or prevent submission

### Step 8: Console Testing (DevTools)
1. Open **Console** tab (F12)
2. Create assessment
3. Check for:
   - ❌ No red errors
   - ❌ No 400/500 errors
   - ✅ Assessment ID in logs (if logged)

---

## 🔍 Browser Network Inspection

### Watch API Requests
1. Open DevTools → Network tab
2. Create or update assessment
3. Look for request: **POST /api/teacher/manage-assessment**
4. Click on request, check:
   - **Request Payload** should have:
     ```json
     {
       "bahagiId": number,
       "title": "string",
       "type": "string",
       "instructions": "string",
       "questions": [array]
     }
     ```
   - **Response** should have:
     ```json
     {
       "success": true,
       "assessment": {...}
     }
     ```

### Retrieve Assessments
1. Look for request: **GET /api/teacher/manage-assessment?bahagiId=...**
2. Check response contains:
   - assessments array
   - Each assessment has content with questions
   - count field showing number of assessments

---

## 📊 Database Verification

### Check Supabase Dashboard
1. Open Supabase console
2. Go to **SQL Editor**
3. Run query:
   ```sql
   SELECT id, bahagi_id, title, type, created_at 
   FROM bahagi_assessment 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
4. ✅ Should see your created assessments

### Verify Content JSONB
```sql
SELECT id, title, jsonb_pretty(content) 
FROM bahagi_assessment 
WHERE id = (SELECT max(id) FROM bahagi_assessment);
```
4. ✅ Should show full assessment with questions

---

## ✨ Success Indicators

- ✅ Create 6 different assessment types
- ✅ All questions save to database
- ✅ Floating button is visible and functional
- ✅ No console errors
- ✅ Assessment list updates immediately
- ✅ All validations work correctly
- ✅ Database contains complete assessment data

---

## 🐛 Troubleshooting

### Issue: Form doesn't appear
- **Solution:** Refresh page (F5), check console for errors

### Issue: Button not visible
- **Solution:** Scroll down in form, it's fixed positioning
- **Check CSS:** Inspect element, verify `fixed` and `z-40` classes

### Issue: "Assessment created successfully" but doesn't appear in list
- **Solution:** Refresh page or wait 2 seconds
- **Check:** Verify in browser Network tab - was API call successful (200)?

### Issue: Questions not saving
- **Solution:** 
  1. Check that title is not empty
  2. Check that you have at least 1 question
  3. Check console for JavaScript errors (F12)
  4. Check Network tab for API errors

### Issue: Getting 400 Bad Request error
- **Check payload:** Network tab → Request body
- Should include: bahagiId, title, type, questions array

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________
Environment: Local (localhost:3000)

Tests Completed:
[ ] Multiple Choice - PASS/FAIL
[ ] Short Answer - PASS/FAIL
[ ] Checkbox - PASS/FAIL
[ ] Audio - PASS/FAIL
[ ] Scramble Word - PASS/FAIL
[ ] Matching Pairs - PASS/FAIL

Floating Button:
[ ] Desktop positioning - PASS/FAIL
[ ] Mobile positioning - PASS/FAIL
[ ] Visible when scrolling - PASS/FAIL
[ ] Functional - PASS/FAIL

Database:
[ ] Data saves correctly - PASS/FAIL
[ ] Content JSONB valid - PASS/FAIL
[ ] Assessment list updates - PASS/FAIL

Issues Found:
1. _____________________
2. _____________________

Recommendations:
_____________________
```

---

## ✅ Ready for Next Steps

Once you've verified all tests, you can:
1. Move to staging environment testing
2. Test with multiple teachers
3. Test on mobile devices (actual devices, not just DevTools)
4. Load test with many assessments

---

**Status:** 🧪 Ready for local testing
**Last Updated:** Jan 13, 2025
