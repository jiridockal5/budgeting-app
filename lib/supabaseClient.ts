import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  
  if (typeof window !== 'undefined') {
    console.error('Supabase Configuration Error:', {
      url: supabaseUrl || 'NOT SET',
      key: supabaseAnonKey ? 'SET' : 'NOT SET',
    })
  }
  
  throw new Error(errorMsg)
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. URL must start with http:// or https://`)
}

// Use createBrowserClient from @supabase/ssr for proper cookie synchronization
// This ensures the session is stored in cookies (not just localStorage)
// so that the server-side middleware can read the authentication state
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

