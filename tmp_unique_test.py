import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# staff uuids
# I need to get 2 valid staff ids and 1 valid course id
st = supabase.table('staff').select('id').limit(2).execute().data
c = supabase.table('courses').select('id').limit(1).execute().data

if len(st) == 2 and len(c) == 1:
    c_id = c[0]['id']
    s1 = st[0]['id']
    s2 = st[1]['id']
    print(f"Testing with course {c_id} and staff {s1}, {s2}")
    try:
        r1 = supabase.table('course_assignments').insert({'course_id': c_id, 'staff_id': s1}).execute()
        print("Insert 1 Success")
    except Exception as e:
        print("Insert 1 Error:", e)
        
    try:
        r2 = supabase.table('course_assignments').insert({'course_id': c_id, 'staff_id': s2}).execute()
        print("Insert 2 Success")
    except Exception as e:
        print("Insert 2 Error:", e)
        
    supabase.table('course_assignments').delete().eq('course_id', c_id).execute()
else:
    print("Not enough data to test")
