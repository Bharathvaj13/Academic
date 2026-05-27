import json
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

# Get AIML department ID
aiml_dept_response = supabase.table("departments").select("*").eq("name", "Artificial Intelligence and Machine Learning").execute()
aiml_dept_id = aiml_dept_response.data[0]['id']

print(f"AIML Department ID: {aiml_dept_id}")

# Read AIML sem2 courses from JSON
with open('doc sources/AIML_Department/sem2_2023.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

courses_to_update = []

# Extract all course codes from AIML sem2
for course in json_data['courses'].get('theory_courses', []):
    courses_to_update.append({
        'id': course['course_code'],
        'course_title': course['course_title'],
        'category': course.get('category'),
        'L': course.get('L', 0),
        'T': course.get('T', 0),
        'P': course.get('P', 0),
        'J': course.get('J', 0),
        'credits': course.get('credits'),
        'contact_hours': course.get('contact_hours', 0),
        'type': 'Theory'
    })

for course in json_data['courses'].get('practical_courses', []):
    courses_to_update.append({
        'id': course['course_code'],
        'course_title': course['course_title'],
        'category': course.get('category'),
        'L': course.get('L', 0),
        'T': course.get('T', 0),
        'P': course.get('P', 0),
        'J': course.get('J', 0),
        'credits': course.get('credits'),
        'contact_hours': course.get('contact_hours', 0),
        'type': 'Practical'
    })

for group in json_data['courses'].get('optional_language_courses', []):
    for course in group.get('courses', []):
        courses_to_update.append({
            'id': course['course_code'],
            'course_title': course['course_title'],
            'category': group.get('category', 'OL'),
            'L': group.get('L', 1),
            'T': group.get('T', 0),
            'P': group.get('P', 0),
            'J': group.get('J', 0),
            'credits': group.get('credits', 1),
            'contact_hours': group.get('contact_hours', 15),
            'type': 'Optional'
        })

print(f"\nTotal courses to update: {len(courses_to_update)}")
print("\nUpdating courses to correct department...")

# For each course, update it to point to AIML department
for course_data in courses_to_update:
    course_id = course_data['id']
    
    # Get current course to preserve existing fields
    current = supabase.table('courses').select('*').eq('id', course_id).single().execute()
    
    if current.data:
        # Update the department_id to AIML
        update_data = {
            'department_id': aiml_dept_id,
            'name': course_data['course_title'],
            'type': course_data['type'],
            'hours': course_data['contact_hours'],
            'credits': course_data['credits'],
            'l': course_data['L'],
            't': course_data['T'],
            'p': course_data['P'],
            'j': course_data['J'],
            'year': 1,
            'semester': 2
        }
        
        # Preserve other fields that we don't know about
        for key, value in current.data.items():
            if key not in update_data:
                update_data[key] = value
        
        try:
            supabase.table('courses').update(update_data).eq('id', course_id).execute()
            print(f"✅ Updated {course_id}: {course_data['course_title']}")
        except Exception as e:
            print(f"❌ Error updating {course_id}: {e}")
    else:
        print(f"⚠️  Course {course_id} not found in database")

print("\n✅ Update complete!")

# Verify
print("\n=== VERIFICATION ===")
verify_response = supabase.table("courses").select("*").eq("department_id", aiml_dept_id).eq("semester", 2).execute()
print(f"AIML Semester 2 courses after update: {len(verify_response.data)}")
for course in sorted(verify_response.data, key=lambda x: x['id']):
    print(f"  ✓ {course['id']}: {course['name']}")
