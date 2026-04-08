#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

// Load environment variables
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const parsed = dotenv.parse(envContent);
  Object.entries(parsed).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  process.exit(1);
}

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function setupStorage() {
  console.log('🔧 Setting up Supabase storage buckets...\n');

  const bucketName = 'lesson-images';

  try {
    console.log(`📦 Checking bucket: ${bucketName}...`);
    
    // Try to list files in the bucket to check if it exists
    const { data, error } = await supabaseAnon.storage.from(bucketName).list('/', { limit: 1 });

    if (error && error.statusCode === 404) {
      console.log(`\n❌ Bucket not found!\n`);
      console.log(`MANUAL SETUP REQUIRED:`);
      console.log(`1. Visit Supabase Console: ${supabaseUrl}/project/_/storage/buckets`);
      console.log(`2. Click "New bucket"`);
      console.log(`3. Name: ${bucketName}`);
      console.log(`4. Check "Public bucket" (IMPORTANT!)`);
      console.log(`5. Click "Create bucket"`);
      console.log(`6. After creation, go to CORS settings and allow all origins\n`);
    } else if (error && error.statusCode === 401) {
      console.log(`\n⚠️  Permission denied - The anon key may not have storage access.`);
      console.log(`\nTry uploading a test image. If it still fails:`);
      console.log(`1. Go to Supabase Console: ${supabaseUrl}/project/_/auth/policies`);
      console.log(`2. Ensure "lesson-images" bucket allows public access via anon key\n`);
    } else if (error) {
      console.log(`   ⚠️  Error: ${error.message} (Status: ${error.statusCode})`);
      console.log(`\nFull error details:`);
      console.log(JSON.stringify(error, null, 2));
    } else {
      console.log(`   ✅ Bucket "${bucketName}" exists and is accessible`);
      console.log(`   📁 Contains ${data?.length || 0} files\n`);
      
      // Try to upload a test file
      console.log(`🧪 Testing upload permissions...`);
      try {
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = new TextEncoder().encode('test');
        
        const { data: uploadData, error: uploadError } = await supabaseAnon.storage
          .from(bucketName)
          .upload(testFileName, testContent, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.log(`   ❌ Upload failed: ${uploadError.message}`);
          console.log(`   Make sure the bucket is PUBLIC\n`);
        } else {
          console.log(`   ✅ Upload successful!`);
          
          // Get public URL
          const { data } = supabaseAnon.storage
            .from(bucketName)
            .getPublicUrl(uploadData.path);
          
          console.log(`   🔗 Public URL: ${data.publicUrl}\n`);
          
          // Clean up test file
          await supabaseAnon.storage
            .from(bucketName)
            .remove([testFileName]);
        }
      } catch (testErr) {
        console.log(`   ⚠️  Test upload error: ${testErr.message}\n`);
      }
    }
  } catch (err) {
    console.error(`❌ Fatal error: ${err.message}`);
    console.error(err);
  }

  console.log('✨ Storage diagnostics complete!\n');
}

setupStorage().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
