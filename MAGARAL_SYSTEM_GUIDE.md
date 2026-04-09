# Student Dashboard - Mag-Aral (Learning) System Implementation

## Overview
Complete student learning management system with:
- ✅ Structured lesson flow (Bahagi → Yunit → Assessment)
- ✅ Strict data filtering (Students see ONLY enrolled class content)
- ✅ Bahagi lock/unlock logic (Progression-based unlocking)
- ✅ Game-based assessments (Hearts, progress, rewards)
- ✅ Reward system (XP & coins)
- ✅ Progress tracking

---

## 📁 File Structure

### Backend API Routes (Created)
```
app/api/student/
├── enrolled-classes/route.ts      # Get student's enrolled classes
├── bahagis/route.ts               # Get bahagis with unlock status
├── yunits/route.ts                # Get yunits with progress
├── assessments/route.ts           # Get and submit assessments
└── progress/route.ts              # Track student progress
```

### Frontend Components (StudentComponents/)
```
StudentComponents/
├── MagAralPage.tsx                # Main orchestrator component
├── ClassView.tsx                  # Shows enrolled classes
├── BahagiView.tsx                 # Shows phases with lock/unlock
├── YunitView.tsx                  # Shows lessons in a phase
├── AssessmentScreen.tsx           # Interactive quiz interface
└── RewardModal.tsx                # Shows rewards after completion
```

---

## 🔐 Strict Data Filtering (Security)

**Rule:** Students ONLY see content from classes they're enrolled in.

**Implementation:**
```typescript
// API enforces this filtering
WHERE teacher_id = $1 AND is_archived = false

// Student can ONLY access what their class has
student → class → teacher → bahagis → yunits → assessments
```

**No Bypassing:** Even if a student knows another teacher's ID, API returns 404.

---

## 🔒 Bahagi Lock/Unlock Logic

### Unlock Conditions:

| Bahagi | Unlock Condition |
|--------|------------------|
| **1st** | Always unlocked |
| **2nd+** | Previous bahagi 100% passed |

### What "100% passed" means:
- ALL yunits in previous bahagi have score ≥ 75%

### UI Behavior:
- **Locked:** 🔒 icon, disabled click, "Complete previous to unlock" message
- **Unlocked:** 🔓 icon, fully clickable, shows progress

---

## 📊 Assessment Flow

### 1. Question Display
```
↓ Load Assessment
↓ Show Question + Type
↓ Student selects answer
↓ Click "Pakitsek" (Submit)
↓ Check answer
↓ Show result (correct/incorrect)
↓ Hearts deducted if wrong
↓ Click "Magpatuloy" (Continue)
↓ Next question
```

### 2. Answer States

| State | UI |
|-------|-----|
| **Default** | Gray options, neutral |
| **Correct** | Purple/green border, other options disabled |
| **Incorrect** | Red border, shows correct answer, loses 1 ❤️ |

### 3. Lives System
- Start with 3 ❤️
- Each wrong answer: -1 ❤️
- 0 ❤️ = Game Over (can retry)

### 4. Scoring
```
score_percentage = (correct_answers / total_questions) * 100

PASSED if: score ≥ 75%
FAILED if: score < 75% (can retry)
```

---

## 🎁 Rewards System

### When Student Passes (≥75%):
1. ✅ Award XP (configurable per yunit)
2. ✅ Award coins (configurable per yunit)
3. ✅ Update user XP/coins totals
4. ✅ Show reward modal with celebration

### Reward Modal Shows:
- Score percentage with progress bar
- 🎉 Success celebration
- ⭐ XP earned
- 🪙 Coins earned
- "Continue" button

### Unlock Next Bahagi:
- System checks if ALL yunits passed
- If yes → Next bahagi auto-unlocks
- Student sees on refresh

---

## 📈 Progress Tracking

### Stored in Database:
```sql
student_progress table:
- student_id
- bahagi_id
- yunit_id
- score_percentage
- is_passed
- xp_earned
- coins_earned
- attempts
```

### Real-time Indicators:
- Progress bar in yunit list
- "Completed" badge on passed yunits
- Score display (e.g., "85%")
- Rewards earned (e.g., "+50 XP")

---

## 🔄 Integration into StudentDashboard

### Current Structure:
```typescript
<StudentDashboard>
  ├── Mag-Aral tab (lessons)
  ├── Leaderboard tab
  ├── Missions tab
  └── ... other tabs
```

### How to Integrate:

```typescript
// In StudentDashboard.tsx

import { MagAralPage } from './StudentComponents/MagAralPage';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user,
  // ... props
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('lessons');

  return (
    // ... existing header

    {activeTab === 'lessons' && (
      <MagAralPage
        studentId={user?.id || ''}
        studentName={`${user?.firstName} ${user?.lastName}`}
        onNavigate={(view) => {
          if (view === 'dashboard') {
            setActiveTab('lessons'); // Stay on this tab
          }
        }}
      />
    )}

    // ... other tabs
  );
};
```

---

## 🗄️ Database Setup

### Required Tables:
1. ✅ `student_progress` - Student completion tracking
2. ✅ `bahagi_unlocks` - Unlock status (optional, auto-generated)
3. ✅ `bahagi_reward` - XP/coins per yunit
4. ✅ `users` - Must have `xp`, `coins` columns

### Run Migration:
```bash
# Execute in your database
scripts/setup-student-dashboard.sql
```

### Table Relationships:
```
users (students)
├── student_progress
│   ├── bahagi_id → bahagis
│   └── yunit_id → yunits
│       └── bahagi_assessment
└── xp, coins (updated on reward)

bahagis (phases)
├── yunits (lessons)
│   ├── bahagi_assessment (quizzes)
│   │   └── content.questions (JSON)
│   └── bahagi_reward (xp/coins)
└── teacher_id → users (teacher)
```

---

## 🎯 Key Features Summary

### ✅ Features Implemented

1. **Class View** - Shows all enrolled classes
2. **Bahagi View** - Phases with lock/unlock logic
   - 🔓 First phase unlocked
   - 🔒 Other phases locked until previous passed
3. **Yunit View** - Lessons with:
   - ✓ Completion status
   - Score percentage
   - XP/coins earned
4. **Assessment Screen** - Full quiz with:
   - ❤️ Lives system (3 hearts)
   - Progress indicator (X / Total)
   - Multiple question types:
     - Multiple-choice
     - Matching pairs
     - Word scramble
   - Immediate feedback
   - "Skip" and "Submit" buttons
5. **Reward Modal** - On completion
   - Shows score and progress bar
   - Displays earned XP/coins
   - Unlocks next phase if applicable
6. **Strict Data Filtering** - Students only see their class content
7. **Progress Persistence** - Database tracking of all progress

### 📊 Question Types Supported

| Type | Display | Interaction |
|------|---------|-------------|
| **Multiple-Choice** | Buttons | Click option |
| **Matching Pairs** | Left/Right with dropdowns | Select match |
| **Scramble Word** | Visible scrambled letters | Type answer |
| **Checkbox** | Multiple selections | Check multiple |
| **Short-Answer** | Text input | Type response |
| **Audio** | Audio player | Listen + compare |

---

## 🔧 Configuration

### Per Yunit Rewards:
Edit in teacher dashboard:
```
Yunit → Settings → Rewards
├── XP: 50 (configurable)
└── Coins: 25 (configurable)
```

### Passing Score:
```typescript
// In assessments/route.ts
const isPassed = scorePercentage >= 75;  // Change if needed
```

### Number of Lives:
```typescript
// In AssessmentScreen.tsx
const [lives, setLives] = useState(3);  // Change to 5, etc.
```

---

## 🚀 Future Enhancements

- [ ] Time-based questions
- [ ] Adaptive difficulty
- [ ] Custom avatars per achievement
- [ ] Leaderboard integration
- [ ] Achievement badges
- [ ] Streak tracking
- [ ] Offline mode
- [ ] Mobile optimization

---

## 🧪 Testing Checklist

- [ ] Student enrolls in class
- [ ] First bahagi unlocked
- [ ] Second bahagi locked initially
- [ ] Taking assessment shows all questions
- [ ] Wrong answer loses 1 heart
- [ ] 3 wrong answers = game over
- [ ] Score ≥75% = passed
- [ ] Score <75% = failed (can retry)
- [ ] Passed assessment → rewards shown
- [ ] XP/coins added to profile
- [ ] Next bahagi unlocks after all yunits passed
- [ ] Cannot access locked bahagis
- [ ] Student A cannot see Student B's progress

---

## 📝 API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/student/enrolled-classes` | GET | Get student's classes |
| `/api/student/bahagis` | GET | Get bahagis with unlock status |
| `/api/student/yunits` | GET | Get yunits with progress |
| `/api/student/assessments` | GET | Get assessment questions |
| `/api/student/assessments` | POST | Submit assessment answers |
| `/api/student/progress` | GET | Get student progress |
| `/api/student/progress` | POST | Save progress (manual) |

---

## 🆘 Troubleshooting

### Issue: Bahagi not unlocking
**Solution:** Check `student_progress.is_passed` for all yunits in previous bahagi

### Issue: Rewards not showing
**Solution:** Verify `bahagi_reward` table has entries for yunit_id

### Issue: Student sees wrong class content
**Solution:** Verify `teacher_id` in bahagis matches correct teacher

### Issue: Assessment questions not loading
**Solution:** Ensure `yunit_id` in `bahagi_assessment` is populated

---

## 📞 Support
For issues or questions, refer to the specific component files for detailed comments.
