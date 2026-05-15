import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data: users, error } = await supabase
    .from('Usuarios')
    .select('id, id_auth, Email, Nome');

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Registered users in 'Usuarios' table:");
  console.log(JSON.stringify(users, null, 2));
}

checkUsers();
