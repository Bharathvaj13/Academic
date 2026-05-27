from supabase import create_client, Client

url: str = "https://nifgcsoewgzdhsmcaaxq.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZmdjc29ld2d6ZGhzbWNhYXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MzQ1NCwiZXhwIjoyMDg5NjM5NDU0fQ.LcTZ-FLYrE8dZUDbSN9cbZL-K9W343LMYh442T19lCc"

supabase: Client = create_client(url, key)

def fix_oe_subjects():
    print("Fetching IT department...")
    res = supabase.table("departments").select("id").ilike("name", "%information technology%").execute()
    if not res.data:
        print("IT department not found.")
        return
    
    dept_id = res.data[0]["id"]
    subjects = [
        {"id": "U23ADS1003", "name": "Software Engineering"},
        {"id": "U23BM1002", "name": "Basic Life Support"},
        {"id": "U23BM1004", "name": "Hospital Management"},
        {"id": "U23CE1008", "name": "Municipal Solid Waste Management"},
        {"id": "U23CE1009", "name": "Energy Efficiency and Green Building"},
        {"id": "U23CS1010", "name": "Cloud Computing"},
        {"id": "U23EC1009", "name": "Sensors and Smart Structures Technologies"},
        {"id": "U23EE1013", "name": "Energy Conservation and Auditing"},
        {"id": "U23EE1021", "name": "Innovation, IPR and Entrepreneurship Development"},
        {"id": "U23FT1001", "name": "Fundamentals of Fashion Design"},
        {"id": "U23IT1002", "name": "Introduction to Database Technology"},
        {"id": "U23MC1008", "name": "Fundamentals of Robotics"},
        {"id": "U23MC1009", "name": "Smart Automation"}
    ]

    formatted = []
    for sub in subjects:
        formatted.append({
            **sub,
            "department_id": dept_id,
            "type": "OE",
            "hours": 5,
            "credits": 3,
            "weekly_hours": 5,
            "l": 3, "t": 0, "p": 2, "j": 0,
            "year": 3,
            "semester": 6
        })

    print("Upserting subjects...")
    try:
        supabase.table("courses").upsert(formatted, on_conflict="id").execute()
        print("✅ Successfully added all 13 OE subjects to Supabase.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_oe_subjects()
