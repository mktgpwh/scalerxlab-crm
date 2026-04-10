import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkUsers() {
  console.log('--- Checking Public Users ---');
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('email, id');
  
  if (publicError) console.error('Public Users Error:', publicError);
  else console.log('Public Users:', publicUsers);

  // Note: We can't easily check auth.users without a service role key.
  // But we can check if we can sign in with specific test accounts.
  
  const testAccounts = [
    'admin@scalerxlab.com',
    'pahlajani@scalerxlab.com',
    'agent@scalerxlab.com'
  ];

  console.log('\n--- Testing Authentication (Password123!) ---');
  for (const email of testAccounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'Password123!'
    });
    console.log(`Login for ${email}:`, error ? `FAILED (${error.message})` : 'SUCCESS');
  }
}

checkUsers();
