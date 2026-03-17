import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const anon = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, anon);
supabase.from('accounts_payable').select('*').limit(1).then(r => console.log(Object.keys(r.data[0]))).catch(e => console.log(e));
