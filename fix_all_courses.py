import json
import glob
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

# Build mapping of (course_code, year, semester) -> department and course data
expected_courses = {}  # key: (course_code, year, semester), value: (dept_name, course_data)

print("=== BUILDING COURSE MAPPING FROM JSON FILES ===\n")

for filepath in glob.glob("doc sources/**/*.json", recursive=True):
    if "staff" in filepath.lower():
        continue
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "department" not in data or "courses" not in data:
            continue
        
        dept_name = data["department"]
        year = int(data.get("year", 1))
        semester = int(data.get("semester", 1))
        
        # Extract all courses
        courses_list = []
        
        for course in data["courses"].get("theory_courses", []):
            course_code = course.get("course_code")
            if course_code:
                courses_list.append((course_code, {
                    "title": course.get("course_title"),
                    "type": "Theory",
                    "credits": course.get("credits", 0),
                    "contact_hours": course.get("contact_hours", 0),
                    "L": course.get("L", 0),
                    "T": course.get("T", 0),
                    "P": course.get("P", 0),
                    "J": course.get("J", 0),
                }))
        
        for course in data["courses"].get("practical_courses", []):
            course_code = course.get("course_code")
            if course_code:
                courses_list.append((course_code, {
                    "title": course.get("course_title"),
                    "type": "Practical",
                    "credits": course.get("credits", 0),
                    "contact_hours": course.get("contact_hours", 0),
                    "L": course.get("L", 0),
                    "T": course.get("T", 0),
                    "P": course.get("P", 0),
                    "J": course.get("J", 0),
                }))
        
        for group in data["courses"].get("optional_language_courses", []):
            for course in group.get("courses", []):
                course_code = course.get("course_code")
                if course_code:
                    courses_list.append((course_code, {
                        "title": course.get("course_title"),
                        "type": "Optional",
                        "credits": group.get("credits", 1),
                        "contact_hours": group.get("contact_hours", 15),
                        "L": group.get("L", 0),
                        "T": group.get("T", 0),
                        "P": group.get("P", 0),
                        "J": group.get("J", 0),
                    }))
        
        # Store each course
        for course_code, course_data in courses_list:
            key = (course_code, year, semester)
            # Only store if not already seen (first occurrence wins, which is the primary department)
            if key not in expected_courses:
                expected_courses[key] = (dept_name, course_data)
        
        print(f"✓ {dept_name} Year {year} Semester {semester}: {len(courses_list)} courses")
    
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")

total_expected = len(expected_courses)
print(f"\nTotal expected courses: {total_expected}\n")

# Now fix all courses in the database
print("=== FIXING COURSE ASSIGNMENTS ===\n")

fixed_count = 0
dept_cache = {}

for (course_code, year, semester), (dept_name, course_data) in sorted(expected_courses.items()):
    
    # Get department ID (with caching)
    if dept_name not in dept_cache:
        dept_response = supabase.table("departments").select("*").eq("name", dept_name).execute()
        if not dept_response.data:
            print(f"❌ Department '{dept_name}' not found!")
            continue
        dept_cache[dept_name] = dept_response.data[0]["id"]
    
    dept_id = dept_cache[dept_name]
    
    # Update the course
    try:
        update_data = {
            "department_id": dept_id,
            "name": course_data["title"],
            "type": course_data["type"],
            "hours": course_data["contact_hours"],
            "credits": course_data["credits"],
            "l": course_data["L"],
            "t": course_data["T"],
            "p": course_data["P"],
            "j": course_data["J"],
            "year": year,
            "semester": semester,
        }
        
        supabase.table("courses").update(update_data).eq("id", course_code).execute()
        fixed_count += 1
        
        if fixed_count % 50 == 0:
            print(f"  ✓ Fixed {fixed_count}/{total_expected} courses...")
    
    except Exception as e:
        print(f"  ❌ Error updating {course_code}: {e}")

print(f"\n✅ Successfully fixed {fixed_count}/{total_expected} courses\n")

# Final verification
print("=== VERIFICATION ===\n")

verification_issues = 0
for (course_code, year, semester), (dept_name, _) in sorted(expected_courses.items()):
    dept_id = dept_cache[dept_name]
    
    course_response = supabase.table("courses").select("*").eq("id", course_code).execute()
    if course_response.data:
        course_record = course_response.data[0]
        if course_record["department_id"] != dept_id or course_record["year"] != year or course_record["semester"] != semester:
            verification_issues += 1
            if verification_issues <= 10:
                print(f"⚠️  {course_code}: dept={course_record['department_id']}, year={course_record['year']}, sem={course_record['semester']}")
    else:
        verification_issues += 1
        if verification_issues <= 10:
            print(f"❌ {course_code}: NOT FOUND in database")

if verification_issues == 0:
    print(f"✅ All {total_expected} courses are correctly assigned!")
else:
    print(f"\n⚠️  Found {verification_issues} verification issues")

print("\n🎉 Course assignment fix complete!")
