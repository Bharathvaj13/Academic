# Academia — Faculty Timetable Management System

A web-based academic timetable scheduling system built with **React + Vite + Supabase**.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- A [Supabase](https://supabase.com/) project with the required schema

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/CaneCilia/academia.git
cd academia
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these values from your Supabase project → **Settings → API**.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Supabase Database Schema

Make sure the following tables exist in your Supabase project:

| Table               | Key Columns                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `departments`       | `id`, `name`                                                                |
| `staff`             | `id`, `name`, `department_id`, `specialization`, `hours`, `courses_assigned` |
| `courses`           | `id`, `name`, `department_id`, `type`, `semester`, `year`, `credits`, `weekly_hours` |
| `course_assignments`| `id`, `course_id`, `staff_id`, `section`, `created_at`                     |
| `timetables`        | `id`, `course_id`, `staff_id`, `day_of_week`, `time_slot`, `section`       |

---

## Available Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start local development server       |
| `npm run build` | Build for production                 |
| `npm run lint`  | Run ESLint                           |
| `npm run preview` | Preview the production build       |

---

## Features

- **Dashboard** — Overview with recent staff assignment activity
- **Class Scheduler** — Generate AI-assisted timetables per section (A/B/C)
- **OE Scheduler** — Assign staff to Open Elective subjects with rigid Monday/Wednesday/Friday/Saturday slots
- **Staff Directory** — Browse all faculty with workload metrics
- **Staff Timetable** — Individual weekly schedule per staff member
- **Saved Class Timetables** — View saved schedules filtered by Department, Year, Semester, and Section
- **Conflict Detection** — Prevents double-booking across sections and OE rigid slots

---

## Project Structure

```
src/
├── lib/
│   ├── api.ts              # Supabase API calls
│   └── schedulerWorker.ts  # AI heuristic timetable engine
├── pages/
│   ├── Dashboard.tsx
│   ├── ClassScheduler.tsx
│   ├── OEScheduler.tsx
│   ├── StaffDirectory.tsx
│   ├── StaffTimetable.tsx
│   └── ClassTimetableView.tsx
└── App.tsx                 # Routing
```
