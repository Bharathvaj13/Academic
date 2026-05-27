import requests
import json

url = "https://nifgcsoewgzdhsmcaaxq.supabase.co/rest/v1/"
# Get from seed_database.py
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

print("Checking course_assignments...")
res = requests.get(f"{url}course_assignments?limit=1", headers=headers)
print(res.status_code, res.text)

print("Checking timetables...")
res2 = requests.get(f"{url}timetables?limit=1", headers=headers)
print(res2.status_code, res2.text)
