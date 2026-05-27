import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Staff {
  id: string;
  name: string;
  specialization: string;
  max_courses: number;
  max_hours: number;
  courses_assigned: number;
  hours: number;
}

export interface Subject {
  id: string; // Maps to course_code
  name: string; // Maps to course_title
  type: string; // Theory, Practical, Optional
  hours: number; // contact_hours
  credits?: number;
  weekly_hours?: number; // l + t + p + j
  l?: number;
  t?: number;
  p?: number;
  j?: number;
  year?: number;
  semester?: number;
}

export interface Assignment {
  subjectId: string;
  staffId: string;
}

export const api = {
  async getDepartments() {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getStaff(departmentId?: string) {
    // Fetch staff directly from Supabase
    let query = supabase.from('staff').select('*').order('name');
    if (departmentId) query = query.eq('department_id', departmentId);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    // Deduplicate by name, keeping the one with the most courses assigned as the master record
    const uniqueMap = new Map();
    for (const s of (data || [])) {
        const existing = uniqueMap.get(s.name);
        if (!existing || s.courses_assigned > (existing.courses_assigned || 0)) {
            uniqueMap.set(s.name, s);
        }
    }
    const deduplicatedData = Array.from(uniqueMap.values());

    // Convert to camelCase mapped properties for the frontend
    return deduplicatedData.map(s => ({
      ...s,
      maxCourses: 5, // Refactored to hard limit 5
      maxHours: 20,   // Refactored to hard limit 20
      coursesAssigned: s.courses_assigned || 0,
      hours: s.hours || 0
    }));
  },

  async getStaffById(id: string) {
    const { data, error } = await supabase.from('staff').select('*, departments(name)').eq('id', id).single();
    if (error) throw new Error(error.message);
    
    // Sometimes departments(name) returns an array or single standard object depending on relation
    const deptInfo = Array.isArray(data.departments) ? data.departments[0] : data.departments;
    
    return {
      ...data,
      departmentName: deptInfo?.name,
      maxCourses: 5, // Refactored limit
      maxHours: 20,   // Refactored limit
      coursesAssigned: data.courses_assigned
    };
  },

  async getStaffTimetable(staffId: string) {
    // We need timetables joined with courses
    const { data, error } = await supabase
      .from('timetables')
      .select('*, courses(*)')
      .eq('staff_id', staffId);
      
    if (error) {
       // if the join fails due to fk constraints not being explicitly named, fallback to manual mapping
       const plainRes = await supabase.from('timetables').select('*').eq('staff_id', staffId);
       if (plainRes.error) throw new Error(plainRes.error.message);
       
       const cRes = await supabase.from('courses').select('*');
       if (cRes.error) throw new Error(cRes.error.message);
       
       return plainRes.data.map(slot => ({
          ...slot,
          courses: cRes.data.find(c => c.id === slot.course_id)
       }));
    }
    
    return data || [];
  },
  
  async getSubjects(departmentId?: string, yearFilter?: number, semesterFilter?: number) {
    let query = supabase.from('courses').select('*');
    
    if (departmentId) query = query.eq('department_id', departmentId);
    if (yearFilter) query = query.eq('year', yearFilter);
    if (semesterFilter) query = query.eq('semester', semesterFilter);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const processed: Subject[] = (data || [])
      .filter(row => {
        const isOE = row.type === 'OE' || row.name.toLowerCase() === 'oe' || row.name.toLowerCase().includes('open elective');
        return !isOE;
      })
      .map(row => {
        let adjustedHours = row.weekly_hours || row.hours || 3;
        const type = row.type || 'Theory';

        if (type !== 'Lab' && type !== 'Practical' && type !== 'Practical_Project' && type !== 'Project') {
          const credits = row.credits || 0;
          if (credits === 3) {
            adjustedHours = Math.min(adjustedHours, 4);
          } else if (credits >= 4) {
            adjustedHours = Math.min(adjustedHours, 5);
          } else if (credits === 1 || credits === 2) {
            adjustedHours = Math.min(adjustedHours, 2);
          }
        } else if (type === 'Lab' || type === 'Practical') {
          adjustedHours = 4;
        }

        return {
          id: row.id,
          name: row.name,
          type: type,
          hours: adjustedHours,
          credits: row.credits,
          weekly_hours: row.weekly_hours,
          l: row.l, t: row.t, p: row.p, j: row.j,
          year: row.year,
          semester: row.semester
        };
      });

    const commonSubjects: Subject[] = [
      { id: 'COMMON-LIB', name: 'Library', type: 'Common', hours: 1, credits: 0, weekly_hours: 1, l: 0, t: 0, p: 0, j: 0, year: 1, semester: semesterFilter || 1 },
      { id: 'COMMON-COUNSEL', name: 'Counselling', type: 'Common', hours: 1, credits: 0, weekly_hours: 1, l: 0, t: 0, p: 0, j: 0, year: 1, semester: semesterFilter || 1 },
      { id: 'COMMON-SEM', name: 'Seminar', type: 'Common', hours: 1, credits: 0, weekly_hours: 1, l: 0, t: 0, p: 0, j: 0, year: 1, semester: semesterFilter || 1 },
      { id: 'COMMON-SOFT', name: 'Soft Skills', type: 'Common', hours: 2, credits: 0, weekly_hours: 2, l: 0, t: 0, p: 0, j: 0, year: 1, semester: semesterFilter || 1 },
      { id: 'COMMON-APT', name: 'Aptitude', type: 'Common', hours: 2, credits: 0, weekly_hours: 2, l: 0, t: 0, p: 0, j: 0, year: 1, semester: semesterFilter || 1 },
    ];

    if (semesterFilter === 6 || semesterFilter === 7) {
      commonSubjects.push({ 
        id: 'COMMON-OE', 
        name: 'OPEN ELECTIVE', 
        type: 'OE', 
        hours: 5, 
        credits: 3, 
        weekly_hours: 5, 
        l: 3, t: 0, p: 0, j: 0, 
        year: Math.ceil(semesterFilter / 2), 
        semester: semesterFilter 
      });
    }

    return [...processed, ...commonSubjects];
  },

  async getAssignments(section?: string) {
    let query = supabase.from('course_assignments').select('*');
    if (section) query = query.eq('section', section);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    return (data || []).map(a => ({
      subjectId: a.course_id,
      staffId: a.staff_id
    }));
  },

  async assignStaff(subjectId: string, staffId: string, section: string = 'A') {
    const isVirtual = subjectId.startsWith('COMMON-');
    
    // First let's check current constraints
    const staffRes = await supabase.from('staff').select('*').eq('id', staffId).single();
    let subject: any = null;

    if (isVirtual) {
      // Create a dummy subject object for common/virtual subjects
      subject = { id: subjectId, contact_hours: 1 };
      if (subjectId === 'COMMON-OE') subject.contact_hours = 5;
      else if (subjectId === 'COMMON-SOFT' || subjectId === 'COMMON-APT') subject.contact_hours = 2;
    } else {
      const subjectRes = await supabase.from('courses').select('*').eq('id', subjectId).single();
      if (subjectRes.error) throw new Error('Subject not found in Database');
      subject = subjectRes.data;
    }

    const staff = staffRes.data;
    if (!staff || !subject) throw new Error('Invalid subject or staff retrieved from Database');

    const subjectHours = subject.contact_hours || 3;

    if (staff.courses_assigned >= 5) {
      throw new Error(`Cannot assign. ${staff.name} has reached max courses (5).`);
    }
    if (staff.hours + subjectHours > 20) {
      throw new Error(`Cannot assign. Workload exceeds 20 hours.`);
    }

    // Insert Assignment (Only for real subjects in DB)
    if (!isVirtual) {
      const { error: assignError } = await supabase.from('course_assignments').insert([{
        course_id: subjectId,
        staff_id: staffId,
        section: section
      }]);

      if (assignError) {
        // If it exists, it means we already assigned this staff to this course globally before.
        if (assignError.code !== '23505') {
           throw new Error(assignError.message);
        }
      }
    }

    // Update Staff Metrics
    const newCoursesAssigned = (staff.courses_assigned || 0) + 1;
    const newHours = (staff.hours || 0) + subjectHours;
    
    await supabase.from('staff').update({
      courses_assigned: newCoursesAssigned,
      hours: newHours
    }).eq('id', staffId);

    return true;
  },

  async unassignStaff(subjectId: string, staffId: string, section: string = 'A') {
    const isVirtual = subjectId.startsWith('COMMON-');
    
    // Get staff details to update metrics
    const staffRes = await supabase.from('staff').select('*').eq('id', staffId).single();
    const staff = staffRes.data;
    if (!staff) throw new Error('Staff not found');

    // Get subject hours
    let subjectHours = 3;
    if (isVirtual) {
      subjectHours = 1;
      if (subjectId === 'COMMON-OE') subjectHours = 5;
      else if (subjectId === 'COMMON-SOFT' || subjectId === 'COMMON-APT') subjectHours = 2;
    } else {
      const subjectRes = await supabase.from('courses').select('*').eq('id', subjectId).single();
      if (subjectRes.data) subjectHours = subjectRes.data.contact_hours || 3;
    }

    if (!isVirtual) {
      let query = supabase.from('course_assignments')
        .delete()
        .eq('course_id', subjectId)
        .eq('staff_id', staffId);
        
      if (section) query = query.eq('section', section);
        
      const { error: deleteError } = await query;
      
      if (deleteError) throw new Error(deleteError.message);
    }

    // Update Staff Metrics
    const newCoursesAssigned = Math.max(0, (staff.courses_assigned || 0) - 1);
    const newHours = Math.max(0, (staff.hours || 0) - subjectHours);
    
    await supabase.from('staff').update({
      courses_assigned: newCoursesAssigned,
      hours: newHours
    }).eq('id', staffId);

    return true;
  },

  async saveTimetable(schedule: any[], section: string = 'A') {
    // schedule array contains { subjectId, staffId, day, timeIndex }
    console.log('saveTimetable called with section:', section);
    console.log('Original schedule length:', schedule.length);

    const formattedData = schedule
      .filter(slot => !slot.subjectId.startsWith('COMMON-') && slot.staffId !== 'NO-STAFF-COMMON')
      .map(slot => ({
        course_id: slot.subjectId,
        staff_id: slot.staffId,
        day_of_week: slot.day,
        time_slot: slot.timeIndex,
        section: section
      }));

    console.log('Filtered formattedData length:', formattedData.length);
    console.log('Sample formattedData:', formattedData.slice(0, 3));

    if (formattedData.length === 0) return true;

    const { error } = await supabase.from('timetables').insert(formattedData);
    if (error) {
      console.error('Error saving timetable:', error);
      throw error;
    }
    console.log('Timetable saved successfully');
    return true;
  },

  async getGlobalTimetables(staffIds: string[]) {
    if (!staffIds.length) return [];
    const { data, error } = await supabase.from('timetables').select('*').in('staff_id', staffIds);
    if (error) throw new Error(error.message);
    // map DB columns to frontend style for easier parsing
    return (data || []).map(slot => ({
      subjectId: slot.course_id,
      staffId: slot.staff_id,
      day: slot.day_of_week,
      timeIndex: slot.time_slot
    }));
  },

  async getRecentActivity(limit: number = 5) {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('*, courses(name), staff(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
        // Fallback if joined tables fail
        const fallback = await supabase.from('course_assignments').select('*').order('created_at', { ascending: false }).limit(limit);
        if (fallback.error) throw new Error(fallback.error.message);
        return fallback.data.map(a => ({
           id: a.id,
           courseName: a.course_id,
           staffName: a.staff_id,
           section: a.section || 'A',
           time: new Date(a.created_at).toLocaleString()
        }));
    }
    
    return (data || []).map(a => ({
      id: a.id,
      // Handle the case where the relation returns an array or object
      courseName: (Array.isArray(a.courses) ? a.courses[0]?.name : a.courses?.name) || a.course_id,
      staffName: (Array.isArray(a.staff) ? a.staff[0]?.name : a.staff?.name) || 'Staff',
      section: a.section || 'A',
      time: new Date(a.created_at).toLocaleString()
    }));
  },

  async getClassTimetables(departmentId: string, year: number, semester: number, section: string) {
    console.log('getClassTimetables called with:', { departmentId, year, semester, section });

    const coursesRes = await supabase.from('courses').select('*')
      .eq('department_id', departmentId)
      .eq('year', year)
      .eq('semester', semester);

    if (coursesRes.error) throw new Error(coursesRes.error.message);

    const courses = coursesRes.data || [];
    console.log('Found courses:', courses.length);

    if (semester === 6 || semester === 7) {
      const oeRes = await supabase.from('courses').select('*').in('type', ['OE', 'Open Elective']).eq('semester', semester);
      if (oeRes.data) courses.push(...oeRes.data);
    }

    const courseIds = courses.map(c => c.id);
    console.log('Course IDs:', courseIds);

    if (courseIds.length === 0) return [];

    const { data: timetables, error } = await supabase.from('timetables')
      .select('*, staff(name)')
      .in('course_id', courseIds)
      .eq('section', section);

    console.log('Timetables query result:', timetables, error);

    if (error) {
       // Fallback logic
       const t2 = await supabase.from('timetables').select('*').in('course_id', courseIds).eq('section', section);
       if (t2.error) throw new Error(t2.error.message);

       return t2.data.map(slot => {
         const courseMatch = courses.find(c => c.id === slot.course_id);
         return {
           subjectId: slot.course_id,
           courseName: courseMatch?.name || slot.course_id,
           courseType: courseMatch?.type || 'Class',
           staffId: slot.staff_id,
           staffName: 'Staff',
           day: slot.day_of_week,
           timeIndex: slot.time_slot,
           section: slot.section
         };
       });
    }

    const result = (timetables || []).map(slot => {
      const courseMatch = courses.find(c => c.id === slot.course_id);
      return {
        subjectId: slot.course_id,
        courseName: courseMatch?.name || slot.course_id,
        courseType: courseMatch?.type || 'Class',
        staffId: slot.staff_id,
        staffName: (Array.isArray(slot.staff) ? slot.staff[0]?.name : slot.staff?.name) || 'Staff',
        day: slot.day_of_week,
        timeIndex: slot.time_slot,
        section: slot.section
      };
    });

    console.log('Returning timetables:', result);
    return result;
  },

  async addStaff(staffData: { name: string, department_id: string, specialization: string }) {
    const { data, error } = await supabase.from('staff').insert([{
      name: staffData.name,
      department_id: staffData.department_id,
      specialization: staffData.specialization,
      max_courses: 5,
      max_hours: 20,
      courses_assigned: 0,
      hours: 0
    }]).select().single();

    if (error) throw new Error(error.message);
    return data;
  }
};
