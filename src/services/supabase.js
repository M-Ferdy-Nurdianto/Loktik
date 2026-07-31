import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE')
    ? import.meta.env.VITE_SUPABASE_URL
    : 'https://wptfkymsjrtrwyamsrhi.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdGZreW1zanJ0cnd5YW1zcmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODM4ODksImV4cCI6MjEwMDY1OTg4OX0.M2H0mmzZ8V2JhCKL55o1BSIE7Y_ZPG0xzJZz1EEm61I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const archiveUrl =
  import.meta.env.VITE_SUPABASE_ARCHIVE_URL && !import.meta.env.VITE_SUPABASE_ARCHIVE_URL.includes('YOUR_SUPABASE')
    ? import.meta.env.VITE_SUPABASE_ARCHIVE_URL
    : supabaseUrl;

const archiveAnonKey =
  import.meta.env.VITE_SUPABASE_ARCHIVE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ARCHIVE_ANON_KEY.includes('YOUR_SUPABASE')
    ? import.meta.env.VITE_SUPABASE_ARCHIVE_ANON_KEY
    : supabaseAnonKey;

export const supabaseArchive = createClient(archiveUrl, archiveAnonKey);

