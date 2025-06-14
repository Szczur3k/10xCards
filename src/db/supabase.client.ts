import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";
import { createMockSupabaseClient, isMockAuthEnabled, getMockUser, createMockAuthResponse } from "../lib/auth/mock-auth";

// Check if we're in browser (client-side)
const isBrowser = typeof window !== 'undefined';

// Get environment variables - use PUBLIC_ versions for client-side
const supabaseUrl = isBrowser 
  ? import.meta.env.PUBLIC_SUPABASE_URL 
  : import.meta.env.SUPABASE_URL;
  
const supabaseAnonKey = isBrowser 
  ? import.meta.env.PUBLIC_SUPABASE_KEY 
  : import.meta.env.SUPABASE_KEY;

// Create appropriate client
let supabaseClient: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('🔧 Missing Supabase credentials, using full mock client');
  supabaseClient = createMockSupabaseClient();
} else if (isMockAuthEnabled()) {
  console.log('🔧 Using real database with mock authentication');
  // Create real Supabase client but override auth methods
  const realClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  
  // Create hybrid client: real database + mock auth
  supabaseClient = Object.create(realClient);
  supabaseClient.auth = {
    ...realClient.auth,
    getUser: async () => {
      console.log('🔧 Mock auth: returning mock user');
      const mockUser = getMockUser();
      return createMockAuthResponse(mockUser);
    }
  };
} else {
  console.log('🔧 Using real Supabase client with real authentication');
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabaseClient };
