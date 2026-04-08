# 🚀 Avatar System Integration Guide

Quick steps to integrate the avatar system into your NLCC application.

## Step 1: Run Migrations

```bash
# Install dependencies (if needed)
npm install framer-motion

# Run migrations to create database tables
npm run migrate:avatar
npm run migrate:avatar-shop
```

## Step 2: Add to Student Profile

Update your student profile page to include the avatar system:

```tsx
// app/student/profile/page.tsx
import { StudentProfileWithAvatar } from '@/components/StudentProfileWithAvatar';

export default function StudentProfilePage() {
  const { userId } = useAuth(); // Your auth hook
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <StudentProfileWithAvatar studentId={userId} />
    </main>
  );
}
```

## Step 3: Display Avatar in Dashboard

Add small avatar displays in your dashboard:

```tsx
// app/components/StudentCard.tsx
import { AvatarDisplay } from '@/components/AvatarDisplay';

export function StudentCard({ studentId, name }) {
  return (
    <div className="p-4 rounded-lg bg-white/10">
      <AvatarDisplay studentId={studentId} size="sm" />
      <h3>{name}</h3>
    </div>
  );
}
```

## Step 4: Add Shop Page

Create a dedicated shop page:

```tsx
// app/shop/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { AvatarShop } from '@/components/AvatarShop';
import { useEffect, useState } from 'react';

export default function ShopPage() {
  const { userId } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch(`/api/student/rewards?studentId=${userId}`)
      .then(r => r.json())
      .then(d => setBalance(d.total_points || 0));
  }, [userId]);

  return (
    <main>
      <AvatarShop studentId={userId} balance={balance} />
    </main>
  );
}
```

## Step 5: Update package.json

Add migration scripts:

```json
{
  "scripts": {
    "migrate:avatar": "node scripts/migrate-avatar-customization.mjs",
    "migrate:avatar-shop": "node scripts/migrate-avatar-shop.mjs",
    "migrate:all-avatar": "npm run migrate:avatar && npm run migrate:avatar-shop"
  }
}
```

## Step 6: Add to Navigation

Update your navigation to link to the shop:

```tsx
<nav>
  {/* ... other links ... */}
  <Link href="/shop">
    <span>🛍️ Avatar Shop</span>
  </Link>
  <Link href="/profile">
    <span>👤 Profile</span>
  </Link>
</nav>
```

## Components Overview

### AvatarDisplay
Shows the avatar in 3 sizes:
```tsx
<AvatarDisplay 
  studentId={userId}
  size="md"  // 'sm' | 'md' | 'lg'
  clickable
  onAvatarClick={() => handleClick()}
/>
```

### AvatarCustomization
Modal for customizing avatar:
```tsx
<AvatarCustomization 
  studentId={userId}
  onClose={() => setShowModal(false)}
/>
```

### AvatarShop
Shop interface for purchasing items:
```tsx
<AvatarShop 
  studentId={userId}
  balance={rewardPoints}
  onPurchase={(item) => console.log('Purchased:', item)}
/>
```

### StudentProfileWithAvatar
Complete profile with all avatar features:
```tsx
<StudentProfileWithAvatar studentId={userId} />
```

## Hooks Overview

### useAvatar
State management for avatar:
```tsx
const { 
  avatar,           // Current avatar object
  loading,          // Loading state
  error,            // Error message
  updateAvatar,     // Update local state
  saveAvatar,       // Save to server
  resetAvatar       // Reset to default
} = useAvatar(studentId);
```

## API Endpoints

All endpoints ready to use:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/student/avatar?studentId=<id>` | Get avatar |
| PUT | `/api/student/avatar` | Update avatar |
| GET | `/api/student/avatar-items?studentId=<id>` | Get owned items |
| POST | `/api/student/avatar-items` | Purchase item |
| GET | `/api/student/rewards?studentId=<id>` | Get point balance |

## Database Checks

Verify everything is working:

```sql
-- Check avatar table
SELECT COUNT(*) FROM avatar_customization;

-- Check owned items
SELECT COUNT(*) FROM avatar_owned_items;

-- Check a student's avatar
SELECT * FROM avatar_customization WHERE student_id = '<student_uuid>';

-- Check purchases
SELECT * FROM avatar_owned_items WHERE student_id = '<student_uuid>';
```

## Styling Customization

The system uses Tailwind CSS and custom `brand-purple` color:

Update `tailwind.config.ts`:
```ts
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-purple': '#9333EA',
      }
    }
  }
}
```

Or modify component classes directly for different theming.

## Troubleshooting

### Migrations not running?
```bash
# Check node version
node --version  # Should be 14+

# Run with explicit path
node ./scripts/migrate-avatar-customization.mjs
```

### Components not loading?
```bash
# Ensure framer-motion is installed
npm install framer-motion

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Avatar not saving?
1. Check browser console for errors
2. Verify NEXT_PUBLIC_SUPABASE_URL is set
3. Check database connection in `/lib/db.ts`
4. Verify student_id UUID format

### Points not working?
1. Ensure `student_rewards` table has balance
2. Check `reward_transactions` table exists
3. Verify transaction hooks are working

## Next Steps

1. **Test everything**: Create a test student and purchase items
2. **Customize colors**: Update component colors to match your branding
3. **Add animations**: Enhance with additional Framer Motion effects
4. **Create admin panel**: Add item management dashboard
5. **Analytics**: Track popular items and spending patterns

## Support

For issues or questions:
1. Check the error messages in browser console
2. Review database migration logs
3. Verify API response in Network tab
4. Check server logs for backend errors

## Security Reminder

- Students can only modify their own avatars
- Point balance validated before purchase
- Transactions logged for audit trail
- XSS protection via React sanitization
