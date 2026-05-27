import json
import glob
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

# Build expected courses from JSON
expected_by_dept_sem = {}  # (dept_name, year, semester) -> set of course codes

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
        
        if key not in expected_by_dept_sem:
            expected_by_dept_sem[key] = set()
        
        for course in data["courses"].get("theory_courses", []):
            if course.get("course_code"):
                expected_by_dept_sem[key].add(course["course_code"])
        
        for course in data["courses"].get("practical_courses", []):
            if course.get("course_code"):
                expected_by_dept_sem[key].add(course["course_code"])
        
        for group in data["courses"].get("optional_language_courses", []):
            for course in group.get("courses", []):
                if course.get("course_code"):
                    expected_by_dept_sem[key].add(course["course_code"])
    
    except:
        pass

print("=== VERIFYING ALL DEPARTMENTS AND SEMESTERS ===\n")

total_depts = len(expected_by_dept_sem)
correct_depts = 0
all_issues = []

for (dept_name, year, semester), expected_codes in sorted(expected_by_dept_sem.items()):
    # Get department
    dept_response = supabase.table("departments").select("*").eq("name", dept_name).execute()
    if not dept_response.data:
        print(f"❌ {dept_name} Y{year}S{semester}: Department not found")
        all_issues.append((dept_name, year, semester, f"Department not found"))
        continue
    
    dept_id = dept_response.data[0]["id"]
    
    # Get courses for this department, year, semester
    courses_response = supabase.table("courses").select("*").eq("department_id", dept_id).eq("year", year).eq("semester", semester).execute()
    actual_codes = {c["id"] for c in courses_response.data}
    
    expected_count = len(expected_codes)
    actual_count = len(actual_codes)
    
    if actual_codes == expected_codes:
        print(f"✅ {dept_name} Y{year}S{semester}: {actual_count}/{expected_count} courses ✓")
        correct_depts += 1
    else:
        missing = expected_codes - actual_codes
        extra = actual_codes - expected_codes
        
        print(f"⚠️  {dept_name} Y{year}S{semester}: {actual_count}/{expected_count} courses")
        
        if missing:
            all_issues.append((dept_name, year, semester, f"{len(missing)} missing: {', '.join(sorted(list(missing)[:3]))}{'...' if len(missing) > 3 else ''}"))
            print(f"     Missing: {', '.join(sorted(list(missing)[:3]))}")
            if len(missing) > 3:
                print(f"     ... and {len(missing)-3} more")
        
        if extra:
            print(f"     Extra: {', '.join(sorted(list(extra)[:3]))}")
            if len(extra) > 3:
                print(f"     ... and {len(extra)-3} more")

print(f"\n{'='*60}")
print(f"SUMMARY: {correct_depts}/{total_depts} departments/semesters verified correctly")
print(f"{'='*60}\n")

if all_issues:
    print("ISSUES FOUND:")
    for dept, year, sem, issue in all_issues:
        print(f"  • {dept} Y{year}S{sem}: {issue}")
else:
    print("✅ ALL DEPARTMENTS AND SEMESTERS ARE CORRECTLY CONFIGURED!")
