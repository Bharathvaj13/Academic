import type { Subject, Staff, Assignment } from './api';

export interface TimeSlot {
  day: string;
  timeIndex: number; // 0-7 for 8 hours a day
}

export interface ScheduledClass {
  subjectId: string;
  staffId: string;
  day: string;
  timeIndex: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS_PER_DAY = 7; // e.g. 7 hours of classes per day

// Processing is now handled entirely in the API later

/**
 * Generates a weekly timetable based on constraints.
 */
export function generateTimetable(
  subjects: Subject[],
  staffList: Staff[],
  assignments: Assignment[],
  globalBlocks: {staffId: string, day: string, timeIndex: number, subjectId?: string}[] = []
): ScheduledClass[] {
  let schedule: ScheduledClass[] = [];
  
  const subjectToStaff = new Map<string, string>();
  assignments.forEach(a => subjectToStaff.set(a.subjectId, a.staffId));

  const remainingHours = new Map<string, number>();
  const subjectMap = new Map<string, Subject>();
  subjects.forEach(s => {
    subjectMap.set(s.id, s);
    const isOE = s.type === 'OE' || s.name.toLowerCase() === 'oe' || s.name.toLowerCase().includes('open elective');
    if (subjectToStaff.has(s.id) || s.type === 'Common' || isOE) {
      remainingHours.set(s.id, s.hours);
      // Give common/OE subjects a dummy staff if not assigned
      if (!subjectToStaff.has(s.id)) {
        subjectToStaff.set(s.id, 'NO-STAFF-COMMON');
      }
    }
  });

  // Track bookings with subject knowledge for back-to-back checks
  const staffBookings = new Map<string, Map<string, string>>(); // staffId -> "day-time" -> subjectId
  const staffDailyHours = new Map<string, Map<string, number>>(); // staffId -> day -> current hours
  const staffHasLabOnDay = new Map<string, Set<string>>(); // staffId -> Set of days
  const sectionOEWeeklyHours = { current: 0 };

  const initializeStaff = (id: string) => {
    if (!staffBookings.has(id)) staffBookings.set(id, new Map());
    if (!staffDailyHours.has(id)) staffDailyHours.set(id, new Map());
    if (!staffHasLabOnDay.has(id)) staffHasLabOnDay.set(id, new Set());
  };

  staffList.forEach(s => initializeStaff(s.id));
  initializeStaff('NO-STAFF-COMMON');

  // Pre-fill global blocks
  globalBlocks.forEach(block => {
    initializeStaff(block.staffId);
    staffBookings.get(block.staffId)!.set(`${block.day}-${block.timeIndex}`, block.subjectId || 'EXTERNAL-COURSE');
    const currentDayHours = staffDailyHours.get(block.staffId)!.get(block.day) || 0;
    staffDailyHours.get(block.staffId)!.set(block.day, currentDayHours + 1);
  });

  const isTimeAvailable = (subId: string, staffId: string, day: string, time: number) => {
    const sub = subjectMap.get(subId);
    if (!sub) return false;

    // 1. Basic Availability (Slot occupied by staff or already in current section schedule)
    if (staffBookings.get(staffId)?.has(`${day}-${time}`)) return false;
    if (schedule.some(s => s.day === day && s.timeIndex === time)) return false;

    // 2. Staff Daily Load Limit
    const currentDayHours = staffDailyHours.get(staffId)?.get(day) || 0;
    const hasLab = staffHasLabOnDay.get(staffId)?.has(day);
    const maxDayHours = hasLab ? 5 : HOURS_PER_DAY;
    if (currentDayHours >= maxDayHours) return false;

    // 3. No Back-to-Back for Staff
    // Check previous and next slots. If they are booked by a DIFFERENT subject, prevent this assignment.
    const prev = staffBookings.get(staffId)?.get(`${day}-${time - 1}`);
    const next = staffBookings.get(staffId)?.get(`${day}-${time + 1}`);
    if (prev && prev !== subId) return false;
    if (next && next !== subId) return false;

    // 4. OE Limits (Max 5 hours/week, only first 2 hours of day)
    const isOE = sub.name.toLowerCase().includes('open elective') || sub.type === 'OE';
    if (isOE) {
      if (time >= 2) return false;
      if (sectionOEWeeklyHours.current >= 5) return false;
    }

    return true;
  };

  const markTime = (subId: string, staffId: string, day: string, time: number) => {
    const sub = subjectMap.get(subId);
    schedule.push({ subjectId: subId, staffId, day, timeIndex: time });
    remainingHours.set(subId, (remainingHours.get(subId) || 0) - 1);
    
    staffBookings.get(staffId)!.set(`${day}-${time}`, subId);
    
    const dayHours = staffDailyHours.get(staffId)!.get(day) || 0;
    staffDailyHours.get(staffId)!.set(day, dayHours + 1);

    if (sub?.type === 'Lab' || sub?.type === 'Practical') {
      staffHasLabOnDay.get(staffId)!.add(day);
    }
    
    const isOE = sub?.name.toLowerCase().includes('open elective') || sub?.type === 'OE';
    if (isOE) sectionOEWeeklyHours.current += 1;
  };

  // Pass 0: Schedule Open Elective (OE) Rigidly (Mon P1, Tue P1, Fri P1, Sat P1-2)
  // This must happen first so all other subjects avoid these slots.
  const oeSlots = [
    { day: 'Monday', time: 0 },
    { day: 'Wednesday', time: 0 },
    { day: 'Friday', time: 0 },
    { day: 'Saturday', time: 0 },
    { day: 'Saturday', time: 1 },
  ];

  for (const [subId] of Array.from(remainingHours.entries())) {
    const sub = subjectMap.get(subId);
    const isOE = sub && (sub.name.toLowerCase() === 'oe' || sub.name.toLowerCase().includes('open elective') || sub.type === 'OE');
    if (!isOE) continue;

    // OE subjects might not have staff assigned in the departmental scheduler
    const staffId = subjectToStaff.get(subId) || 'NO-STAFF-COMMON';

    for (const slot of oeSlots) {
      if (remainingHours.get(subId)! <= 0) break;
      if (isTimeAvailable(subId, staffId, slot.day, slot.time)) {
        markTime(subId, staffId, slot.day, slot.time);
      } else {
        // If OE fails to schedule even with NO-STAFF-COMMON, it means the slot is blocked by a global block or another common subject.
        throw new Error(`Open Elective (OE) conflict! The slot ${slot.day} Period ${slot.time + 1} is required for OE but is unavailable. Check for overlapping departmental schedules or global staff blocks.`);
      }
    }
  }

  // Pass 1: Schedule Labs (Need 4 contiguous hours, strictly one day)
  for (const [subId] of Array.from(remainingHours.entries())) {
    const sub = subjectMap.get(subId);
    if (!sub || (sub.type !== 'Lab' && sub.type !== 'Practical')) continue;
    const staffId = subjectToStaff.get(subId);
    if (!staffId) continue;
    
    let placed = false;
    const daysShuffled = [...DAYS].sort(() => Math.random() - 0.5);
    
    for (const day of daysShuffled) {
      if (placed) break;
      // Labs MUST be 4 continuous hours.
      const blocksNeeded = 4; 
      
      for (let timeIndex = 0; timeIndex <= HOURS_PER_DAY - blocksNeeded; timeIndex++) {
         let canPlace = true;
         for (let i = 0; i < blocksNeeded; i++) {
             // For lab blocks, we pass the subId to allow internal "back-to-back"
             if (!isTimeAvailable(subId, staffId, day, timeIndex + i)) {
                 canPlace = false;
                 break;
             }
         }
         
         if (canPlace) {
           for (let i = 0; i < blocksNeeded; i++) {
               markTime(subId, staffId, day, timeIndex + i);
           }
           placed = true;
           break;
         }
      }
    }
    
    if (!placed) {
        throw new Error(`Cannot fit 4 continuous hours for laboratory: ${sub.name}. Staff ${staffId} may have back-to-back conflicts or exceeded daily load (5h on lab days).`); 
    }
  }

  // 2. Theory Pass: Enforce 1-hour/day spread where possible
  const daysLoop = [...DAYS];
  daysLoop.forEach(day => {
    for (let timeIndex = 0; timeIndex < HOURS_PER_DAY; timeIndex++) {
      if (schedule.some(s => s.day === day && s.timeIndex === timeIndex)) continue; 
      
      const subjectsToSchedule = Array.from(remainingHours.entries())
          .filter(([_, h]) => h > 0)
          .sort(() => Math.random() - 0.5);

      for (const [subId] of subjectsToSchedule) {
        const sub = subjectMap.get(subId);
        if (sub && (sub.type === 'Lab' || sub.type === 'Practical')) continue;

        const staffId = subjectToStaff.get(subId);
        if (!staffId || !isTimeAvailable(subId, staffId, day, timeIndex)) continue;

        // Enforce 1 hour per day spread initially
        if (schedule.some(s => s.subjectId === subId && s.day === day)) continue;

        markTime(subId, staffId, day, timeIndex);
        break; 
      }
    }
  });

  // 3. Second Pass: Fill any remaining holes
  if (Array.from(remainingHours.values()).some(h => h > 0)) {
    DAYS.forEach(day => {
      for (let timeIndex = 0; timeIndex < HOURS_PER_DAY; timeIndex++) {
        if (schedule.some(s => s.day === day && s.timeIndex === timeIndex)) continue;
        
        const subjectsToSchedule = Array.from(remainingHours.entries())
            .filter(([_, h]) => h > 0)
            .sort(() => Math.random() - 0.5);

        for (const [subId] of subjectsToSchedule) {
          const sub = subjectMap.get(subId);
          if (sub && (sub.type === 'Lab' || sub.type === 'Practical')) continue;
          
          const staffId = subjectToStaff.get(subId);
          if (!staffId || !isTimeAvailable(subId, staffId, day, timeIndex)) continue;

          markTime(subId, staffId, day, timeIndex);
          break;
        }
      }
    });
  }

  // Final validation: check if all hours were placed
  const unplaced = Array.from(remainingHours.entries()).filter(([_, h]) => h > 0);
  if (unplaced.length > 0) {
    const names = unplaced.map(([id]) => subjectMap.get(id)?.name).join(', ');
    throw new Error(`Could not complete schedule. Unplaced subjects: ${names}. Check for staff availability or overlapping constraints.`);
  }

  return schedule;
}
