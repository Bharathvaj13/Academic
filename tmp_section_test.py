import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table('course_assignments').insert({'course_id': 'TEST', 'staff_id': 'TEST', 'section': 'A'}).execute()
    print("Success:", res)
    supabase.table('course_assignments').delete().eq('course_id', 'TEST').execute()
except Exception as e:
    print("Error:", e)

try:
    res2 = supabase.table('timetables').insert({'course_id': 'TEST', 'staff_id': 'TEST', 'day_of_week': 'Monday', 'time_slot': 0, 'section': 'A'}).execute()
    print("Success:", res2)
    supabase.table('timetables').delete().eq('course_id', 'TEST').execute()
except Exception as e:
    print("Error:", e)
