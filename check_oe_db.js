import { createClient } from '@supabase/supabase-js';

const url = "https://nifgcsoewgzdhsmcaaxq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc";

const supabase = createClient(url, key);

async function checkOESubjects() {
  const ids = [
    'U23ADS1003', 'U23BM1002', 'U23BM1004', 'U23CE1008', 'U23CE1009',
    'U23CS1010', 'U23EC1009', 'U23EE1013', 'U23EE1021', 'U23FT1001',
    'U23IT1002', 'U23MC1008', 'U23MC1009'
  ];

  const { data, error } = await supabase.from('courses').select('id, name').in('id', ids);
  
  if (error) {
    console.error("Error checking subjects:", error);
    return;
  }

  console.log("Matching subjects found in DB:");
  console.log(JSON.stringify(data, null, 2));
}

checkOESubjects();
