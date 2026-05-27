import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

tt = supabase.table('timetables').select('*').limit(5).execute().data

out = {"timetables": tt, "staff_tt": None}
if tt:
    test_staff = tt[0]['staff_id']
    st = supabase.table('timetables').select('*, courses(*)').eq('staff_id', test_staff).execute().data
    out["staff_tt"] = st

with open("tmp_check_tt.json", "w") as f:
    json.dump(out, f, indent=2)
