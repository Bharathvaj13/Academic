import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  console.log("Fetching all timetables...");
  const { data: tt, error } = await supabase.from('timetables').select('*').limit(3);
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("TIMETABLES TABLE:");
  console.log(JSON.stringify(tt, null, 2));

  if (tt && tt.length > 0) {
    const test_staff = tt[0].staff_id;
    console.log(`\n\nFetching staff timetable for ${test_staff}...`);
    const { data: st, error: stErr } = await supabase.from('timetables').select('*, courses(*)').eq('staff_id', test_staff);
    if (stErr) {
      console.error(stErr);
      return;
    }
    console.log("STAFF TIMETABLE:");
    console.log(JSON.stringify(st, null, 2));
  }
}

check();
