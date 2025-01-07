import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnzdzneuynkyzfjwheej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuemR6bmV1eW5reXpmandoZWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ2NTc2MDAsImV4cCI6MjAyMDIzMzYwMH0.SbC6B9VqfbEF7vS0g_hRVtcGqoVRVXQdM0dkGpVZYYw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});