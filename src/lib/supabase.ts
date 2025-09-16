import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('Supabase Config Debug:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
}

// Create a mock client if environment variables are missing (for demo mode)
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Running in demo mode without authentication.')
  
  // Create a mock Supabase client for demo mode
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Authentication not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Authentication not configured') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: new Error('Database not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Database not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Database not configured') }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Database not configured') })
    })
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Database types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  avatar_url?: string
  api_keys?: {
    huggingface?: string
    openai?: string
    stability?: string
  }
  created_at: string
  updated_at: string
}

export interface Creature {
  id: string
  user_id: string
  name: string
  image_url?: string
  generation_params: any
  traits: any
  is_favorite: boolean
  is_public: boolean
  rating?: number
  created_at: string
  updated_at: string
}