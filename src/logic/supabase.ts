import { createClient } from '@supabase/supabase-js'

// פרויקט Supabase המשותף של ענת. כל הטבלאות של האפליקציה בקידומת michtav_.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ktqmwpbzcnzkhjskqisy.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'michtav-auth' },
})
