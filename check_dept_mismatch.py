import json
from supabase import create_client, Client

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"
supabase: Client = create_client(url, key)

print("=== DEPARTMENTS IN DATABASE ===")
depts_response = supabase.table("departments").select("*").order("name").execute()
for dept in depts_response.data:
    print(f"  {dept['name']}")

print("\n=== CHECKING JSON FILES FOR DEPARTMENT NAMES ===")
import glob
import os

dept_names_in_json = {}
for filepath in glob.glob("doc sources/**/*.json", recursive=True):
    if "staff" in filepath.lower():
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if "department" in data:
                dept_name = data["department"]
                if dept_name not in dept_names_in_json:
                    dept_names_in_json[dept_name] = []
                dept_names_in_json[dept_name].append(filepath)
        except:
            pass

for dept_name, files in sorted(dept_names_in_json.items()):
    print(f"\n{dept_name}")
    for f in files:
        print(f"  - {f}")
