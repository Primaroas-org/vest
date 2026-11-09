import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);

  // Test 1: Can we query properties?
  console.log('\n--- Test 1: Query properties table ---');
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('*')
    .limit(5);

  if (propError) {
    console.error('❌ Properties query error:', propError);
  } else {
    console.log('✅ Properties found:', properties?.length || 0);
    if (properties && properties.length > 0) {
      console.log('First property:', properties[0].name);
    }
  }

  // Test 2: Can we query users?
  console.log('\n--- Test 2: Query users table ---');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);

  if (usersError) {
    console.error('❌ Users query error:', usersError);
  } else {
    console.log('✅ Users found:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('Users:', users.map(u => u.email));
    }
  }

  // Test 3: Check if tables exist
  console.log('\n--- Test 3: Check table existence ---');
  const { error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['users', 'properties', 'investments', 'transactions']);

  if (tableError) {
    console.error('❌ Table check error:', tableError);
  } else {
    console.log('✅ Table check passed');
  }
}

testConnection().catch(console.error);
