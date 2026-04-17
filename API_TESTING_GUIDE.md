# API Integration Quick Reference

## How to Test the APIs Locally

### 1. Using the Browser (Easiest)
```
1. Navigate to http://localhost:3001
2. Login as a student
3. Click on StudentDashboard tabs:
   - Listahan ng Lider (Leaderboard)
   - Mga Misyon (Missions)
   - Tindahan (Shop)
   - Avatar (Customization)
```

### 2. Using cURL/Postman
```bash
# Get Leaderboard
curl -X GET "http://localhost:3001/api/student/leaderboard?timeframe=week" \
  -H "x-student-id: your-student-id"

# Get Missions
curl -X GET "http://localhost:3001/api/student/missions" \
  -H "x-student-id: your-student-id"

# Get Shop Items
curl -X GET "http://localhost:3001/api/student/shop-items" \
  -H "x-student-id: your-student-id"

# Purchase Item
curl -X POST "http://localhost:3001/api/student/shop-items/purchase" \
  -H "x-student-id: your-student-id" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "1", "quantity": 1}'

# Get Student Stats
curl -X GET "http://localhost:3001/api/student/stats" \
  -H "x-student-id: your-student-id"
```

## API Response Examples

### Leaderboard Response
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": "student-123",
      "name": "Maria Santos",
      "xp": 4850,
      "badge": "🥇",
      "avatarUrl": null,
      "isCurrentStudent": false
    }
  ],
  "timeframe": "week"
}
```

### Missions Response
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "student_id": "student-456",
      "title": "Taposing ang 3 Leksyon",
      "description": "Kumpletuhin ang 3 bahagi ng araw-araw na leksyon",
      "category": "daily",
      "difficulty": "easy",
      "xp_reward": 250,
      "coin_reward": 50,
      "progress": 2,
      "target": 3,
      "completed": false,
      "expires_at": "2024-12-20T10:00:00Z"
    }
  ]
}
```

### Shop Items Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Purple Hair",
      "category": "avatar",
      "rarity": "common",
      "price": 150,
      "description": "Gawing purpre ang buhok mo",
      "image_url": "/shop-items/purple-hair.png",
      "owned": false
    }
  ]
}
```

## Database Tables Required

### 1. student_missions
```sql
CREATE TABLE student_missions (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(20),
  difficulty VARCHAR(10),
  xp_reward INT DEFAULT 100,
  coin_reward INT DEFAULT 20,
  progress INT DEFAULT 0,
  target INT DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. shop_items
```sql
CREATE TABLE shop_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(20),
  rarity VARCHAR(20),
  price INT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. student_inventory
```sql
CREATE TABLE student_inventory (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL,
  item_id BIGINT NOT NULL,
  quantity INT DEFAULT 1,
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

### 4. activity_logs (already exists, needs columns)
```sql
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 0;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS coins_earned INT DEFAULT 0;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS coins_spent INT DEFAULT 0;
```

## Component Event Flow

### StudentLeaderboard
```
Load → Fetch /api/student/leaderboard?timeframe=week
         ↓
      Display rankings with animations
         ↓
      User changes timeframe → Refetch with new timeframe
```

### StudentMissions
```
Load → Fetch /api/student/missions
         ↓
      Display missions with progress bars
         ↓
      User clicks filter → Filter locally
         ↓
      TODO: Complete mission button → POST to /api/student/missions/{id}/complete
```

### StudentShop
```
Load → Fetch /api/student/shop-items + /api/student/stats
         ↓
      Display items with coin balance
         ↓
      User selects item → Show purchase modal
         ↓
      User confirms → POST to /api/student/shop-items/purchase
         ↓
      Deduct coins → Update inventory
```

### StudentAvatarCustomization
```
Load → Fetch /api/student/avatar
         ↓
      Display current customization
         ↓
      User selects option → Update preview
         ↓
      Auto-save (1s debounce) → PATCH to /api/student/avatar
         ↓
      Display confirmation
```

## Troubleshooting

### Issue: "Student ID is required" error
**Solution:** Make sure you're logged in and the `x-student-id` header is being sent by the API client

### Issue: "Showing mock data" message
**Solution:** Check browser console for error details, check if Supabase connection is working

### Issue: Coins not deducting
**Solution:** Check if Supabase `users` table has a `coins` column (should be auto-managed)

### Issue: Shop items missing
**Solution:** First access to shop endpoint creates 8 default items. Check if `shop_items` table has data

## API Methods in StudentService

```typescript
// In lib/api-client.ts, access via:
const apiClient = new APIClient();
apiClient.student.getLeaderboard('week');
apiClient.student.getMissions();
apiClient.student.getShopItems();
apiClient.student.purchaseItem('1', 1);
apiClient.student.getAvatarCustomization();
apiClient.student.saveAvatarCustomization({...});
apiClient.student.completeMission('123');
apiClient.student.getStats();
```

---

**Development Server:** http://localhost:3001
**API Base URL:** http://localhost:3001/api
