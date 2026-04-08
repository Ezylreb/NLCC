# 📋 Avatar System - Quick Reference

## Installation

```bash
npm run migrate:avatar
npm run migrate:avatar-shop
```

## Core Components

### Display Avatar
```tsx
import { AvatarDisplay } from '@/components/AvatarDisplay';

<AvatarDisplay studentId={id} size="md" />
```

### Customize Avatar
```tsx
import { AvatarCustomization } from '@/components/AvatarCustomization';

<AvatarCustomization studentId={id} onClose={() => {}} />
```

### Shop
```tsx
import { AvatarShop } from '@/components/AvatarShop';

<AvatarShop studentId={id} balance={points} />
```

## Hooks

```tsx
import { useAvatar } from '@/hooks/useAvatar';

const { avatar, updateAvatar, saveAvatar, loading } = useAvatar(studentId);
```

## API Quick Reference

### Get Avatar
```
GET /api/student/avatar?studentId=<uuid>
```

### Update Avatar
```
PUT /api/student/avatar
{ studentId, head_type, head_color, ... }
```

### Check Owned Items
```
GET /api/student/avatar-items?studentId=<uuid>
```

### Purchase Item
```
POST /api/student/avatar-items
{ studentId, itemId, cost }
```

## Database Queries

```sql
-- See all avatars
SELECT * FROM avatar_customization;

-- Check purchases
SELECT * FROM avatar_owned_items;

-- Get student's avatar
SELECT * FROM avatar_customization 
WHERE student_id = '<uuid>';

-- Get purchased items
SELECT * FROM avatar_owned_items 
WHERE student_id = '<uuid>';

-- Track spending
SELECT a.item_id, COUNT(*) as purchases
FROM avatar_owned_items a
GROUP BY item_id
ORDER BY purchases DESC;
```

## Admin Tasks

### Check System Health
```sql
SELECT COUNT(*) as total_avatars FROM avatar_customization;
SELECT COUNT(*) as total_purchases FROM avatar_owned_items;
SELECT COUNT(DISTINCT student_id) as active_students FROM avatar_customization;
```

### Top Purchased Items
```sql
SELECT item_id, COUNT(*) as times_purchased
FROM avatar_owned_items
GROUP BY item_id
ORDER BY times_purchased DESC
LIMIT 10;
```

### Student Breakdown
```sql
SELECT 
  u.full_name,
  COUNT(DISTINCT aoi.item_id) as items_owned,
  COUNT(aoi.id) as purchases
FROM users u
LEFT JOIN avatar_owned_items aoi ON u.id = aoi.student_id
GROUP BY u.id, u.full_name
ORDER BY purchases DESC;
```

## Configuration

### Customize Colors
Edit `colors` array in components.

### Add Shop Items
Add to `availableItems` array in `AvatarShop.tsx`:
```tsx
{
  id: 'unique_id',
  name: 'Item Name',
  type: 'hair|eyes|head|clothing|expression|accessory',
  value: 'value_to_store',
  color: '#HEX_VALUE', // optional
  cost: 100,
  description: 'Short description',
  locked: false
}
```

### Adjust Points System
Update costs in shop items array, or modify points earned in rewards system.

## Size Options
- `sm`: 16x20 (dashboard)
- `md`: 24x32 (profile)
- `lg`: 32x40 (detail view)

## Common Issues

| Issue | Solution |
|-------|----------|
| Avatar not saving | Check localStorage, verify API response |
| Points not deducting | Check student_rewards balance, verify transaction |
| Items not displaying | Verify avatar_owned_items table, check item_id |
| Load slow | Add indexes, optimize DB queries |

## Feature Toggles

Disable shop (keep customization):
```tsx
// Remove AvatarShop component from pages
```

Disable customization (keep display):
```tsx
// Remove AvatarCustomization component
// Keep only AvatarDisplay
```

## Monitor Performance

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN ('avatar_customization', 'avatar_owned_items')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Backup Database

```bash
# Backup avatar tables
pg_dump -t avatar_customization -t avatar_owned_items database_name > avatar_backup.sql

# Restore
psql database_name < avatar_backup.sql
```

## Troubleshoot Migrations

```bash
# Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('avatar_customization', 'avatar_owned_items');

# Re-run migrations
npm run migrate:avatar
npm run migrate:avatar-shop

# Check for errors
tail -f /var/log/postgresql/postgresql.log
```

## Test Data

```sql
-- Insert test avatar
INSERT INTO avatar_customization (student_id)
VALUES ('<student_uuid>')
ON CONFLICT (student_id) DO NOTHING;

-- Insert test purchase
INSERT INTO avatar_owned_items (student_id, item_id, purchased_at)
VALUES ('<student_uuid>', 'hair_long', NOW())
ON CONFLICT (student_id, item_id) DO NOTHING;
```

## File Locations

| File | Purpose |
|------|---------|
| `app/components/AvatarDisplay.tsx` | Display avatar |
| `app/components/AvatarCustomization.tsx` | Customize UI |
| `app/components/AvatarShop.tsx` | Shop UI |
| `app/hooks/useAvatar.ts` | State management |
| `app/api/student/avatar/route.ts` | Avatar API |
| `app/api/student/avatar-items/route.ts` | Shop API |
| `AVATAR_SYSTEM.md` | Full documentation |
| `AVATAR_INTEGRATION_GUIDE.md` | Setup guide |

## Useful Links

- 📖 Full Docs: `AVATAR_SYSTEM.md`
- 🚀 Setup Guide: `AVATAR_INTEGRATION_GUIDE.md`
- 📊 Summary: `AVATAR_SYSTEM_SUMMARY.md`

---

**Last Updated**: 2024
**Status**: Production Ready
