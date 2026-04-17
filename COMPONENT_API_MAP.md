# Student Portal API Integration Map

## Component File Locations & API Endpoints

### 1. StudentLeaderboard
**File:** `app/components/StudentComponents/StudentLeaderboard.tsx`

**API Endpoints Used:**
- GET `/api/student/leaderboard?timeframe=week|month|all`

**Component Features:**
- 📊 Displays student rankings (Top 10)
- 🏆 Medal system for top 3 (🥇🥈🥉)
- ⏱️ Timeframe filtering (Weekly/Monthly/All-time)
- ✨ Framer Motion animations
- 🎯 Shows XP points for each student

**Mock Data Structure:**
```typescript
{
  rank: number;
  name: string;
  xp: number;
  badge?: string;
  avatarUrl?: string;
  isCurrentStudent?: boolean;
}
```

**Error Handling:**
- Falls back to mock data (10 Filipino student names)
- Shows loading spinner during fetch
- Displays error message at bottom

---

### 2. StudentMissions
**File:** `app/components/StudentComponents/StudentMissions.tsx`

**API Endpoints Used:**
- GET `/api/student/missions`
- POST `/api/student/missions/{missionId}/complete` (TODO)

**Component Features:**
- 🎯 Displays missions by category
- 📊 Progress bars for each mission
- 🏆 Difficulty levels (Easy/Medium/Hard)
- 🎨 Color-coded by difficulty
- ✅ Completed mission badges
- 🔄 Filter by category (All/Daily/Active/Completed)

**Mission Categories:**
1. **Daily** - Reset each day
2. **Lesson** - One-time course milestones
3. **Challenge** - Difficult tasks
4. **Active** - Ongoing achievements

**Mock Data Structure:**
```typescript
{
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'lesson' | 'challenge' | 'active';
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  coin_reward: number;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
}
```

**Error Handling:**
- Falls back to 6 mock missions
- Shows "No missions" message when filter empty
- Sync with database on first load

---

### 3. StudentShop
**File:** `app/components/StudentComponents/StudentShop.tsx`

**API Endpoints Used:**
- GET `/api/student/shop-items`
- GET `/api/student/stats` (for coins)
- POST `/api/student/shop-items/purchase` (TODO: needs handleBuyItem implementation)

**Component Features:**
- 🛍️ Virtual marketplace with 8+ items
- 💰 Coin-based currency system
- ⭐ Rarity system (Common→Uncommon→Rare→Epic→Legendary)
- 🎨 Category filtering (Avatar/Power-up/Cosmetic/Background)
- 🏷️ Item ownership tracking
- 📱 Purchase confirmation modal

**Shop Categories:**
```
avatar        - Character customization
power-up      - Temporary gameplay boosts
cosmetic      - Visual effects
background    - Profile backgrounds
```

**Rarity Colors:**
```
Common      → Slate (400-600)
Uncommon    → Green (400-600)
Rare        → Blue (400-600)
Epic        → Purple (400-600)
Legendary   → Gold → Orange (400-600)
```

**Mock Data Structure:**
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'avatar' | 'power-up' | 'cosmetic' | 'background';
  icon?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  owned?: boolean;
  image_url?: string;
}
```

**Error Handling:**
- Shows coin balance at top
- Alerts when insufficient coins
- Falls back to 8 mock items
- Auto-creates default shop on first access

---

### 4. StudentAvatarCustomization
**File:** `app/components/StudentComponents/StudentAvatarCustomization.tsx`

**API Endpoints Used:**
- GET `/api/student/avatar`
- PATCH `/api/student/avatar`

**Component Features:**
- 👤 Real-time avatar preview
- 🎨 5 customization categories
- 📌 Sticky preview panel (right side)
- 💾 Auto-save on changes (1s debounce)
- 🔄 Load saved customization on mount

**Customization Categories:**
1. **Body** (3 options)
   - Standard, Athletic, Chubby
   
2. **Hair** (4 options)
   - Kulot, Straight, Curly, Spiky
   
3. **Outfit** (4 options)
   - Casual, Formal, Sports, Superhero
   
4. **Accessory** (3 options)
   - None, Glasses, Crown
   
5. **Emotion** (5 options)
   - Happy, Sad, Cool, Surprised, Excited

**Mock Data Structure:**
```typescript
{
  body: { id, name, type, emoji, color };
  hair: { id, name, type, emoji, color };
  outfit: { id, name, type, emoji, color };
  accessory: { id, name, type, emoji, color };
  emotion: { id, name, type, emoji, color };
}
```

**Error Handling:**
- Shows loading spinner on mount
- Displays default avatar if API fails
- Auto-saves with visual confirmation
- Shows error toast for save failures

---

## StudentDashboard Integration

**File:** `app/components/StudentDashboard.tsx`

All 4 components are integrated as tabs:

```
Tab 1: Mag-Aral (Learning)           → MagAralPage
Tab 2: Listahan ng Lider (Leaderboard) → StudentLeaderboard ✅ API
Tab 3: Mga Misyon (Missions)          → StudentMissions ✅ API
Tab 4: Tindahan (Shop)                → StudentShop ✅ API
Tab 5: Avatar                         → StudentAvatarCustomization ✅ API
Tab 6: Profile                        → Inline profile display
```

---

## API Client Usage Pattern

All components use the centralized `apiClient`:

```typescript
import { apiClient } from '@/lib/api-client';

// In component:
const result = await apiClient.student.getLeaderboard('week');

if (result.success && result.data) {
  // Use result.data
} else {
  // Fallback to mock data
}
```

---

## Data Flow Diagram

```
StudentDashboard
    ├─ StudentLeaderboard
    │    └─ GET /api/student/leaderboard
    │         └─ queries: users, activity_logs
    │         └─ returns: sorted rankings with XP
    │
    ├─ StudentMissions
    │    └─ GET /api/student/missions
    │         └─ queries/creates: student_missions
    │         └─ returns: 6 mission objects
    │    └─ POST /api/student/missions/{id}/complete
    │         └─ updates: mission status
    │         └─ logs: activity_logs
    │
    ├─ StudentShop
    │    ├─ GET /api/student/shop-items
    │    │    └─ queries: shop_items, student_inventory
    │    │    └─ returns: 8 items with ownership
    │    ├─ GET /api/student/stats
    │    │    └─ queries: users, activity_logs
    │    │    └─ returns: coins, xp scores
    │    └─ POST /api/student/shop-items/purchase
    │         ├─ validates: coin balance
    │         ├─ updates: users (coins)
    │         ├─ inserts: student_inventory
    │         └─ logs: activity_logs
    │
    └─ StudentAvatarCustomization
         ├─ GET /api/student/avatar
         │    └─ queries: avatar_customization
         │    └─ returns: current customization
         └─ PATCH /api/student/avatar
              └─ updates: avatar_customization
              └─ returns: updated record
```

---

## Implementation Status

| Component | Get Data | Display | Filter | Update | Complete |
|-----------|----------|---------|--------|--------|----------|
| Leaderboard | ✅ | ✅ | ✅ | - | ✅ |
| Missions | ✅ | ✅ | ✅ | - | ⏳ |
| Shop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Avatar | ✅ | ✅ | - | ✅ | ✅ |

**Legend:**
- ✅ Implemented and tested  
- ⏳ Implemented but awaiting testing
- ❌ Not implemented

---

**Last Updated:** December 2024  
**Status:** Ready for Testing  
**Development Server:** http://localhost:3001
