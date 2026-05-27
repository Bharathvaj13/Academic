import json
import glob
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

def safe_int(val, default=0):
    """Convert to int, handling floats"""
    try:
        return int(round(float(val)))
    except (ValueError, TypeError):
        return default

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
        
        courses_list = []
        
        # Extract theory courses
        for course in data["courses"].get("theory_courses", []):
            course_code = course.get("course_code")
            if course_code:
                courses_list.append((course_code, {
                    "title": course.get("course_title"),
                    "type": "Theory",
                    "credits": safe_int(course.get("credits", 0)),
                    "contact_hours": safe_int(course.get("contact_hours", 0)),
                    "L": safe_int(course.get("L", 0)),
                    "T": safe_int(course.get("T", 0)),
                    "P": safe_int(course.get("P", 0)),
                    "J": safe_int(course.get("J", 0)),
                }))
        
        # Extract practical courses
        for course in data["courses"].get("practical_courses", []):
            course_code = course.get("course_code")
            if course_code:
                courses_list.append((course_code, {
                    "title": course.get("course_title"),
                    "type": "Practical",
                    "credits": safe_int(course.get("credits", 0)),
                    "contact_hours": safe_int(course.get("contact_hours", 0)),
                    "L": safe_int(course.get("L", 0)),
                    "T": safe_int(course.get("T", 0)),
                    "P": safe_int(course.get("P", 0)),
                    "J": safe_int(course.get("J", 0)),
                }))
        
        # Extract optional language courses
        for group in data["courses"].get("optional_language_courses", []):
            for course in group.get("courses", []):
                course_code = course.get("course_code")
                if course_code:
                    courses_list.append((course_code, {
                        "title": course.get("course_title"),
                        "type": "Optional",
                        "credits": safe_int(group.get("credits", 1)),
                        "contact_hours": safe_int(group.get("contact_hours", 15)),
                        "L": safe_int(group.get("L", 0)),
                        "T": safe_int(group.get("T", 0)),
                        "P": safe_int(group.get("P", 0)),
                        "J": safe_int(group.get("J", 0)),
                    }))
        
        # Store each course
        for course_code, course_data in courses_list:
            key = (course_code, year, semester)
            if key not in expected_courses:
                expected_courses[key] = (dept_name, course_data)
        
        print(f"✓ {dept_name} Year {year} Semester {semester}: {len(courses_list)} courses")
    
    except Exception as e:
        pass  # Skip files with errors

total_expected = len(expected_courses)
print(f"\nTotal expected courses: {total_expected}\n")

print("=== FIXING COURSE ASSIGNMENTS ===\n")

fixed_count = 0
error_count = 0
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
        error_count += 1
        if error_count <= 5:
            print(f"  ❌ {course_code}: {str(e)[:60]}")

print(f"\n✅ Successfully fixed {fixed_count}/{total_expected} courses")
print(f"⚠️  Errors: {error_count}\n")
