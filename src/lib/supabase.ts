import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rubkdegbcuhoopbldlez.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YmtkZWdiY3Vob29wYmxkbGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Njk2ODYsImV4cCI6MjA2NDU0NTY4Nn0.ip4kqRJ5SGy4tsfSbxcC5BVfZrxD_3-zcSXgqT8lIpc';

export const supabase = createClient(supabaseUrl, supabaseKey);