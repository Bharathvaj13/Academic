import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

def clear_db():
    try:
        # Clear Timetables
        print("Fetching timetables...")
        tt = supabase.table('timetables').select('id').execute().data
        if tt:
            print(f"Deleting {len(tt)} timetables...")
            for t in tt:
                supabase.table('timetables').delete().eq('id', t['id']).execute()
        
        # Clear Course Assignments
        print("Fetching course assignments...")
        ca = supabase.table('course_assignments').select('id').execute().data
        if ca:
            print(f"Deleting {len(ca)} assignments...")
            for a in ca:
                supabase.table('course_assignments').delete().eq('id', a['id']).execute()

        # Reset Staff
        print("Fetching staff...")
        staff = supabase.table('staff').select('id').execute().data
        if staff:
            print(f"Resetting {len(staff)} staff members...")
            for s in staff:
                supabase.table('staff').update({'courses_assigned': 0, 'hours': 0}).eq('id', s['id']).execute()
                
        print("Successfully cleared all data and reset staff counts!")
    except Exception as e:
        print("Error during reset:", e)

if __name__ == "__main__":
    clear_db()
