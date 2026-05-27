import json
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

# Read expected course codes from AIML sem2 JSON
expected_codes = set()
with open('doc sources/AIML_Department/sem2_2023.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)
    for course in json_data['courses'].get('theory_courses', []):
        expected_codes.add(course['course_code'])
    for course in json_data['courses'].get('practical_courses', []):
        expected_codes.add(course['course_code'])
    for group in json_data['courses'].get('optional_language_courses', []):
        for course in group.get('courses', []):
            expected_codes.add(course['course_code'])

print(f"Expected {len(expected_codes)} course codes in AIML sem2 JSON:")
for code in sorted(expected_codes):
    print(f"  - {code}")

print("\n=== CHECKING WHICH COURSES ARE MISSING ===")
# Check if these courses exist in the database AT ALL
courses_response = supabase.table("courses").select("*,departments(name)").in_("id", list(expected_codes)).execute()
found_codes = {c['id'] for c in courses_response.data}
missing_codes = expected_codes - found_codes

print(f"\nFound in database: {len(found_codes)} courses")
print(f"Missing from database: {len(missing_codes)} courses")

if missing_codes:
    print("\nMissing course codes:")
    for code in sorted(missing_codes):
        print(f"  - {code}")

print("\n=== CHECKING COURSES BY DEPARTMENT ===")
if courses_response.data:
    by_dept = {}
    for course in courses_response.data:
        dept_name = course['departments']['name'] if course['departments'] else 'Unknown'
        if dept_name not in by_dept:
            by_dept[dept_name] = []
        by_dept[dept_name].append(course['id'])
    
    for dept, codes in sorted(by_dept.items()):
        print(f"\n{dept}:")
        for code in sorted(codes):
            print(f"  - {code}")
