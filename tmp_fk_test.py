import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table('course_assignments').insert({'course_id': 'NON_EXISTENT_COURSE_A', 'staff_id': 'f7d264f3-2d5d-4f24-ba25-78e0ea52afec'}).execute() # using a known staff uuid might be required, or any uuid
    print("Success:", res)
    supabase.table('course_assignments').delete().eq('course_id', 'NON_EXISTENT_COURSE_A').execute()
except Exception as e:
    print("Error:", e)
