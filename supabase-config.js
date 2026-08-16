// ============================================================
// Bosa-Care — Supabase client config
// Get these two values from: Supabase Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL = "https://btmrdkihnaiogoojtzgm.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bXJka2lobmFpb2dvb2p0emdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTExMTQsImV4cCI6MjEwMjM2NzExNH0.nvCutPeW6sLzRbNQfZOuREPsXgM1zxpPOszyIMdlKQU"; // safe to expose in frontend

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
