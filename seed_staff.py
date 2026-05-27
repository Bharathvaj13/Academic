import json
import glob
from supabase import create_client, Client

# ==========================================
# 1. REPLACE THESE WITH YOUR SUPABASE KEYS
# ==========================================
url: str = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"

if url == "YOUR_SUPABASE_URL":
    print("ERROR: Please replace the placeholder url and key with your actual Supabase project credentials!")
    exit(1)

supabase: Client = create_client(url, key)

json_folder = "doc sources/" 

# Map short department names to the full names used in the course JSONs
dept_mapping = {
    "CSE": "Computer Science and Engineering",
    "IT": "Information Technology",
    "EEE": "Electrical and Electronics Engineering",
    "ECE": "Electronics and Communication Engineering",
    "MECH": "Mechanical Engineering",
    "CIVIL": "Civil Engineering",
    "MBA": "Management Studies"
}

def get_dept_id(dept_name):
    # Standardize the department name
    full_name = dept_mapping.get(dept_name.upper(), dept_name)
    # Upsert the department
    response = supabase.table("departments").upsert({"name": full_name}, on_conflict="name").execute()
    if not response.data:
        raise Exception(f"Failed to fetch or create department {full_name}")
    return response.data[0]["id"]

print("Starting Staff ingestion process...")

for filepath in glob.glob(f"{json_folder}/**/*.json", recursive=True):
    # Only process staff files
    if "staff" not in filepath.lower():
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    staff_to_insert = []
    
    for staff in data:
        dept_code = staff.get("dept", "General")
        dept_id = get_dept_id(dept_code)
        
        staff_to_insert.append({
            "department_id": dept_id,
            "name": staff["name"],
            "specialization": staff.get("specialization", "General"),
            "max_courses": 5,
            "max_hours": 25,
            "courses_assigned": 0,
            "hours": 0
        })
        
    if staff_to_insert:
        try:
            # We use insert instead of upsert here
            supabase.table("staff").insert(staff_to_insert).execute()
            print(f"✅ Loaded {len(staff_to_insert)} staff members from {filepath}")
        except Exception as e:
            print(f"⚠️ Could not insert staff from {filepath}. Error: {e}")

print("🎉 Staff upload finished!")
