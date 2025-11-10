import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const assertEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${key}`);
  }

  return value;
};

export const createClient = (): SupabaseClient<Database> => {
  const url = assertEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = assertEnv(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createSupabaseClient<Database>(url, anonKey);
};

export const createServerClient = (): SupabaseClient<Database> => {
  const url = assertEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = assertEnv(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

