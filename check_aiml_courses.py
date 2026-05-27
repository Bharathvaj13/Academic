import json
from supabase import create_client, Client

# Supabase credentials
url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"

supabase: Client = create_client(url, key)

# Get AIML department ID
dept_response = supabase.table("departments").select("*").ilike("name", "%artificial%").execute()
if dept_response.data:
    aiml_dept = dept_response.data[0]
    print(f"AIML Department Found: {aiml_dept['id']} - {aiml_dept['name']}")
    aiml_dept_id = aiml_dept['id']
    
    # Get all courses for AIML semester 2
    courses_response = supabase.table("courses").select("*").eq("department_id", aiml_dept_id).eq("semester", 2).execute()
    print(f"\nTotal courses for AIML Semester 2 in database: {len(courses_response.data)}")
    print("\nCourses by Type:")
    
    type_count = {}
    for course in courses_response.data:
        type_val = course.get('type', 'Unknown')
        if type_val not in type_count:
            type_count[type_val] = []
        type_count[type_val].append(course['id'])
    
    for type_val, ids in sorted(type_count.items()):
        print(f"  {type_val}: {len(ids)} courses")
        for id_val in ids:
            print(f"    - {id_val}")
    
    # Check for any data quality issues
    print("\nCourses with potential issues:")
    for course in courses_response.data:
        issues = []
        if not course.get('name'):
            issues.append("Missing name")
        if course.get('type') is None or course.get('type') == '':
            issues.append("Missing type")
        if course.get('semester') != 2:
            issues.append(f"Wrong semester: {course.get('semester')}")
        if issues:
            print(f"  {course['id']}: {', '.join(issues)}")
    
    if not any(len(issues) > 0 for course in courses_response.data for issues in [[]]):
        print("  None - all courses look good")
else:
    print("AIML  Department not found!")

# Also check what's in the JSON file
print("\n\n=== EXPECTED COURSES FROM JSON ===")
with open('doc sources/AIML_Department/sem2_2023.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)
    
total_expected = 0
print("Theory courses:")
for course in json_data['courses'].get('theory_courses', []):
    print(f"  {course['course_code']}: {course['course_title']}")
    total_expected += 1

print("Practical courses:")
for course in json_data['courses'].get('practical_courses', []):
    print(f"  {course['course_code']}: {course['course_title']}")
    total_expected += 1

print("Optional language courses:")
for group in json_data['courses'].get('optional_language_courses', []):
    for course in group.get('courses', []):
        print(f"  {course['course_code']}: {course['course_title']}")
        total_expected += 1

print(f"\nTotal expected: {total_expected}")
