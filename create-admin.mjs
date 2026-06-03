import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylqgyxibakupzxbvwgvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscWd5eGliYWt1cHp4YnZ3Z3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTU1MDMsImV4cCI6MjA5NTE5MTUwM30.YaH50v30O0WrPe5Q_bA6DP1F5dqmFPE8CvYGqUeQv2w';

const ADMIN_EMAIL = 'ozodjonovm1@gmail.com';
const ADMIN_PASSWORD = 'TuronMUN@2026';
const ADMIN_NAME = 'TuronMUN Admin';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
  console.log('Step 1: Signing up admin user...');

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: { data: { full_name: ADMIN_NAME } }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  console.log('User created:', user.id);
  console.log('Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO (check email or disable confirmation in Supabase)');

  if (!user.email_confirmed_at) {
    console.log('\n⚠️  Email confirmation is required.');
    console.log('Go to Supabase Dashboard → Authentication → Users');
    console.log(`Find ${ADMIN_EMAIL} and click "Confirm email"`);
    console.log('\nThen re-run this script with the --insert-only flag');
    console.log('User ID to use:', user.id);
    return;
  }

  console.log('\nStep 2: Inserting into admin_users table...');

  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      id: user.id,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'superadmin',
      password_hash: 'supabase-auth',
      is_active: true,
    });

  if (insertError) {
    console.error('Insert error (may need service role key):', insertError.message);
    console.log('\nUser ID to manually insert:', user.id);
    console.log('Run this SQL in Supabase SQL Editor:');
    console.log(`
INSERT INTO public.admin_users (id, email, full_name, role, password_hash, is_active)
VALUES (
  '${user.id}',
  '${ADMIN_EMAIL}',
  '${ADMIN_NAME}',
  'superadmin',
  'supabase-auth',
  true
);
    `);
    return;
  }

  console.log('\n✅ Admin user created successfully!');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  console.log('Login at: https://turonmun-weld.vercel.app/?subdomain=admin');
}

createAdmin();
