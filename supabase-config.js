// ============================================================
// Bosa-Care — Supabase client config
// Get these two values from: Supabase Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL = "https://qrxepwvuhhygddgggxkh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeGVwd3Z1aGh5Z2RkZ2dneGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzEwNDQsImV4cCI6MjEwMjQwNzA0NH0.IDM3gBYdOdCHwW3NTxx8zfOnmbDNZelzxLycqtAskZQ"; // safe to expose in frontend

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
