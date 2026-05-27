import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

print("Assignments Columns:", supabase.table('course_assignments').select('*').limit(1).execute().data[0].keys())
print("Timetables Columns:", supabase.table('timetables').select('*').limit(1).execute().data[0].keys())
