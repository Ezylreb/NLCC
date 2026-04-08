# 📚 Teacher Dashboard - New Bahagi & Lesson System

## Overview

This document outlines the new Google Classroom-like system for managing Bahagi (course sections), lessons, assessments, and rewards in the Teacher Dashboard.

## Architecture

### Workflow

1. **Create Bahagi** - Teacher creates a course section
   - Title, Yunit, Display Image, Description
   - Can be Opened (active) or Archived (inactive)

2. **Edit Bahagi Content** - Teacher opens a Bahagi to add content
   - Add Lessons (from Librong gabay)
     - Title, Subtitle, Discussion (detailed content)
   - Add Assessments
     - Multiple choice
     - Audio input
     - Drag & drop
     - Matching type
   - Configure Rewards
     - XP points
     - Coins

3. **Student Experience** - Cards show all content
   - Bahagi card displays cover image
   - Lessons appear as expandable items
   - Assessments show type and completion status
   - Rewards displayed upon completion

## Database Schema

### Tables Created

```
bahagi - Main course section
├── id (PK)
├── title
├── yunit
├── image_url
├── description
├── is_open (Boolean)
├── teacher_id (FK)
├── class_name
└── timestamps

lesson - Individual lessons within Bahagi
├── id (PK)
├── bahagi_id (FK)
├── title
├── subtitle
├── discussion
├── lesson_order
└── timestamps

bahagi_assessment - Assessment items
├── id (PK)
├── bahagi_id (FK)
├── type (multiple-choice|audio|drag-drop|matching)
├── title
├── content (JSONB - flexible)
├── assessment_order
└── timestamps

bahagi_reward - Rewards configuration
├── id (PK)
├── bahagi_id (FK)
├── reward_type (xp|coins)
├── amount
└── timestamps

lesson_progress - Student progress tracking
├── id (PK)
├── student_id (FK)
├── lesson_id (FK)
├── completed
├── completion_date
├── xp_earned
├── coins_earned
└── timestamps

assessment_response - Student assessment responses
├── id (PK)
├── student_id (FK)
├── assessment_id (FK)
├── response (JSONB)
├── is_correct
└── timestamps
```

## Components Created

### 1. TeacherBahagi.tsx
Modal for creating new Bahagi

**Props:**
- `isOpen: boolean` - Modal visibility
- `onCreate: (data: BahagiData) => Promise<void>` - Creation callback
- `onClose: () => void` - Close handler
- `isLoading?: boolean` - Loading state

**Features:**
- Form validation
- Image upload
- Error handling

### 2. TeacherLessonEditor.tsx
Modal for editing Bahagi content

**Props:**
- `bahagiId: string` - Current Bahagi ID
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `onSave: (data) => Promise<void>` - Save callback

**Features:**
- Three tabs: Lessons, Assessments, Rewards
- Add/edit/delete lessons
- Select assessment types
- Configure reward points

### 3. BahagiCard.tsx
Card component displaying Bahagi in grid

**Props:**
- `id: string` - Bahagi ID
- `title: string` - Bahagi title
- `isOpen: boolean` - Open/Archived status
- `lessonCount: number` - Number of lessons
- `assessmentCount: number` - Number of assessments
- `totalXP: number` - Total XP reward
- `onEdit: () => void` - Edit callback
- `onToggleStatus: (status: boolean) => Promise<void>` - Archive/open
- `onDelete: () => Promise<void>` - Delete callback
- `onOpenEditor: () => void` - Open content editor

**Features:**
- Shows status badge
- Displays statistics
- Menu for actions
- Disable edit when archived

## API Endpoints Needed

```
POST   /api/teacher/create-bahagi
GET    /api/teacher/bahagis
PATCH  /api/teacher/bahagi/:id
DELETE /api/teacher/bahagi/:id

POST   /api/teacher/bahagi/:bahagiId/lessons
GET    /api/teacher/bahagi/:bahagiId/lessons
PUT    /api/teacher/lesson/:lessonId
DELETE /api/teacher/lesson/:lessonId

POST   /api/teacher/bahagi/:bahagiId/assessments
PUT    /api/teacher/assessment/:assessmentId
DELETE /api/teacher/assessment/:assessmentId

POST   /api/teacher/bahagi/:bahagiId/rewards
GET    /api/teacher/bahagi/:bahagiId/rewards

POST   /api/student/lesson/:lessonId/complete
POST   /api/student/assessment/:assessmentId/submit
GET    /api/student/bahagi/:bahagiId/progress
```

## Student UI Changes

### Student Dashboard Updates

The student cards for each Bahagi will now show:

```
┌─────────────────────────┐
│    Cover Image          │
│  (from Bahagi)          │
├─────────────────────────┤
│ Bahagi: Mga Hayop       │
│ Unit: 1                 │
├─────────────────────────┤
│ 📖 Lessons      [3]     │
│ ✏️ Assessments  [2]     │
│ 🎁 Rewards: 100 XP      │
│                         │
│ ▶ START LEARNING        │
└─────────────────────────┘
```

When clicked, expands to show:

```
📖 LESSONS
├─ Lesson 1: Introduction
│  └─ [Start] [✓ Complete]
├─ Lesson 2: Content
│  └─ [Start] [✓ Complete]
└─ Lesson 3: Practice
   └─ [Start] [ Incomplete]

✏️ ASSESSMENTS
├─ Multiple Choice
│  └─ [Take Test] [✓ 90%]
├─ Audio Recording
│  └─ [Record] [ Pending]
└─ Drag & Drop
   └─ [Try It] [ Incomplete]

🎁 REWARDS
├─ Lesson Complete: +50 XP
├─ All Assessments: +50 XP
└─ Total Possible: 100 XP
```

## Implementation Checklist

- [ ] Run database migration: `npm run migrate:bahagi`
- [ ] Create API endpoints for Bahagi CRUD
- [ ] Create API endpoints for Lessons CRUD
- [ ] Create API endpoints for Assessments CRUD
- [ ] Create API endpoints for Rewards
- [ ] Create API endpoints for student progress tracking
- [ ] Update TeacherDashboard to:
  - [ ] Import new components
  - [ ] Add state management for Bahagi
  - [ ] Implement fetch/create/edit/delete logic
  - [ ] Display BahagiCard grid
  - [ ] Handle TeacherBahagi modal
  - [ ] Handle TeacherLessonEditor modal
- [ ] Update StudentDashboard to:
  - [ ] Display new Bahagi structure
  - [ ] Show lesson progress
  - [ ] Display assessment status
  - [ ] Show rewards earned
- [ ] Create assessment type UI components
- [ ] Add student progress tracking
- [ ] Add reward calculation logic

## Assessment Types

### 1. Multiple Choice
```json
{
  "type": "multiple-choice",
  "question": "What is this animal?",
  "options": [
    { "id": 1, "text": "Dog", "correct": true },
    { "id": 2, "text": "Cat", "correct": false },
    { "id": 3, "text": "Bird", "correct": false }
  ]
}
```

### 2. Audio Input
```json
{
  "type": "audio",
  "prompt": "Say the word: Aso",
  "recordingDurationSeconds": 30,
  "gradeByPhonemes": true
}
```

### 3. Drag & Drop
```json
{
  "type": "drag-drop",
  "title": "Match animals to sounds",
  "items": [
    { "id": 1, "text": "Cow", "targetId": "sound-3" },
    { "id": 2, "text": "Dog", "targetId": "sound-1" }
  ],
  "targets": [
    { "id": "sound-1", "text": "Woof" },
    { "id": "sound-3", "text": "Moo" }
  ]
}
```

### 4. Matching
```json
{
  "type": "matching",
  "title": "Match Tagalog to English",
  "pairs": [
    { "left": "Aso", "right": "Dog", "id": 1 },
    { "left": "Pusa", "right": "Cat", "id": 2 }
  ]
}
```

## Google Classroom-like Features

1. **Class Organization** - Bahagis organize content hierarchically
2. **Content Management** - Easy add/edit/delete of lessons and assessments
3. **Progress Tracking** - See which students completed which lessons
4. **Grading** - Automatic points and XP calculation
5. **Archiving** - Keep old content without deleting
6. **Status Indicators** - Visual feedback for open/archived status

## Migration Script

Create `scripts/migrate-bahagi-schema.mjs`:

```javascript
#!/usr/bin/env node

import { query } from '../lib/db.js';
import * as fs from 'fs/promises';
import path from 'path';

async function migrate() {
  try {
    console.log('🚀 Starting Bahagi schema migration...');
    
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-bahagi-schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    const statements = sql
      .split(';')
      .filter(s => s.trim())
      .map(s => s.trim() + ';');
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await query(statement);
    }
    
    console.log('✅ Bahagi schema migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

## Adding to TeacherDashboard

```tsx
// In TeacherDashboard.tsx

import { TeacherBahagi } from '@/components/TeacherBahagi';
import { TeacherLessonEditor } from '@/components/TeacherLessonEditor';
import { BahagiCard } from '@/components/BahagiCard';

// State management
const [bahagis, setBahagis] = useState<any[]>([]);
const [selectedBahagi, setSelectedBahagi] = useState<any>(null);
const [showCreateBahagi, setShowCreateBahagi] = useState(false);
const [showLessonEditor, setShowLessonEditor] = useState(false);

// Handlers
const handleCreateBahagi = async (data: BahagiData) => {
  const res = await fetch('/api/teacher/create-bahagi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, teacherId: user?.id })
  });
  const result = await res.json();
  setBahagis([...bahagis, result.bahagi]);
  setShowCreateBahagi(false);
};

// Render in appropriate tab
{activeTab === 'bahagis' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <button
      onClick={() => setShowCreateBahagi(true)}
      className="..."
    >
      ➕ Create Bahagi
    </button>
    {bahagis.map(bahagi => (
      <BahagiCard
        key={bahagi.id}
        {...bahagi}
        onOpenEditor={() => {
          setSelectedBahagi(bahagi);
          setShowLessonEditor(true);
        }}
        // ... other handlers
      />
    ))}
  </div>
)}

{showCreateBahagi && (
  <TeacherBahagi
    isOpen={showCreateBahagi}
    onClose={() => setShowCreateBahagi(false)}
    onCreate={handleCreateBahagi}
  />
)}

{showLessonEditor && selectedBahagi && (
  <TeacherLessonEditor
    bahagiId={selectedBahagi.id}
    bahagiTitle={selectedBahagi.title}
    isOpen={showLessonEditor}
    onClose={() => setShowLessonEditor(false)}
    onSave={handleSaveLessonContent}
  />
)}
```

## Next Steps

1. Run the database migration
2. Implement all API endpoints
3. Update TeacherDashboard with new components
4. Update StudentDashboard cards
5. Add assessment UI components
6. Test the full workflow
7. Deploy to production

---

**Status:** Development Phase
**Last Updated:** 2024
