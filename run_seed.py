import traceback
try:
    with open('seed_database.py', 'r', encoding='utf-8') as f:
        exec(f.read())
except Exception as e:
    with open('seed_error.txt', 'w', encoding='utf-8') as f:
        traceback.print_exc(file=f)
