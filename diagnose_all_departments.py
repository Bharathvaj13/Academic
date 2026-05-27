import json
import glob
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

dept_mapping = {
    "CSE": "Computer Science and Engineering",
    "IT": "Information Technology",
    "EEE": "Electrical and Electronics Engineering",
    "ECE": "Electronics and Communication Engineering",
    "MECH": "Mechanical Engineering",
    "CIVIL": "Civil Engineering",
    "MBA": "Management Studies"
}

# Build expected courses from JSON files
expected_courses = {}  # key: (dept_name, year, semester), value: {course_code: course_data}

print("=== ANALYZING JSON FILES ===\n")

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
        key = (dept_name, year, semester)
        
        if key not in expected_courses:
            expected_courses[key] = {}
        
        # Extract theory courses
        for course in data["courses"].get("theory_courses", []):
            course_code = course.get("course_code")
            if course_code:
                expected_courses[key][course_code] = {
                    "title": course.get("course_title"),
                    "type": "Theory",
                    "credits": course.get("credits", 0),
                    "contact_hours": course.get("contact_hours", 0),
                    "L": course.get("L", 0),
                    "T": course.get("T", 0),
                    "P": course.get("P", 0),
                    "J": course.get("J", 0),
                }
        
        # Extract practical courses
        for course in data["courses"].get("practical_courses", []):
            course_code = course.get("course_code")
            if course_code:
                expected_courses[key][course_code] = {
                    "title": course.get("course_title"),
                    "type": "Practical",
                    "credits": course.get("credits", 0),
                    "contact_hours": course.get("contact_hours", 0),
                    "L": course.get("L", 0),
                    "T": course.get("T", 0),
                    "P": course.get("P", 0),
                    "J": course.get("J", 0),
                }
        
        # Extract optional language courses
        for group in data["courses"].get("optional_language_courses", []):
            for course in group.get("courses", []):
                course_code = course.get("course_code")
                if course_code:
                    expected_courses[key][course_code] = {
                        "title": course.get("course_title"),
                        "type": "Optional",
                        "credits": group.get("credits", 1),
                        "contact_hours": group.get("contact_hours", 15),
                        "L": group.get("L", 0),
                        "T": group.get("T", 0),
                        "P": group.get("P", 0),
                        "J": group.get("J", 0),
                    }
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

print(f"Found {len(expected_courses)} department-year-semester combinations in JSON files")
print(f"Total expected courses: {sum(len(courses) for courses in expected_courses.values())}\n")

# Now check what's in the database
print("=== CHECKING DATABASE ===\n")

misassigned_courses = []
missing_courses = []
total_checked = 0
total_corrected = 0

for (dept_name, year, semester), courses_dict in sorted(expected_courses.items()):
    print(f"Checking {dept_name} Year {year} Semester {semester}...")
    
    # Get department ID
    dept_response = supabase.table("departments").select("*").eq("name", dept_name).execute()
    if not dept_response.data:
        print(f"  ❌ Department '{dept_name}' not found in database!")
        continue
    
    dept_id = dept_response.data[0]["id"]
    
    # Check each course
    for course_code, course_data in courses_dict.items():
        total_checked += 1
        
        # Find the course in database
        course_response = supabase.table("courses").select("*,departments(name)").eq("id", course_code).execute()
        
        if not course_response.data:
            missing_courses.append({
                "code": course_code,
                "title": course_data["title"],
                "dept": dept_name,
                "year": year,
                "semester": semester
            })
            print(f"    ❌ MISSING: {course_code}")
        else:
            course_record = course_response.data[0]
            actual_dept = course_record["departments"]["name"] if course_record["departments"] else "Unknown"
            
            # Check if it's assigned to the correct department
            if course_record["department_id"] != dept_id:
                misassigned_courses.append({
                    "code": course_code,
                    "title": course_data["title"],
                    "expected_dept": dept_name,
                    "actual_dept": actual_dept,
                    "dept_id": dept_id,
                    "year": year,
                    "semester": semester,
                    "course_data": course_data
                })
                print(f"    ⚠️  MISASSIGNED: {course_code} is in {actual_dept} but should be in {dept_name}")
            else:
                print(f"    ✓ OK: {course_code}")

print(f"\n=== SUMMARY ===")
print(f"Total courses checked: {total_checked}")
print(f"Missing courses: {len(missing_courses)}")
print(f"Misassigned courses: {len(misassigned_courses)}")

if missing_courses:
    print("\n⚠️  MISSING COURSES:")
    for course in missing_courses[:20]:  # Show first 20
        print(f"    {course['code']}: {course['title']} ({course['dept']} Y{course['year']}S{course['semester']})")
    if len(missing_courses) > 20:
        print(f"    ... and {len(missing_courses) - 20} more")

if misassigned_courses:
    print(f"\n⚠️  MISASSIGNED COURSES ({len(misassigned_courses)} total):")
    for course in misassigned_courses[:20]:  # Show first 20
        print(f"    {course['code']}: {course['title']}")
        print(f"       Currently in: {course['actual_dept']}")
        print(f"       Should be in: {course['expected_dept']}")
    if len(misassigned_courses) > 20:
        print(f"    ... and {len(misassigned_courses) - 20} more")
