import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL || 'https://wctaspdndtdnogyjxopm.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdGFzcGRuZHRkbm9neWp4b3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Mzg5NTAsImV4cCI6MjA5NDExNDk1MH0.XnDctQ4_LNNfWlJOUEdI9wBbUA0LPMnXg7F96DwzabU',
);
