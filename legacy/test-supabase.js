// Test Supabase Connection
// Temporary file to test database connectivity

import { supabase } from './lib/supabase.js'

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test 1: Basic connection
    const { data, error } = await supabase.from('user_profiles').select('count')
    
    if (error) {
      console.error('Database query error:', error)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
    
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return false
  }
}

// Run test if this file is imported
testSupabaseConnection()