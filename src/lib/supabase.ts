import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — check .env.local',
  )
}

// The one connection the whole app shares. <Database> gives typed queries:
// supabase.from('expenses') knows every column and its type.
export const supabase = createClient<Database>(url, key)
