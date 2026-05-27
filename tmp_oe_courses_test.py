import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

dept_name = 'Information Technology'
dept = supabase.table('departments').select('*').eq('name', dept_name).execute().data
if not dept:
    print("Dept not found")
else:
    dept_id = dept[0]['id']
    courses = supabase.table('courses').select('*').eq('department_id', dept_id).eq('semester', 6).execute().data
    print(f"Found {len(courses)} courses for IT sem 6.")
    
    oe_courses = [c for c in courses if c['type'] == 'OE' or 'oe' in c['name'].lower() or 'open elective' in c['name'].lower()]
    print(f"OE courses among them: {len(oe_courses)}")
    for o in oe_courses:
        print(o['id'], o['name'], o['type'])
        
    print("Checking how many OE subjects exist overall for sem 6")
    all_oe = supabase.table('courses').select('*').eq('type', 'OE').eq('semester', 6).execute().data
    print(f"Total OE subjects sem 6: {len(all_oe)}")
