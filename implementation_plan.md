# Academic Scheduler System - Implementation Plan

## Goal Description
The objective is to build an Academic Scheduler System using React, Supabase, and implement an AI/constraint-based scheduling algorithm. The system will automate the creation of class timetables and staff schedules while avoiding conflicts and following predefined constraints.

## User Review Required
> [!IMPORTANT]
> The AI scheduling module will be implemented as a heuristic-based constraint satisfaction algorithm running on the frontend (perhaps in a Web Worker to keep the UI responsive) or a Supabase Edge Function if performance requires it. For now, the plan is to use a frontend web worker algorithm.
> Please review the database schema and architecture below to confirm it aligns with expectations.
> Also, please provide your Supabase Project URL and Anon Key when we begin the execution phase, or let me know if you would like me to set up a mock backend first.

## Proposed Changes

### 1. Project Initialization & Tooling
- Initialize a React application using Vite and TypeScript in `d:\GitDesk\academia`.
- Install TailwindCSS for styling, React Router for navigation, and `lucide-react` for icons.
- Install `@supabase/supabase-js` for database connectivity and auth.

### 2. Database Design (Supabase)
We will define the following tables in Supabase:
- `departments`: id, name
- `staff`: id, name, department_id, specialization, max_courses, max_hours, current_workload
- `courses`: id, subject_code, subject_name, type (theory/lab), domain, min_hours_per_week, department_id, year, semester
- `classes`: id, department_id, year, regulation, semester, section
- `course_assignments`: id, class_id, course_id, staff_id
- `timetables`: id, class_id, day_of_week, time_slot, course_id, staff_id

### 3. Frontend Architecture
#### [NEW] `src/App.tsx`
Set up React Router with the following routes:
- `/login`: Admin login using Supabase Auth
- `/dashboard`: Mode Selection Page (Class Scheduler vs Staff Scheduler)
- `/admin/staff`: Staff Search and Management
- `/admin/departments`: Department Class List
- `/admin/scheduler`: Class Academic Scheduler Module. Includes:
  - Left Sidebar: All subject names and IDs for the selected config.
  - Right Staff Panel: Faculty members with specializations and a search bar by name or specialization.
  - Center: Interactive timetable viewer and recent updates / work log.
- `/staff/schedule`: Staff Scheduler Mode (Individual Timetable)

#### [NEW] `src/lib/schedulerWorker.ts`
Implement a backtracking constraint satisfaction algorithm (or genetic algorithm approximation) to generate a conflict-free timetable based on minimum hours, lab durations, and staff availability.
Constraints Include:
- Max 5 courses assigned per staff member.
- Max 25 hours overall workload per staff member.
- These limits will be enforced directly in the assignment UI and tracked in the Database.

#### [NEW] `src/components/*`
Create reusable UI components using Tailwind CSS for a premium, modern design, incorporating glassmorphism and dynamic animations.

## Verification Plan

### Automated Tests
- Scaffold Vitest for the scheduling algorithm logic.
- Run `npm run test` to execute scenarios testing the scheduling constraints (e.g., ensuring no staff is double-booked).

### Manual Verification
- Run `npm run dev` to start the frontend.
- Launch a browser subagent to verify routing, login, and UI rendering of the scheduler components.
- Manually run the schedule generation on mock data and visually inspect the output in the browser to ensure constraints are respected.
