import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function addOESubjects() {
  console.log("Fetching departments...");
  const { data: depts, error: deptError } = await supabase.from('departments').select('*');
  
  if (deptError) {
    console.error("Error fetching departments:", deptError);
    return;
  }

  console.log(`Found ${depts.length} departments. Inserting OE subjects...`);

  const oeCourses = [];
  for (const dept of depts) {
    // Sem 6 OE
    oeCourses.push({
      id: `OE-${dept.id}-S6`,
      department_id: dept.id,
      name: "OPEN ELECTIVE",
      type: "OE",
      hours: 5,
      credits: 3,
      weekly_hours: 5,
      l: 3, t: 0, p: 2, j: 0, // Typical OE structure: 3 Theory + 2 Practical/Lab total hours
      year: 3,
      semester: 6
    });

    // Sem 7 OE
    oeCourses.push({
      id: `OE-${dept.id}-S7`,
      department_id: dept.id,
      name: "OPEN ELECTIVE",
      type: "OE",
      hours: 5,
      credits: 3,
      weekly_hours: 5,
      l: 3, t: 0, p: 2, j: 0,
      year: 4,
      semester: 7
    });
  }

  const { error: insertError } = await supabase.from('courses').upsert(oeCourses, { onConflict: 'id' });

  if (insertError) {
    console.error("Error inserting OE courses:", insertError);
  } else {
    console.log("✅ Successfully added Open Elective subjects for all departments in Sem 6 & 7.");
  }
}

addOESubjects();
