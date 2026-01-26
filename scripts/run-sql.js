#!/usr/bin/env node
/**
 * Run SQL files against Supabase database
 * Usage: node scripts/run-sql.js <sql-file>
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://gozlknklxhwvfksnrmvh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Get SQL file path from command line
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Error: Please provide a SQL file path');
  console.log('Usage: node scripts/run-sql.js <sql-file>');
  process.exit(1);
}

const sqlFilePath = resolve(__dirname, '..', sqlFile);

try {
  // Read SQL file
  const sql = readFileSync(sqlFilePath, 'utf-8');
  
  console.log(`📄 Reading SQL file: ${sqlFile}`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Execute SQL using Supabase RPC (if available) or direct query
  // Note: Supabase JS client doesn't support raw SQL execution directly
  // We'll need to use the REST API or provide instructions
  
  console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.');
  console.log('📋 Please run this SQL file in the Supabase SQL Editor:');
  console.log(`   ${sqlFilePath}`);
  console.log('\n📝 SQL Content:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
