import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseAnonClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    console.warn('Supabase anon credentials not fully configured. API route functionality is limited.');
    return null;
  }

  return createClient(url, anonKey);
}

export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey) {
    console.warn('Supabase service role credentials not fully configured. API route functionality is limited.');
    return null;
  }

  return createClient(url, serviceRoleKey);
}

export function missingSupabaseConfigResponse() {
  return NextResponse.json(
    { error: 'Supabase credentials are not configured for this environment.' },
    { status: 503 }
  );
}