import json
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

# Get both AIML departments
aiml_dept_response = supabase.table("departments").select("*").ilike("name", "%artificial intelligence%").execute()
print("=== DEPARTMENTS FOUND ===")
aiml_ids = {}
for dept in aiml_dept_response.data:
    print(f"{dept['id']}: {dept['name']}")
    aiml_ids[dept['name']] = dept['id']

print("\n=== CHECKING SEMESTER 2 COURSES ===")
for dept_name, dept_id in aiml_ids.items():
    courses_response = supabase.table("courses").select("*").eq("department_id", dept_id).eq("semester", 2).execute()
    print(f"\n{dept_name} - Semester 2:")
    print(f"  Total courses: {len(courses_response.data)}")
    if len(courses_response.data) > 0:
        print("  Course codes:")
        for course in courses_response.data:
            print(f"    - {course['id']}: {course['name']} (type: {course.get('type')})")
