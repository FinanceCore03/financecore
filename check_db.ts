
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('Assinaturas')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching Assinaturas:", error);
  } else {
    console.log("TABLE_EXISTS");
    if (data && data.length > 0) {
        console.log("Columns found in first row:", Object.keys(data[0]));
    } else {
        console.log("No data in table to check columns.");
    }
  }
}

checkTable();
