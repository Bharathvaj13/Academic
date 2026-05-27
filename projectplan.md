Academic Scheduler System   Project Idea / Concept Document
1.Problem Statement
Educational institutions often face challenges in creating academic timetables for classes and staff due to multiple constraints such as subject hours, faculty specialization, department requirements, and avoiding scheduling conflicts.
Manual scheduling is time-consuming and prone to errors such as:
•	Overlapping staff schedules
•	Incorrect subject allocations
•	Difficulty managing multiple classes and departments
The proposed Academic Scheduler System aims to automate the creation of class timetables and staff schedules using a logical scheduling mechanism that considers academic constraints and real-time availability.
This system will help administrators efficiently generate, manage, and monitor academic schedules while ensuring that conflicts are avoided and resources are optimally utilized.
2. Project Objective
The main objective of this project is to develop an automated academic timetable and staff scheduling system that:
•	Collects curriculum and department details.
•	Assigns staff to subjects based on their domain and specialization.
•	Automatically generates class schedules while following predefined constraints.
•	Updates staff timetables automatically.
•	Displays real-time schedule status.
3. Key Operations
1. Curriculum and Department Data Collection
The system should collect and store:
•	Department details
•	Academic batches
•	Curriculum structure
•	Subject information
Once entered, the data will be displayed on the dashboard for easy access.

2. Staff Domain and Specialization Mapping
Each subject belongs to a specific academic domain.
The system will:
•	Tag each subject with its domain or specialization.
•	Assign staff members based on their expertise and specialization.
•	Ensure that only qualified staff are assigned to the appropriate subjects.

3. Conflict-Free Timetable Scheduling
The system must ensure that:
•	No staff member is assigned to two classes at the same time.
•	Subjects follow their minimum hours per week requirement.
•	Special constraints (e.g., certain subjects only in morning sessions) are maintained.
The system may use AI-based scheduling logic or constraint-based algorithms to automatically generate optimized timetables.

4. Workflow Structure
4.1 Pages in the System
1. Admin Login
The administrator logs into the system to manage:
1.Departments   2 .Courses   3. Staff details    4.  Timetable scheduling

2. Mode Selection Page
The administrator selects one of the two modes:
Mode 1: Class Academic Scheduler       |        Mode 2: Staff Academic Scheduler

3. Staff Search
The admin can search staff members using:
Department selection  |  Staff name search

4. Department Class List
The system displays the list of classes within each department.
Example:
Department: CSE
Year	Section	Courses
1st Year	A	7 Courses (4 Theory + 3 Lab)
2nd Year	A/B	Courses with subject codes
3rd Year	A/B	Courses with subject codes
4th Year	A/B	Courses with subject codes
Each course will include:
•	Subject Code
•	Subject Name
•	Type (Theory / Lab)
5. Class Academic Scheduler Mode
Homepage
Two options will be available:
1.	Create New Scheduler
2.	View Existing Scheduler
Create Scheduler
The administrator must select the following parameters:
•	Regulation
•	Academic Batch Year
•	Department
•	Current Year
•	Semester
After filtering, the system will:
•	Display all courses on the left side
•	Display available staff members on the right side
The admin can then assign staff members to courses.

Scheduling Constraints
Each course will have scheduling rules such as:
•	Minimum hours per week
•	Lab session duration
•	Specific time slot constraints
(Example: Some subjects only in the first two hours)
The system will automatically generate the weekly timetable based on these constraints using intelligent scheduling logic.

Automatic Staff Schedule Update
Once the class timetable is generated:
•	Staff schedules will be automatically updated.
•	Any scheduling conflicts will be prevented.
Mode Switching
•	The system will allow the user to switch to Staff Scheduler Mode.

6. Staff Scheduler Mode
Staff Homepage
Each staff member will have an individual timetable showing:
•	Assigned classes
•	Subjects
•	Time slots
The system will ensure there is no schedule collision between different class assignments.
Schedule Status Indicators
The timetable will display real-time status using color indicators:
•	🟢 Green – Current ongoing class (based on real-time timestamp)
•	⚪ Grey – Completed or already assigned sessions
•	🔵 Blue – Upcoming scheduled classes

7. Expected Features
•	Automated timetable generation
•	Staff specialization mapping
•	Conflict-free scheduling
•	Real-time timetable tracking
•	Department-wise schedule management
•	Staff-wise schedule view
•	Intelligent scheduling using AI/constraint logic


Techstack:

Frontend : react
Backend : Supabase
AI scheduling and allocation based on the constraints



Last Stage of Building

Stage 1:
Create common subjects that are applicable to all classes.
Courses include:
•	Library 
•	Counselling 
•	Seminar 
•	Soft Skills 
•	Aptitude 
Open Elective (OE): A constraint should be set on the front end.  OE courses can only be selected during the first two hours.
Stage2:
The class hour constraints must be updated in the backend based on the assigned credits. For courses with 3 credits, the maximum allowed is 4 hours per week, while 4-credit courses can have up to 5 hours per week. Courses with 1 or 2 theory credits should have a maximum of 1 to 2 hours per week. Laboratory courses must be scheduled for 4 continuous hours per week and should be conducted on a single day.


Key and core logic:

There is an issue with fetching staff data, as it is not working correctly. Another logic problem has been identified in staff assignment. If a staff member is already assigned to a course (for example, CSE A), the system prevents assigning the same staff member again to the same course, even when the classes and academic years are different. This restriction is incorrect because the course may be the same, but it belongs to different sections or years.

The constraint logic for timetable generation should instead focus on avoiding time conflicts rather than blocking assignments based on course names. A staff member can handle the same course for multiple classes, but they must not be assigned to two different classes at the same time.

For example, if a staff member named “Arc” is assigned to Data Structures on Monday during the 3rd hour, the system should prevent assigning the same staff member to any other class during that same time slot. In such cases, a warning should be triggered indicating that the staff member is already allocated at that time.



Timetable Generation Constraints:

The timetable should follow a maximum of 7 hours per day and 42 hours per week. However, the typical schedule is limited to 35 hours per week, with Saturdays occasionally treated as holidays.
While adding common courses, users should have the flexibility to allocate up to 2 hours per week for each subject based on their preference.
Laboratory courses must be scheduled as a continuous block of 4 hours on a single day and should not be split across multiple days, satisfying the total of 4 hours per week.
Open Elective (OE) courses must be scheduled only within the first two hours of the day, with a maximum of 5 hours per week.
Class hour constraints must be enforced in the backend based on course credits. Courses with 3 credits can have a maximum of 4 hours per week, while 4-credit courses can have up to 5 hours per week. Courses with 1 or 2 theory credits are limited to 1–2 hours per week. Laboratory courses must follow the fixed rule of 4 continuous hours per week on a single day.


OE Scheduling Constraint

A new page needs to be created for the Open Elective (OE) Class Scheduler.

This page should function similarly to the existing Class Scheduler but must be dedicated exclusively to scheduling Open Elective subjects.

The scheduling system should follow the same logic and structure as the current Class Scheduler page.

The subject and staff details should be available on this page. Staff data is already loaded. The following OE subjects need to be included:

U23ADS1003 – Software Engineering
U23BM1002 – Basic Life Support
U23BM1004 – Hospital Management
U23CE1008 – Municipal Solid Waste Management
U23CE1009 – Energy Efficiency and Green Building
U23CS1010 – Cloud Computing
U23EC1009 – Sensors and Smart Structures Technologies
U23EE1013 – Energy Conservation and Auditing
U23EE1021 – Innovation, IPR and Entrepreneurship Development
U23FT1001 – Fundamentals of Fashion Design
U23IT1002 – Introduction to Database Technology
U23MC1008 – Fundamentals of Robotics
U23MC1009 – Smart Automation

All faculty members should be listed and available for selection.

This scheduler should allow the user to select and schedule an OE subject, and once scheduled, it must automatically update the corresponding Staff Timetable.