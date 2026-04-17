/**
 * Unified Supabase Storage Manager
 * Centralized file upload and download operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
  console.warn('Supabase credentials not fully configured. Storage will have limited functionality.');
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Supabase client
 */
function initializeSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  try {
    // Use service role key if available (for server-side operations), otherwise use anon key
    const key = supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key';
    supabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', key);
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Get Supabase client
 */
export function getSupabaseClient() {
  return supabaseClient || initializeSupabaseClient();
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | File,
  options?: { contentType?: string; upsert?: boolean }
) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert ?? true,
    });

    if (error) {
      throw error;
    }

    return {
      path: data.path,
      fullPath: data.fullPath,
      url: getPublicUrl(bucket, data.path),
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file to ${bucket}: ${error}`);
  }
}

/**
 * Upload image to lesson-images bucket
 */
export async function uploadImage(buffer: Buffer, fileName: string) {
  return uploadFile('lesson-images', fileName, buffer, { contentType: 'image/png', upsert: true });
}

/**
 * Upload audio to lesson-audio bucket
 */
export async function uploadAudio(buffer: Buffer, fileName: string) {
  return uploadFile('lesson-audio', fileName, buffer, { contentType: 'audio/mpeg', upsert: true });
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFile(bucket: string, path: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { data, error } = await client.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download file from ${bucket}: ${error}`);
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file from ${bucket}: ${error}`);
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const client = getSupabaseClient();
  if (!client || !supabaseUrl) {
    return '';
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: string, path?: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { data, error } = await client.storage.from(bucket).list(path);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('List error:', error);
    throw new Error(`Failed to list files in ${bucket}: ${error}`);
  }
}

export default {
  getSupabaseClient,
  uploadFile,
  uploadImage,
  uploadAudio,
  downloadFile,
  deleteFile,
  getPublicUrl,
  listFiles,
};
