import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase credentials missing. Image storage will be disabled.');
}

let supabaseClient: any = null;

const initSupabase = () => {
  if (supabaseClient) return supabaseClient;
  
  try {
    supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceRoleKey || 'placeholder-key'
    );
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const supabase = initSupabase() || {
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
      download: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  },
};

export const uploadImageToSupabase = async (buffer: Buffer, fileName: string, bucket: string = 'lesson-images') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};
