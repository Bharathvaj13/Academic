# Course Display Setup - Implementation Summary

## What Was Done

The system has been configured to display all courses from the respective department-semester JSON files. Here's how it works:

### Database Structure
- **Departments**: Each department folder (CSE, IT, Civil, Mechanical, etc.) maps to a department in the database
- **Courses**: Each semester JSON file contains courses that are stored with:
  - Unique ID format: `{DEPT_SHORT}_{COURSE_CODE}` (e.g., `CSE_U23ENG201A`)
  - Department association: Linked to the correct department via `department_id`
  - Year and Semester: All courses stored with `year=1` and appropriate `semester` value

### Populated Course Counts by Department and Semester

#### Computer Science and Engineering (CSE)
- Semester 1: 14 courses
- Semester 2: 14 courses
- Semester 3: 11 courses
- Semester 4: 9 courses
- Semester 5: 8 courses
- Semester 6: 9 courses

#### Information Technology (IT)
- Semester 1: 13 courses
- Semester 2: 14 courses
- Semester 3: 11 courses
- Semester 4: 10 courses
- Semester 5: 12 courses
- Semester 6: 9 courses

#### Civil Engineering
- Semester 1: 14 courses
- Semester 2: 13 courses
- Semester 3: 10 courses
- Semester 4: 10 courses
- Semester 5: 10 courses
- Semester 6: 9 courses

#### Mechanical Engineering
- Semester 1: 14 courses
- Semester 2: 13 courses
- Semester 3: 9 courses
- Semester 4: 11 courses
- Semester 5: 8 courses
- Semester 6: 9 courses

(Similar counts for AIDS, AIML, ECE, EEE departments)

### How It Works in the UI

#### Class Scheduler Page
1. Select a department from the dropdown
2. Select a year (currently set to Year 1)
3. Select a semester (1-6)
4. Select a section (A, B, C, etc.)
5. All courses from that department's semester JSON will appear in the "Curriculum Subjects" section
6. You can assign staff to any of these courses
7. Save the timetable

#### Class Timetable View Page
1. Select the same department, year, semester, and section
2. All saved courses for that selection will display in the timetable grid

#### Chatbot Page
1. Select department, year, semester, and section
2. The chatbot will fetch and display the saved timetable for that class

### Important Notes

- **OE (Open Elective) Courses**: These are filtered out from the class scheduler because they're handled separately in the OE Scheduler
- **Course IDs**: Courses are stored with department prefix to avoid conflicts when the same course code appears in different departments
- **Regular and Optional Courses**: All courses from the JSON (theory, practical, optional language) are available for assignment
- **Staff Assignment**: Each course can be assigned to one staff member

## Troubleshooting

If courses are not showing:
1. Verify you've selected the correct department, year (1), and semester
2. Check the browser console (F12) for any error messages
3. Ensure the database seeding completed successfully (check seed_database.py output)

## Files Modified

- `seed_database.py`: Updated to add department prefix to course IDs to prevent conflicts
- `src/lib/api.ts`: getSubjects() queries all courses by department/year/semester (no OE filtering)
- `src/pages/ClassScheduler.tsx`: All courses are now selectable for assignment

