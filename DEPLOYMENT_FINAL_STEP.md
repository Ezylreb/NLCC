# Final Deployment Step: Supabase Storage Bucket Setup

## Overview
Only ONE step remains before production deployment: creating the Supabase storage bucket for media uploads.

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Impact:** Enables media file uploads (images, audio, videos) for assessments

---

## Prerequisites
- ✅ Supabase account access
- ✅ Project created and running
- ✅ Supabase credentials configured in `.env.local`

---

## Step-by-Step Setup

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with your credentials
3. Select your NLCC project

### Step 2: Navigate to Storage
1. In the left sidebar, click **Storage** (icon looks like a folder/box)
2. You'll see the "Buckets" section

### Step 3: Create New Bucket
1. Click **"Create a new bucket"** or **"+ New Bucket"** button
2. Enter the following details:

   | Field | Value |
   |-------|-------|
   | **Bucket Name** | `assessment-media` |
   | **Privacy** | Public (to allow downloads) |
   | **Auto Indexing** | Off |

3. Click **Create Bucket**

### Step 4: Set Bucket Policies (Optional but Recommended)

Go to the new `assessment-media` bucket and click "Policies" to configure:

**Read Access (Allow public downloads):**
```sql
SELECT 1 FROM storage.objects 
WHERE bucket_id = 'assessment-media'
```

**Write Access (Allow authenticated uploads):**
```sql
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
SELECT 'assessment-media', name, auth.uid(), metadata
```

### Step 5: Verify Configuration
1. Bucket should now appear in your buckets list
2. Path format: `assessment-media/[filename]`
3. Public URL format: `https://[project-id].supabase.co/storage/v1/object/public/assessment-media/[filename]`

---

## Environment Variables

Ensure these are already in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]
```

The application will automatically use these credentials for uploads.

---

## Testing the Bucket

### Via Supabase Dashboard:
1. Go to your bucket (`assessment-media`)
2. Click **Upload File**
3. Upload a test image or audio file
4. Verify it appears in the file list

### Via Application:
1. Log in as a teacher
2. Create an assessment
3. Add a question with media
4. Upload an image/audio file
5. Verify it uploads successfully
6. Verify the media displays in the assessment preview

---

## Troubleshooting

### "Bucket already exists" error
- Bucket already created previously - proceed to next step
- Verify settings by clicking on bucket name

### "Permission denied" on upload
- Check bucket privacy settings (should be "Public")
- Verify service credentials in `.env.local`
- Ensure authenticated users can write to bucket

### Upload works but file not accessible
- Check file URL format
- Verify bucket name is exactly `assessment-media`
- Ensure file is in public bucket

### Size limits exceeded
- Default max: 50MB per file
- Maximum bucket size: 100GB
- Contact Supabase support to increase if needed

---

## Production Deployment Steps

After bucket creation:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Verify zero build errors:**
   - Check terminal output
   - Ensure all API routes compile
   - Ensure all components build successfully

3. **Deploy to your platform:**
   - **Vercel:** Push to Git, auto-deploys
   - **Docker:** Build image and push to registry
   - **AWS/GCP:** Deploy via respective CLI tools
   - **Self-hosted:** Copy build to server and start

4. **Post-deployment verification:**
   - Test login flows
   - Create a test class and assessment
   - Upload media file
   - Complete assessment as student
   - Verify gradebook export works
   - Check mission completion

---

## Deployment Platform Options

### Recommended: Vercel (Easiest)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Connect GitHub repo to Vercel
# Visit vercel.com → New Project → Select repo

# 3. Configure environment variables in Vercel dashboard
# Add all .env.local variables

# 4. Deploy
# Automatic on git push
```

**Cost:** Free tier available (up to 2GB storage)  
**Time:** ~2 minutes to setup, deployments happen on git push

---

### Alternative: Docker + Self-hosted
```bash
# 1. Build Docker image
docker build -t nlcc-app .

# 2. Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e SUPABASE_SERVICE_KEY=xxx \
  nlcc-app

# 3. Access at http://localhost:3000
```

**Cost:** Depends on hosting provider  
**Time:** ~15 minutes

---

### Alternative: AWS
```bash
# 1. Create EC2 instance
# 2. Install Node.js and npm
# 3. Clone repository
# 4. Install dependencies and build
# 5. Start application

npm install
npm run build
npm start
```

**Cost:** Varies ($5-50/month depending on instance size)  
**Time:** ~20 minutes

---

## Post-Deployment Monitoring

### Check Health
- [ ] Login page loads
- [ ] Teacher dashboard accessible
- [ ] Student portal functional
- [ ] Media uploads working
- [ ] Assessments display correctly
- [ ] Gradebook exports work

### Monitor Logs
- Check application error logs
- Monitor database performance
- Track storage usage (Supabase dashboard)
- Review authentication logs

### Performance Optimization
- Enable CDN for static assets
- Configure caching headers
- Monitor API response times
- Scale database if needed

---

## Support & Documentation

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Project Docs:** See README.md and DEVELOPER_GUIDE.md

---

## Checklist - Ready for Production? ✅

- [x] All code gaps fixed
- [x] Mission completion working
- [x] Shop purchases functional
- [x] PDF exports implemented
- [x] Audio validation enhanced
- [x] Accessibility improved
- [x] Build succeeds with zero errors
- [ ] Supabase bucket created
- [ ] Environment variables configured
- [ ] Application deployed
- [ ] All features tested in production
- [ ] Team trained on new features

---

**Status:** 🟢 READY FOR PRODUCTION DEPLOYMENT

**Last Updated:** April 22, 2026  
**Next Step:** Create Supabase bucket and deploy!
