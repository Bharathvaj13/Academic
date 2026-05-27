import json
from supabase import create_client, Client

url: str = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"

supabase: Client = create_client(url, key)

def add_oe_subjects():
    print("Fetching departments...")
    depts = supabase.table("departments").select("*").execute()
    
    if not depts.data:
        print("No departments found.")
        return

    print(f"Found {len(depts.data)} departments. Inserting OE subjects...")

    oe_courses = []
    for dept in depts.data:
        dept_id = dept["id"]
        # Sem 6 OE
        oe_courses.append({
            "id": f"OE-{dept_id}-S6",
            "department_id": dept_id,
            "name": "OPEN ELECTIVE",
            "type": "OE",
            "hours": 5,
            "credits": 3,
            "weekly_hours": 5,
            "l": 3, "t": 0, "p": 2, "j": 0,
            "year": 3,
            "semester": 6
        })

        # Sem 7 OE
        oe_courses.append({
            "id": f"OE-{dept_id}-S7",
            "department_id": dept_id,
            "name": "OPEN ELECTIVE",
            "type": "OE",
            "hours": 5,
            "credits": 3,
            "weekly_hours": 5,
            "l": 3, "t": 0, "p": 2, "j": 0,
            "year": 4,
            "semester": 7
        })

    try:
        supabase.table("courses").upsert(oe_courses, on_conflict="id").execute()
        print("✅ Successfully added Open Elective subjects for all departments in Sem 6 & 7.")
    except Exception as e:
        print(f"❌ Error inserting OE courses: {e}")

if __name__ == "__main__":
    add_oe_subjects()
