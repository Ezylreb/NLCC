# 🎨 Avatar Customization System

A comprehensive avatar customization and shop system for NLCC students. Students can customize their 2D character avatars and purchase items using earned rewards points.

## Features

### 1. **Avatar Customization**
- **Head Shape**: Round, Square, Oval, Heart
- **Head Color**: 8+ colors to choose from
- **Hairstyles**: Short, Long, Curly, Straight, Afro
- **Hair Color**: Multiple colors including special effects
- **Eyes**: Round, Oval, Cat, Sparkle
- **Expression/Mouth**: Smile, Grin, Neutral, Wow
- **Body Color**: Customizable body color
- **Outfit**: Shirt, Dress, T-Shirt, Hoodie
- **Clothing Color**: Coordinated with body

### 2. **Avatar Shop**
- **Shop Items**: 20+ purchasable customization items
- **Points System**: Earn points through lessons, convert to items
- **Rarity Levels**: Common, Special, Rare items
- **Item Categories**: Hair, Eyes, Head, Clothing, Expression, Accessories
- **Purchase History**: Track owned items

### 3. **Avatar Display**
- **Responsive Sizes**: Small (dashboard), Medium (profile), Large (detail)
- **Live Preview**: See changes in real-time
- **Animated Display**: Smooth transitions and hover effects
- **Profile Integration**: Avatars displayed across the platform

## 📁 File Structure

```
app/
  ├── components/
  │   ├── AvatarCustomization.tsx      # Main customization UI
  │   ├── AvatarDisplay.tsx             # Avatar render component
  │   └── AvatarShop.tsx                # Shop UI with purchases
  ├── api/
  │   └── student/
  │       ├── avatar/route.ts           # GET/PUT avatar data
  │       └── avatar-items/route.ts     # GET/POST shop items
  └── hooks/
      └── useAvatar.ts                  # Avatar state hook
scripts/
  ├── create-avatar-customization.sql   # Schema for avatars
  ├── create-avatar-shop.sql            # Schema for shop
  ├── migrate-avatar-customization.mjs  # Run customization migration
  └── migrate-avatar-shop.mjs           # Run shop migration
```

## 🗄️ Database Schema

### `avatar_customization` Table
```sql
- id (PK)
- student_id (FK, UNIQUE) → users.id
- head_type, head_color
- eyes_type
- mouth_type
- hair_type, hair_color
- body_color
- clothing_type, clothing_color
- accessories (JSON)
- created_at, updated_at
```

### `avatar_owned_items` Table
```sql
- id (PK)
- student_id (FK) → users.id
- item_id (VARCHAR)
- purchased_at
- UNIQUE(student_id, item_id)
```

## 🚀 Setup Instructions

### 1. Run Migrations
```bash
# Create avatar customization tables
npm run migrate:avatar

# Create avatar shop tables
npm run migrate:avatar-shop

# Or run both
node scripts/migrate-avatar-customization.mjs
node scripts/migrate-avatar-shop.mjs
```

### 2. Add to package.json
```json
{
  "scripts": {
    "migrate:avatar": "node scripts/migrate-avatar-customization.mjs",
    "migrate:avatar-shop": "node scripts/migrate-avatar-shop.mjs"
  }
}
```

## 💻 Component Usage

### Display Avatar
```tsx
import { AvatarDisplay } from '@/components/AvatarDisplay';

export default function Profile() {
  return (
    <AvatarDisplay 
      studentId={userId} 
      size="lg"
      clickable
      onAvatarClick={() => setShowCustomizer(true)}
    />
  );
}
```

### Avatar Customization Modal
```tsx
import { AvatarCustomization } from '@/components/AvatarCustomization';

export default function ProfilePage() {
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <>
      <AvatarDisplay studentId={userId} clickable onAvatarClick={() => setShowCustomizer(true)} />
      {showCustomizer && (
        <AvatarCustomization 
          studentId={userId}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </>
  );
}
```

### Avatar Shop
```tsx
import { AvatarShop } from '@/components/AvatarShop';

export default function ShopPage() {
  return (
    <AvatarShop 
      studentId={userId}
      balance={userRewards}
      onPurchase={(item) => console.log('Purchased:', item)}
    />
  );
}
```

### Using the Hook
```tsx
import { useAvatar } from '@/hooks/useAvatar';

export function MyComponent() {
  const { avatar, updateAvatar, saveAvatar, loading } = useAvatar(studentId);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => updateAvatar({ head_color: '#FF6B6B' })}>
        Change Color
      </button>
      <button onClick={saveAvatar}>Save</button>
    </div>
  );
}
```

## 🎮 Shop Items

### Common Items (50-100 points)
- Hair colors (Golden, Silver, Auburn)
- Eye types (Cat, Sparkle)
- Expressions (Grin, Surprised)

### Special Items (75-150 points)
- Hairstyles (Long, Curly, Afro)
- Skin tones (Blue, Green, Purple)
- Outfits (Dress, Hoodie, T-Shirt)

### Rare Items (250-500 points)
- 🌈 Rainbow Hair (500pts)
- ✨ Golden Body (250pts)
- 💎 Cosmic Outfit (300pts)

## 🔌 API Endpoints

### Get Avatar
```
GET /api/student/avatar?studentId=<uuid>
Response: Avatar customization object
```

### Update Avatar
```
PUT /api/student/avatar
Body: { studentId, head_type, head_color, ... }
Response: Updated avatar object
```

### Get Owned Items
```
GET /api/student/avatar-items?studentId=<uuid>
Response: { items: ['item_id1', 'item_id2', ...] }
```

### Purchase Item
```
POST /api/student/avatar-items
Body: { studentId, itemId, cost }
Response: Purchase confirmation
```

## 🎨 Customization Options

### Head Types
- **round**: Classic circular head
- **square**: Angular, modern look
- **oval**: Elongated, sleek appearance
- **heart**: Sweet, charming look

### Hair Types
- **short**: Neat and tidy
- **long**: Elegant and flowing
- **curly**: Bouncy and voluminous
- **straight**: Sleek and smooth
- **afro**: Classic and voluminous

### Eyes
- **round**: Classic round eyes
- **oval**: Elongated eyes
- **cat**: Slanted, mysterious
- **sparkle**: Magical, special effect

### Expressions
- **smile**: Happy, friendly
- **grin**: Very happy, excited
- **neutral**: Calm, composed
- **wow**: Amazed, surprised

## 💰 Points System Integration

Avatars integrate with the rewards system:
- Students earn points through lesson completion
- Points can be converted to avatar items
- Purchases are tracked in `reward_transactions`
- Default items are unlocked (no cost)
- Shop refresh items weekly for variety

## 🔐 Security Considerations

- Student can only modify their own avatar
- Purchases validated against account balance
- Transaction history tracked for audit
- Owned items verified before use
- XSS protection through React sanitization

## 🐛 Troubleshooting

### Avatar Not Loading
1. Check studentId is valid UUID
2. Verify user exists in database
3. Check avatar_customization table exists

### Points Not Deducting
1. Verify student_rewards table has balance
2. Check reward_transactions table
3. Ensure transaction hook is working

### Items Not Displaying
1. Check avatar_owned_items table for records
2. Verify item_id matches shop items
3. Clear browser cache

## 📊 Analytics

Track avatar system usage:
- Most popular customizations
- Shop item sales
- Average points spent
- Avatar diversity metrics

## 🚀 Future Enhancements

- [ ] Avatar animations/emotes
- [ ] Trading system between students
- [ ] Limited-time seasonal items
- [ ] Achievement-based unlocks
- [ ] 3D avatar support
- [ ] Avatar naming system
- [ ] Social avatar showcase
- [ ] Reaction/interaction system

## 📝 Notes

- All colors use hex format (#RRGGBB)
- Default avatar uses neutral colors
- Shop items are pre-defined (no user-created items)
- Avatars persist across sessions
- Real-time preview during customization
