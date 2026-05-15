import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  const { data: users, error: err1 } = await supabase.from('Usuarios').select('*')
  console.log('Users:', users)
  
  const { data: trans, error: err2 } = await supabase.from('Transacoes').select('*').limit(5)
  console.log('Sample Transactions:', trans)
}

debug()
