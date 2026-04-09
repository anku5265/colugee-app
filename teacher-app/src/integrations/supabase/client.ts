import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fofobfzcinawzaqtvhbq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZm9iZnpjaW5hd3phcXR2aGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODQxMTIsImV4cCI6MjA5MTI2MDExMn0.qbDnAAAAUmf4k8wDYBX6ydDGDC65WXD6SKUuhdY2UKU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
