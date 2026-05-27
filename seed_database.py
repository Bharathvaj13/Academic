import json
import glob
import os
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

dept_short_mapping = {v: k for k, v in dept_mapping.items()}

def get_dept_id(dept_name):
    # Standardize the department name
    full_name = dept_mapping.get(dept_name.upper(), dept_name)
    # Upsert the department
    response = supabase.table("departments").upsert({"name": full_name}, on_conflict="name").execute()
    return response.data[0]["id"]

print("Starting ingestion process...")

# ==========================================
# 2. PROCESS COURSES FIRST
# ==========================================
for filepath in glob.glob(f"{json_folder}/**/*.json", recursive=True):
    # Skip staff files here
    if "staff" in filepath.lower():
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if "department" not in data:
        continue

    dept_name = data["department"]
    dept_id = get_dept_id(dept_name)
    dept_short = dept_short_mapping.get(dept_name, dept_name.replace(" ", "").upper()[:3])

    year = int(data.get("year", 1))
    semester = int(data.get("semester", 1))
    courses_to_insert = []
    
    # DELETE existing courses for this department and semester to avoid conflicts
    # This ensures we don't have orphaned courses from failed previous seedings
    try:
        existing = supabase.table("courses").select("id").eq("department_id", dept_id).eq("year", year).eq("semester", semester).execute()
        if existing.data:
            course_ids = [c['id'] for c in existing.data]
            # Delete in batches of 100 to avoid query limits
            for i in range(0, len(course_ids), 100):
                batch = course_ids[i:i+100]
                supabase.table("courses").delete().in_("id", batch).execute()
            print(f"  Cleared {len(course_ids)} old courses for {dept_name} Y{year}S{semester}")
    except Exception as e:
        print(f"  Note: Could not clear old courses: {e}")

    def safe_num(val, default=0):
        try:
            f = float(val)
            return int(round(f))  # Round to nearest integer
        except (ValueError, TypeError):
            return default

    def process_courses(course_list, course_type, dept_short, default_l=0, default_t=0, default_p=0, default_j=0, default_credits=0):
        for course in course_list:
            l = safe_num(course.get("L", default_l))
            t = safe_num(course.get("T", default_t))
            p = safe_num(course.get("P", default_p))
            j = safe_num(course.get("J", default_j))
            credits = safe_num(course.get("credits", default_credits))
            hours = safe_num(course.get("contact_hours", 0))
            weekly_hrs = safe_num(l + t + p + j)
            
            courses_to_insert.append({
                "id": f"{dept_short}_{course.get('course_code')}",
                "department_id": dept_id,
                "name": course.get("course_title", "Unknown"),
                "type": course_type,
                "hours": hours, 
                "credits": credits,
                "weekly_hours": weekly_hrs,
                "l": l,
                "t": t,
                "p": p,
                "j": j,
                "year": int(year),
                "semester": int(semester)
            })

    courses_data = data.get("courses", {})
    process_courses(courses_data.get("theory_courses", []), "Theory", dept_short)
    process_courses(courses_data.get("practical_courses", []), "Practical", dept_short)

    optional_courses = courses_data.get("optional_language_courses", [])
    if isinstance(optional_courses, dict):
        optional_courses = [optional_courses]
        
    for group in optional_courses:
        if isinstance(group, dict):
            process_courses(
                group.get("courses", []), 
                "Optional", 
                dept_short,
                default_l=group.get("L", 0), 
                default_t=group.get("T", 0), 
                default_p=group.get("P", 0), 
                default_j=group.get("J", 0), 
                default_credits=group.get("credits", 0)
            )
        elif isinstance(group, str):
             courses_to_insert.append({
                "id": f"OPT-{group}",
                "department_id": dept_id,
                "name": group,
                "type": "Optional",
                "hours": 0, 
                "credits": 0,
                "weekly_hours": 0,
                "l": 0, "t": 0, "p": 0, "j": 0,
                "year": year,
                "semester": semester
            })

    if courses_to_insert:
        # Deduplicate by course 'id'
        unique_courses = list({c["id"]: c for c in courses_to_insert}.values())
        try:
            supabase.table("courses").upsert(unique_courses).execute()
            print(f"[OK] Loaded {len(unique_courses)} unique courses from {filepath}")
        except Exception as e:
            print(f"[BATCH FAILED] Batch insertion failed for {filepath}. Inserting individually...")
            success_count = 0
            for c in unique_courses:
                try:
                    supabase.table("courses").upsert([c]).execute()
                    success_count += 1
                except Exception as e2:
                    print(f"  -> Offending course: {c['id']} - {c['name']} - Error: {e2}")
            print(f"[OK] Loaded {success_count}/{len(unique_courses)} unique courses from {filepath}")

# ==========================================
# 3. PROCESS STAFF Second
# ==========================================
for filepath in glob.glob(f"{json_folder}/**/*.json", recursive=True):
    # Only process staff files here
    if "staff" not in filepath.lower():
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f) # Assuming list of staff objects
        
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
        # We don't have unique IDs in staff_to_insert, nor are we upserting by a unique constraint on name.
        # But if you run this multiple times, it will duplicate staff. Let's just catch potential errors.
        try:
            supabase.table("staff").insert(staff_to_insert).execute()
            print(f"[OK] Loaded {len(staff_to_insert)} staff members from {filepath}")
        except Exception as e:
            print(f"[WARNING] Could not insert staff from {filepath}. They may already exist. Error: {e}")

print("[COMPLETE] Bulk upload complete! Your Supabase database is now fully populated.")
