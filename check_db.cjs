const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fasqegtxnjandjebfbbr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhc3FlZ3R4bmphbmRqZWJmYmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDQ5MDQsImV4cCI6MjA4NDg4MDkwNH0.AmQ6hMF9YsdDEZPCjE_ku84DNQ8e9o4o4Hj6pol1XPs'
);

async function check() {
  const { data: cashFlow, error } = await supabase
    .from('cash_flow')
    .select('*')
    .gte('created_at', '2026-04-01')
    .lte('created_at', '2026-04-30');
    
  console.log('Cash flow records in April:', cashFlow?.length);
  
  if (cashFlow && cashFlow.length > 0) {
    const expenses = cashFlow.filter(c => c.type === 'D' || c.type?.toUpperCase() === 'D');
    console.log('Cash flow actual expenses in April:', expenses);
  }
}

check();
