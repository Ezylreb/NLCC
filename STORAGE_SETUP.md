# Supabase Storage Setup Guide

## Problem: "Bucket not found" Error

When uploading images in the Create Bahagi form, you may see:
```
Storage bucket not configured
The 'lesson-images' bucket is not properly set up. Please ensure it exists and is PUBLIC in your Supabase dashboard.
```

## Solution: Configure the Storage Bucket

### Step 1: Open Supabase Dashboard
Visit your Supabase project storage page:
```
https://jzuzdycorgdugpbidzyg.supabase.co/project/_/storage/buckets
```

### Step 2: Create the "lesson-images" Bucket
If the bucket doesn't exist:
1. Click "New bucket" button (top right)
2. Name: `lesson-images`
3. **IMPORTANT**: Check the "Public bucket" checkbox
4. Click "Create bucket"

### Step 3: Verify Bucket Permissions
If the bucket exists but uploads fail:
1. Click on the "lesson-images" bucket
2. Go to "Policies" tab
3. Ensure there's a policy allowing public read/write access

### Step 4: Test Upload
Run the diagnostic script:
```bash
node scripts/setup-supabase-storage.mjs
```

Expected output:
```
✅ Bucket "lesson-images" exists and is accessible
🧪 Testing upload permissions...
✅ Upload successful!
🔗 Public URL: https://...
```

## Troubleshooting

### "Upload failed: Bucket not found"
- The bucket exists but upload permissions are missing
- **Fix**: Make sure the bucket is set to **PUBLIC** in Supabase console

### "Upload permission denied" (401)
- The anon key doesn't have upload permissions
- **Fix**: Check bucket policies allow public uploads

### Still not working?
Try these steps in Supabase console:
1. Go to Storage > Buckets
2. Find "lesson-images" 
3. Delete and recreate it as PUBLIC
4. Save changes
5. Refresh the app and try again

## Environment Variables

Ensure `.env.local` has these variables:
```
NEXT_PUBLIC_SUPABASE_URL="https://jzuzdycorgdugpbidzyg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Both are required for image uploads to work.
