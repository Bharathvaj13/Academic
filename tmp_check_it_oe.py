import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

dept_name = 'Information Technology'
dept = supabase.table('departments').select('*').eq('name', dept_name).execute().data
if dept:
    dept_id = dept[0]['id']
    courses = supabase.table('courses').select('*').eq('department_id', dept_id).eq('semester', 6).execute().data
    oe_courses = [c for c in courses if c['type'] == 'OE' or 'oe' in c['name'].lower() or 'open elective' in c['name'].lower()]
    print("IT OE subjects:", [c['name'] for c in oe_courses])
