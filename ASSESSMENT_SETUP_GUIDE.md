# Quick Setup Guide - Assessment System Fix

## 🚀 Quick Start (2 minutes)

### 1. Run Database Migration
```bash
npm run migrate:assessment
```

Expected output:
```
✅ Connected to database
✅ bahagi_assessment table exists
✅ Added column: lesson_id
✅ Added column: content
✅ Created assessment_questions table
✅ Created indexes...
✅ Migration completed successfully!
```

### 2. Test Database Connection
```bash
npm run check:assessment
```

### 3. Restart Application
```bash
npm run dev
```

---

## ✅ What Works Now

### All 6 Assessment Types
- ✅ **Multiple Choice** - Single answer from options
- ✅ **Short Answer** - Free text response
- ✅ **Checkbox** - Multiple correct answers
- ✅ **Audio Recording** - Student voice response
- ✅ **Scramble Word** - Unscramble the word
- ✅ **Matching Pairs** - Match items together

### Complete Assessment Features
- ✅ Add unlimited questions
- ✅ Set per-question rewards (XP and Coins)
- ✅ Full instructions support
- ✅ All data saved to database
- ✅ Can retrieve assessments for editing
- ✅ Floating "Add Question" button (bottom-left)

### Error Handling
- ✅ Clear validation messages
- ✅ Required fields checking
- ✅ Type validation
- ✅ Database error reporting

---

## 🧪 Test It Out

### To Create an Assessment:

1. **Open Teacher Dashboard**
   - Login as teacher
   - Go to a class

2. **Create Assessment**
   - Click on a Bahagi/Topic
   - Click "Create Assessment" button
   - Enter title and instructions

3. **Add Questions**
   - Select question type
   - Enter question text
   - Fill in options/answers
   - Set XP and Coins reward
   - Click floating "+ Add Question" button to add more

4. **Submit**
   - Click "Create Assessment" button
   - Should see: ✅ Assessment created successfully!

### To View Created Assessments:

1. Refresh the page - assessments should appear in the list
2. Each assessment shows:
   - Title
   - Type
   - Number of questions
   - Creation date

---

## 🔍 Verification Steps

### Check Database Changes
```bash
# List all tables
psql -U postgres -d nlcc_db -c "\dt"

# Check bahagi_assessment columns
psql -U postgres -d nlcc_db -c "\d bahagi_assessment"

# Count assessments
psql -U postgres -d nlcc_db -c "SELECT COUNT(*) FROM bahagi_assessment;"
```

### Check Application Logs
Open browser console (F12):
- Look for successful POST responses
- Check network tab for `/api/teacher/manage-assessment`
- Verify response includes assessment ID

---

## ⚠️ Troubleshooting

### Issue: "Bahagi ID is required" error
**Solution:** This is a validation error. Make sure:
- You're in a class with Bahagiis
- Assessment form has received proper context

### Issue: "Column does not exist" error
**Solution:** Run the migration:
```bash
npm run migrate:assessment
```

### Issue: Questions not saving
**Solution:**
1. Check browser console for errors
2. Verify questions array is not empty
3. Each question must have a type field
4. Run database check: `npm run check:assessment`

### Issue: Assessments not showing after creation
**Solution:**
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check that `content` field is saved in database
3. Verify `bahagi_id` matches in database

---

## 📋 Assessment Structure in Database

### Created Assessment Data:
```json
{
  "id": 1,
  "bahagi_id": 1,
  "title": "Math Quiz",
  "type": "multiple-choice",
  "content": {
    "instructions": "Answer all questions...",
    "questions": [
      {
        "type": "multiple-choice",
        "question": "Question text",
        "options": [{"text": "A"}, {"text": "B"}],
        "correctAnswer": 0,
        "xp": 10,
        "coins": 5
      }
    ],
    "totalPoints": 10,
    "createdAt": "2024-01-01T..."
  },
  "created_at": "2024-01-01T...",
  "updated_at": "2024-01-01T..."
}
```

---

## 🎯 Next Steps

After setup:
1. ✅ Create test assessments
2. ⏳ Update edit form (separate task)
3. ⏳ Student assessment submission page
4. ⏳ Assessment grading interface

---

## 📞 Support

If you encounter issues:

1. **Check logs**: `npm run check:assessment`
2. **Verify migration**: `npm run migrate:assessment`
3. **Restart app**: `npm run dev`
4. **Check browser console**: F12 → Console tab
5. **Check network tab**: F12 → Network → look for 400 responses

---

**Status**: ✅ Ready to Deploy
**Last Update**: 2025-01-13
