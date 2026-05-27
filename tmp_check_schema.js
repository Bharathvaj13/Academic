import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: a } = await supabase.from('course_assignments').select('*').limit(1);
  console.log('Assignments schema/sample:', a);
  
  const { data: t } = await supabase.from('timetables').select('*').limit(1);
  console.log('Timetables schema/sample:', t);
}
check();
