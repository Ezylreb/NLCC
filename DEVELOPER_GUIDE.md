# Developer Guide - New Architecture

## 🎯 **Architecture Overview for Developers**

The new architecture follows **clean code principles** with distinct separation of concerns:

```
User Request
    ↓
API Route Handler (app/api/rest/[endpoint])
    ↓
Service Layer (lib/services/)
    ↓
Repository Layer (lib/database/repository)
    ↓
Database (PostgreSQL)
    ↓
Event System (lib/events/)
    ↓
Async Processing (doesn't block response)
```

---

## 📦 **Using Services**

### **Pattern 1: Query Data**

```typescript
import { BahagiService } from '@/lib/services';

// Get all bahagis for teacher
const bahagis = await BahagiService.listByTeacher(teacherId, className);

// Get specific bahagi
const bahagi = await BahagiService.getById(bahagiId);
```

### **Pattern 2: Modify Data**

```typescript
// Create
const newBahagi = await BahagiService.create({
  title: 'New Course',
  teacher_id: teacherId,
  yunit: 'Unit Name'
});

// Update
const updated = await BahagiService.update(bahagiId, {
  title: 'Updated Title',
  is_published: true
});

// Archive (soft delete)
await BahagiService.archive(bahagiId);

// Restore
await BahagiService.restore(bahagiId);

// Delete permanently
await BahagiService.delete(bahagiId);
```

### **Pattern 3: Validate Data**

```typescript
const validation = BahagiService.validateCreateData(formData);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

const bahagi = await BahagiService.create(formData);
```

### **Pattern 4: Answer Validation**

```typescript
import { AssessmentService } from '@/lib/services';

// Get assessment
const assessment = await AssessmentService.getById(assessmentId);

// Validate student's answer
const validation = await AssessmentService.validateAnswer(
  assessment,
  studentAnswer  // Can be string, array, object depending on type
);

console.log({
  isCorrect: validation.isCorrect,        // boolean
  pointsEarned: validation.pointsEarned,  // number
  feedback: validation.feedback,          // string (auto-generated)
  correctAnswer: validation.correctAnswer, // varies by type
  partialCredit: validation.partialCredit // boolean
});

// Save answer
const saved = await AssessmentService.saveAnswer(
  yunitId,
  assessmentId,
  studentId,
  assessment,
  studentAnswer,
  attemptNumber
);
```

### **Pattern 5: Event-Driven Processing**

```typescript
import { eventBus, EventType } from '@/lib/events';

// Emit event (don't await unless you need sync processing)
eventBus.emit({
  type: EventType.ASSESSMENT_SUBMITTED,
  timestamp: new Date(),
  userId: studentId,
  assessmentId,
  studentId,
  yunitId,
  isCorrect: true,
  pointsEarned: 50,
  attemptNumber: 1,
  assessmentType: 'multiple-choice'
});

// Event handlers process asynchronously:
// - RewardCalculationHandler: Awards XP, checks milestones
// - AchievementUnlockedHandler: Awards trophies
// - TrophyEarnedHandler: Updates leaderboard
```

### **Pattern 6: Get Analytics**

```typescript
import { AnalyticsService } from '@/lib/services';

// Student performance
const perf = await AnalyticsService.getStudentPerformance(studentId);
// Returns: { totalAssessments, correctAnswers, averageScore, masteryPercentage, recentActivity }

// Class statistics
const stats = await AnalyticsService.getClassStatistics(className);
// Returns: { totalStudents, averageMastery, topPerformer, lowPerformer, recentSubmissions }

// Assignment analytics
const analytics = await AnalyticsService.getAssignmentAnalytics(assessmentId);
// Returns: { totalSubmissions, correctSubmissions, successRate, averageScore, ... }

// Leaderboard
const leaderboard = await AnalyticsService.getLeaderboard(limit);
// Returns: Array of { student_id, total_xp, total_rewards }

// Student's rank
const rank = await AnalyticsService.getStudentRank(studentId);
```

### **Pattern 7: Rewards & Achievements**

```typescript
import { GamificationService } from '@/lib/services';

// Award reward
await GamificationService.awardReward({
  studentId,
  assessmentId,
  yunitId,
  xpEarned: 50,
  coinsEarned: 5,
  reason: 'assessment-correct',
  metadata: { source: 'quiz' }
});

// Get totals
const totals = await GamificationService.getStudentTotals(studentId);
// Returns: { totalXp, totalCoins }

// Get recent
const recent = await GamificationService.getRecentRewards(studentId, limit);

// Award trophy
const trophy = await GamificationService.awardTrophy({
  studentId,
  trophyType: 'first_lesson',
  title: 'First Flight',
  icon: '🎯'
});

// Get student's trophies
const trophies = await GamificationService.getStudentTrophies(studentId);
```

---

## 🗄️ **Direct Repository Access**

For advanced use cases, access repositories directly:

```typescript
import { repositories } from '@/lib/database';

// Create
const bahagi = await repositories.bahagi.create({
  title: 'Title',
  teacher_id: 'uid',
  is_published: false,
  is_archived: false
});

// Find by ID
const found = await repositories.bahagi.findById(id);

// Find all with filters
const all = await repositories.bahagi.findAll({
  where: { teacher_id: uid, class_name: 'Grade 1' },
  orderBy: 'created_at DESC',
  limit: 10,
  offset: 0
});

// Count
const count = await repositories.bahagi.count({ teacher_id: uid });

// Update
const updated = await repositories.bahagi.update(id, { is_published: true });

// Delete (soft)
await repositories.bahagi.delete(id, true);

// Delete (hard)
await repositories.bahagi.delete(id, false);

// Raw SQL query
const results = await repositories.bahagi.raw(
  'SELECT COUNT(*) as count FROM bahagi WHERE teacher_id = $1',
  [teacherId]
);
```

---

## 🔌 **API Endpoint Pattern**

Every endpoint follows this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import SomeService from '@/lib/services/SomeService';

// POST - Create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const validation = SomeService.validateCreateData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Create
    const result = await SomeService.create(body);

    // Emit event if needed
    // await eventBus.emit(...);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/rest/endpoint]', error);
    return NextResponse.json(
      { error: 'Failed to create', detail: error.message },
      { status: 500 }
    );
  }
}

// GET - Read
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    if (!param) {
      return NextResponse.json(
        { error: 'Parameter required' },
        { status: 400 }
      );
    }

    const results = await SomeService.list(param);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('[GET /api/rest/endpoint]', error);
    return NextResponse.json(
      { error: 'Failed to fetch', detail: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    const result = await SomeService.update(id, body);

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[PATCH /api/rest/endpoint]', error);
    return NextResponse.json(
      { error: 'Failed to update', detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete/Archive
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const result = permanent
      ? await SomeService.delete(id)
      : await SomeService.archive(id);

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Deleted' : 'Archived'
    });
  } catch (error: any) {
    console.error('[DELETE /api/rest/endpoint]', error);
    return NextResponse.json(
      { error: 'Failed to delete', detail: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🛠️ **Creating a New Feature**

### **Step 1: Update Database** (if needed)
```sql
ALTER TABLE some_table ADD COLUMN new_column VARCHAR(255);
```

### **Step 2: Update Types**
```typescript
// lib/database/types.ts
export interface SomeEntity {
  id: string;
  /// ... existing fields
  new_field?: string;
  created_at: Date;
  updated_at: Date;
}
```

### **Step 3: Create Service Method**
```typescript
// lib/services/SomeService.ts
export class SomeService {
  static async doNewThing(data: any): Promise<Result> {
    // Validate
    // Business logic
    // Call repository
    // Emit event if needed
    // Return result
  }
}
```

### **Step 4: Create API Endpoint**
```typescript
// app/api/rest/new-endpoint/route.ts
export async function POST(request: NextRequest) {
  // Parse → Validate → Call Service → Return
}
```

### **Step 5: Update Frontend**
```typescript
const res = await fetch('/api/rest/new-endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

---

## 🧪 **Testing**

### **Unit Test Template**
```typescript
import { SomeService } from '@/lib/services';

describe('SomeService', () => {
  it('creates resource', async () => {
    const result = await SomeService.create({ /* data */ });
    expect(result.id).toBeDefined();
  });

  it('validates data', () => {
    const validation = SomeService.validateCreateData({});
    expect(validation.valid).toBe(false);
  });
});
```

### **Integration Test Template**
```typescript
import { repositories } from '@/lib/database';

describe('Integration', () => {
  it('creates and retrieves', async () => {
    const created = await repositories.table.create({ /* data */ });
    const found = await repositories.table.findById(created.id);
    expect(found).toEqual(created);
  });
});
```

---

## 📊 **Monitoring & Debugging**

### **Check Event Queue**
```typescript
import { eventBus } from '@/lib/events';

console.log('Events in queue:', eventBus.getQueueSize());
```

### **Check Database Connection**
```typescript
import { db } from '@/lib/database';

const isHealthy = await db.healthCheck();
console.log('DB healthy:', isHealthy);
```

### **View Repositories**
```typescript
import { repositories } from '@/lib/database';

// Available repositories:
// - repositories.bahagi
// - repositories.lesson
// - repositories.assessment
// - repositories.answer
// - repositories.reward
// - repositories.trophy
// - repositories.user
// - repositories.preferences
```

---

## 🚀 **Best Practices**

1. **Always validate input** in services before database operations
2. **Use services, not repositories** directly in API endpoints
3. **Emit events** for operations that trigger multiple side effects
4. **Return consistent response format** from all endpoints
5. **Log errors with context** (endpoint, operation, error details)
6. **Catch and handle errors gracefully** to prevent 500 errors
7. **Use transactions** for multi-step operations affecting multiple tables
8. **Add JSDoc comments** to all public methods
9. **Test both happy path and error cases**
10. **Monitor event processing** for stuck or failed events

---

**Happy coding! 🎉**
