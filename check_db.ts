
import { createClient } from '@supabase/supabase-client';

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
    if (error.code === '42P01') {
      console.log("TABLE_NOT_FOUND");
    } else if (error.message.includes('column')) {
       console.log("COLUMN_ERROR", error.message);
    }
  } else {
    console.log("TABLE_EXISTS", data);
  }
}

checkTable();
