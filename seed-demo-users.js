// ============================================================
// Bosa-Care — seed demo users
// Run locally with Node (NOT in the browser — uses the secret service_role key):
//
//   npm install @supabase/supabase-js
//   node seed-demo-users.js
//
// Get the service_role key from: Supabase Dashboard → Project Settings → API
// (it's the "service_role" secret key, different from the anon key)
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://qrxepwvuhhygddgggxkh.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeGVwd3Z1aGh5Z2RkZ2dneGtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjgzMTA0NCwiZXhwIjoyMTAyNDA3MDQ0fQ.pjrekkI47Nt8O1bF43aTTdzaq_3UcJW6X9ke8rXglG4"; // keep secret, server-side only

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// One doctor + the patients already mocked in doctor-dashboard.html
const demoUsers = [
  { email: "dr.tumelo@bosacare.bw", password: "Demo1234!", role: "doctor",
    full_name: "Dr. Shatho Tumelo" },

  { email: "thato.molefe@bosacare.bw", password: "Demo1234!", role: "patient",
    full_name: "Thato Molefe", condition: "Hypertension" },
  { email: "kagiso.pheto@bosacare.bw", password: "Demo1234!", role: "patient",
    full_name: "Kagiso Pheto", condition: "HIV" },
  { email: "lorato.seleka@bosacare.bw", password: "Demo1234!", role: "patient",
    full_name: "Lorato Seleka", condition: "Cancer" },
  { email: "boitumelo.kau@bosacare.bw", password: "Demo1234!", role: "patient",
    full_name: "Boitumelo Kau", condition: "Low Blood" },
  { email: "neo.ramotswe@bosacare.bw", password: "Demo1234!", role: "patient",
    full_name: "Neo Ramotswe", condition: "Diabetes" },
];

async function run() {
  for (const u of demoUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // skip the confirmation email for demo accounts
      user_metadata: {
        full_name: u.full_name,
        role: u.role,
        condition: u.condition || null,
      },
    });

    if (error) {
      console.error(`✗ ${u.email}:`, error.message);
    } else {
      console.log(`✓ created ${u.role}: ${u.email} (id: ${data.user.id})`);
      // The database trigger (handle_new_user) automatically creates the
      // matching profiles / patient_profiles / doctor_profiles row.
    }
  }
  console.log("\nDone. Demo password for all accounts: Demo1234!");
}

run();
