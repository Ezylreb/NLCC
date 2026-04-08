# 🔧 How to Set Up Supabase Storage for Image Upload

## Problem
When trying to upload an image in the Create Bahagi form, you see:
```
The 'lesson-images' bucket is not properly set up. 
Please ensure it exists and is PUBLIC in your Supabase dashboard.
```

## Solution: 4 Easy Steps

### Step 1: Open Supabase Console
Go to your Supabase dashboard storage page:
```
https://jzuzdycorgdugpbidzyg.supabase.co/project/_/storage/buckets
```

### Step 2: Delete Existing Bucket (if needed)
- If you see "lesson-images" bucket but it's not public:
  - Click on it
  - Click the menu ⋮ (three dots)
  - Click "Delete bucket"
  - Confirm deletion

### Step 3: Create New Public Bucket
1. Click **"New bucket"** button (top right)
2. Fill in the form:
   - **Name**: `lesson-images`
   - **Visibility**: Select **"Public"** (THIS IS IMPORTANT!)
3. Click **"Create bucket"**

### Step 4: Verify & Test
After creating the bucket, the app should automatically work. If it doesn't:
1. Go back to the app (refresh the page)
2. Try uploading an image again
3. It should succeed! ✅

## Advanced: Configure CORS (if needed)

If uploads still fail after making the bucket public:

1. In Supabase, go to **Settings** > **Storage**
2. Look for **CORS** configuration
3. Add this configuration:
```json
[
  {
    "origin": ["http://localhost:3000", "https://yourapp.com"],
    "methods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "allowedHeaders": ["*"],
    "credentials": true
  }
]
```

## Troubleshooting

### ❌ Still getting "Bucket not found"
- Make sure the bucket name is exactly: `lesson-images` (lowercase, no spaces)
- Make sure it's set to **PUBLIC** not private
- Refresh the browser after creating the bucket

### ❌ "Upload permission denied" (401)
- The bucket might not be public
- Go back to Step 3 and verify the bucket is set to PUBLIC

### ❌ "File too large"
- Image must be under 5MB

## Quick Verification

Run this command to test if setup is correct:
```bash
node scripts/setup-supabase-storage.mjs
```

Expected output:
```
✅ Bucket "lesson-images" exists and is accessible
🧪 Testing upload permissions...
✅ Upload successful!
```

## Video Guide (Optional)

To create a public bucket in Supabase:
1. Storage tab → New bucket
2. Name it `lesson-images`
3. Check "Public bucket" checkbox
4. Create!

That's it! 🎉
