# Teacher Bahagi System - API Endpoint Reference

## Overview
Complete API documentation for the Google Classroom-like teacher content management system.

---

## Teacher API Endpoints

### 1. Bahagi Management

#### Create/List Bahagis
- **Path**: `/api/teacher/bahagi`
- **POST**: Create new Bahagi
  ```json
  Request Body:
  {
    "title": "Introduction to Math",
    "yunit": "Math 101",
    "image_url": "https://...",
    "description": "Basic math concepts",
    "class_name": "Grade 1"
  }
  
  Response (201):
  {
    "bahagi": {
      "id": "uuid",
      "title": "Introduction to Math",
      "yunit": "Math 101",
      "image_url": "https://...",
      "description": "Basic math concepts",
      "is_open": true,
      "class_name": "Grade 1",
      "teacher_id": "uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
  ```

- **GET**: Fetch all Bahagis for teacher
  ```json
  Response (200):
  {
    "bahagis": [
      {
        "id": "uuid",
        "title": "Introduction to Math",
        "yunit": "Math 101",
        "image_url": "https://...",
        "description": "Basic math concepts",
        "is_open": true,
        "class_name": "Grade 1",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "lessonCount": 5,
        "assessmentCount": 3,
        "totalXP": 150
      }
    ]
  }
  ```

#### Update/Delete Specific Bahagi
- **Path**: `/api/teacher/bahagi/:id`
- **PATCH**: Update Bahagi
  ```json
  Request Body:
  {
    "title": "Advanced Math",
    "description": "More complex concepts",
    "is_open": false
  }
  
  Response (200):
  {
    "bahagi": { ...updated bahagi object }
  }
  ```

- **DELETE**: Archive/Delete Bahagi
  ```json
  Response (200):
  {
    "success": true,
    "message": "Bahagi deleted successfully"
  }
  ```

---

### 2. Lesson Management

#### Create/List Lessons
- **Path**: `/api/teacher/bahagi/:bahagiId/lessons`
- **POST**: Create lesson
  ```json
  Request Body:
  {
    "title": "Numbers 1-10",
    "subtitle": "Learning to count",
    "discussion": "In this lesson, students will learn...",
    "lesson_order": 1
  }
  
  Response (201):
  {
    "lesson": {
      "id": "uuid",
      "bahagi_id": "uuid",
      "title": "Numbers 1-10",
      "subtitle": "Learning to count",
      "discussion": "In this lesson...",
      "lesson_order": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
  ```

- **GET**: Fetch lessons for Bahagi
  ```json
  Response (200):
  {
    "lessons": [
      {
        "id": "uuid",
        "bahagi_id": "uuid",
        "title": "Numbers 1-10",
        "subtitle": "Learning to count",
        "discussion": "In this lesson...",
        "lesson_order": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

#### Update/Delete Specific Lesson
- **Path**: `/api/teacher/lesson/:lessonId`
- **PUT**: Update lesson
  ```json
  Request Body:
  {
    "title": "Numbers 1-20",
    "lesson_order": 2
  }
  
  Response (200):
  {
    "lesson": { ...updated lesson object }
  }
  ```

- **DELETE**: Delete lesson
  ```json
  Response (200):
  {
    "success": true,
    "message": "Lesson deleted successfully"
  }
  ```

---

### 3. Assessment Management

#### Create/List Assessments
- **Path**: `/api/teacher/bahagi/:bahagiId/assessments`
- **POST**: Create assessment
  ```json
  Request Body:
  {
    "type": "multiple-choice",
    "title": "Quiz: Counting",
    "content": {
      "question": "What comes after 5?",
      "options": ["4", "6", "7"],
      "correctAnswer": 1
    },
    "assessment_order": 1
  }
  
  Response (201):
  {
    "assessment": {
      "id": "uuid",
      "bahagi_id": "uuid",
      "type": "multiple-choice",
      "title": "Quiz: Counting",
      "content": {...},
      "assessment_order": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
  ```

- **GET**: Fetch assessments for Bahagi
  ```json
  Response (200):
  {
    "assessments": [
      {
        "id": "uuid",
        "bahagi_id": "uuid",
        "type": "multiple-choice",
        "title": "Quiz: Counting",
        "content": {...},
        "assessment_order": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

**Supported Assessment Types**: `multiple-choice`, `audio`, `drag-drop`, `matching`

#### Update/Delete Specific Assessment
- **Path**: `/api/teacher/assessment/:assessmentId`
- **PUT**: Update assessment
  ```json
  Request Body:
  {
    "title": "Quiz: Counting 1-10",
    "content": {...}
  }
  
  Response (200):
  {
    "assessment": { ...updated assessment object }
  }
  ```

- **DELETE**: Delete assessment
  ```json
  Response (200):
  {
    "success": true,
    "message": "Assessment deleted successfully"
  }
  ```

---

### 4. Reward Management

#### Configure/List Rewards
- **Path**: `/api/teacher/bahagi/:bahagiId/rewards`
- **POST**: Configure reward (creates or updates)
  ```json
  Request Body:
  {
    "reward_type": "xp",
    "amount": 50
  }
  
  Response (201):
  {
    "reward": {
      "id": "uuid",
      "bahagi_id": "uuid",
      "reward_type": "xp",
      "amount": 50,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
  ```

**Supported Reward Types**: `xp`, `coins`

- **GET**: Fetch rewards for Bahagi
  ```json
  Response (200):
  {
    "rewards": [
      {
        "id": "uuid",
        "bahagi_id": "uuid",
        "reward_type": "xp",
        "amount": 50,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "uuid",
        "bahagi_id": "uuid",
        "reward_type": "coins",
        "amount": 25,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

#### Update/Delete Specific Reward
- **Path**: `/api/teacher/reward/:rewardId`
- **PUT**: Update reward amount
  ```json
  Request Body:
  {
    "amount": 75
  }
  
  Response (200):
  {
    "reward": { ...updated reward object }
  }
  ```

- **DELETE**: Delete reward
  ```json
  Response (200):
  {
    "success": true,
    "message": "Reward deleted successfully"
  }
  ```

---

## Student API Endpoints

### 1. Lesson Progress

#### Mark Lesson Complete
- **Path**: `/api/student/lesson/:lessonId/complete`
- **POST**: Mark lesson as completed and earn rewards
  ```json
  Request Body:
  {
    "studentId": "uuid"
  }
  
  Response (200):
  {
    "progress": {
      "id": "uuid",
      "student_id": "uuid",
      "lesson_id": "uuid",
      "completed": true,
      "completion_date": "2024-01-15T10:30:00Z",
      "xp_earned": 50,
      "coins_earned": 25
    },
    "rewards": {
      "xp": 50,
      "coins": 25
    }
  }
  ```

#### Get Lesson Progress
- **Path**: `/api/student/lesson/:lessonId/complete?studentId=uuid`
- **GET**: Fetch student's progress on specific lesson
  ```json
  Response (200):
  {
    "progress": {
      "id": "uuid",
      "student_id": "uuid",
      "lesson_id": "uuid",
      "completed": true,
      "completion_date": "2024-01-15T10:30:00Z",
      "xp_earned": 50,
      "coins_earned": 25
    }
  }
  // Returns null if not completed
  ```

---

### 2. Assessment Submission

#### Submit Assessment
- **Path**: `/api/student/assessment/:assessmentId/submit`
- **POST**: Submit assessment response
  ```json
  Request Body:
  {
    "studentId": "uuid",
    "response": {
      "selectedOption": 1
    },
    "isCorrect": true
  }
  
  Response (201):
  {
    "response": {
      "id": "uuid",
      "student_id": "uuid",
      "assessment_id": "uuid",
      "response": {...},
      "is_correct": true,
      "completion_date": "2024-01-15T10:30:00Z"
    }
  }
  ```

#### Get Assessment Responses
- **Path**: `/api/student/assessment/:assessmentId/submit?studentId=uuid` (optional)
- **GET**: Fetch assessment responses
  ```json
  Response (200):
  {
    "responses": [
      {
        "id": "uuid",
        "student_id": "uuid",
        "assessment_id": "uuid",
        "response": {...},
        "is_correct": true,
        "completion_date": "2024-01-15T10:30:00Z"
      }
    ]
  }
  // If studentId provided, returns only that student's responses
  ```

---

### 3. Bahagi Progress

#### Get Student Progress on Bahagi
- **Path**: `/api/student/bahagi/:bahagiId/progress?studentId=uuid`
- **GET**: Fetch comprehensive progress stats
  ```json
  Response (200):
  {
    "bahagi": {
      "id": "uuid",
      "title": "Introduction to Math"
    },
    "progress": {
      "lessons": {
        "total": 5,
        "completed": 3,
        "completionPercentage": 60
      },
      "assessments": {
        "total": 3,
        "correct": 2
      },
      "rewards": {
        "totalXp": 150,
        "totalCoins": 75
      }
    }
  }
  ```

---

## Error Responses

All endpoints return standardized error responses:

```json
// 400 Bad Request
{
  "error": "Description of what field is missing or invalid"
}

// 404 Not Found
{
  "error": "[Resource] not found"
}

// 500 Internal Server Error
{
  "error": "Failed to [action]"
}
```

---

## Usage Examples

### Example: Creating a Complete Bahagi with Lessons and Assessments

```typescript
// 1. Create Bahagi
const bahagiRes = await fetch('/api/teacher/bahagi', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Numbers 1-10',
    yunit: 'Math Basics',
    image_url: 'https://example.com/image.jpg',
    description: 'Learn counting'
  })
});
const { bahagi } = await bahagiRes.json();

// 2. Create Lessons
const lessonRes = await fetch(`/api/teacher/bahagi/${bahagi.id}/lessons`, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Introduction',
    subtitle: 'Let\'s start counting',
    discussion: 'In this lesson...'
  })
});
const { lesson } = await lessonRes.json();

// 3. Create Assessment
const assessmentRes = await fetch(`/api/teacher/bahagi/${bahagi.id}/assessments`, {
  method: 'POST',
  body: JSON.stringify({
    type: 'multiple-choice',
    title: 'Count Quiz',
    content: {
      question: 'What comes after 5?',
      options: ['4', '6', '7'],
      correctAnswer: 1
    }
  })
});

// 4. Configure Rewards
await fetch(`/api/teacher/bahagi/${bahagi.id}/rewards`, {
  method: 'POST',
  body: JSON.stringify({
    reward_type: 'xp',
    amount: 50
  })
});

await fetch(`/api/teacher/bahagi/${bahagi.id}/rewards`, {
  method: 'POST',
  body: JSON.stringify({
    reward_type: 'coins',
    amount: 25
  })
});
```

### Example: Student Completing a Lesson

```typescript
// 1. Mark lesson as complete
const completeRes = await fetch(`/api/student/lesson/${lessonId}/complete`, {
  method: 'POST',
  body: JSON.stringify({
    studentId: 'student-uuid'
  })
});
const { rewards } = await completeRes.json();
console.log(`Earned ${rewards.xp} XP and ${rewards.coins} coins!`);

// 2. Submit assessment
const submitRes = await fetch(`/api/student/assessment/${assessmentId}/submit`, {
  method: 'POST',
  body: JSON.stringify({
    studentId: 'student-uuid',
    response: { selectedOption: 1 },
    isCorrect: true
  })
});

// 3. Get progress
const progressRes = await fetch(
  `/api/student/bahagi/${bahagiId}/progress?studentId=student-uuid`
);
const { progress } = await progressRes.json();
console.log(`Completed ${progress.lessons.completed}/${progress.lessons.total} lessons`);
```

---

## Database Schema Reference

See `scripts/create-bahagi-schema.sql` for complete schema with:
- `bahagi` - Course sections
- `lesson` - Individual lessons
- `bahagi_assessment` - Assessments
- `bahagi_reward` - Reward configuration
- `lesson_progress` - Student completion tracking
- `assessment_response` - Student submissions
