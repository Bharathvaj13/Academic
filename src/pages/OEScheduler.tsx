import { useState, useEffect } from 'react';
import { Search, User, CheckCircle2, AlertCircle, Calendar as CalendarIcon, Save, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import type { Subject, Staff } from '../lib/api';
import type { ScheduledClass } from '../lib/schedulerWorker';

const OE_SUBJECT_LIST = [
  { id: 'U23ADS1003', name: 'Software Engineering' },
  { id: 'U23BM1002', name: 'Basic Life Support' },
  { id: 'U23BM1004', name: 'Hospital Management' },
  { id: 'U23CE1008', name: 'Municipal Solid Waste Management' },
  { id: 'U23CE1009', name: 'Energy Efficiency and Green Building' },
  { id: 'U23CS1010', name: 'Cloud Computing' },
  { id: 'U23EC1009', name: 'Sensors and Smart Structures Technologies' },
  { id: 'U23EE1013', name: 'Energy Conservation and Auditing' },
  { id: 'U23EE1021', name: 'Innovation, IPR and Entrepreneurship Development' },
  { id: 'U23FT1001', name: 'Fundamentals of Fashion Design' },
  { id: 'U23IT1002', name: 'Introduction to Database Technology' },
  { id: 'U23MC1008', name: 'Fundamentals of Robotics' },
  { id: 'U23MC1009', name: 'Smart Automation' },
];

export default function OEScheduler() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sessionAssignments, setSessionAssignments] = useState<{ subjectId: string, staffId: string }[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [workLog, setWorkLog] = useState<{ id: string, message: React.ReactNode, time: string }[]>([]);
  const [timetable, setTimetable] = useState<ScheduledClass[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all staff
      const allStaff = await api.getStaff('');
      setStaffList(allStaff);

      // Map the hardcoded subjects to the Subject interface
      const mappedSubjects: Subject[] = OE_SUBJECT_LIST.map(s => ({
        id: s.id,
        name: s.name,
        type: 'OE',
        hours: 5,
        credits: 3,
        weekly_hours: 5,
        l: 3, t: 0, p: 2, j: 0,
        year: 3,
        semester: 6
      }));
      setSubjects(mappedSubjects);

      // Fetch existing assignments
      const assignments = await api.getAssignments();
      const oeIds = OE_SUBJECT_LIST.map(s => s.id);
      const filteredAssignments = assignments.filter(a => oeIds.includes(a.subjectId));
      setSessionAssignments(filteredAssignments);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!activeSubjectId) return;

    try {
      const existingAssignment = sessionAssignments.find(a => a.subjectId === activeSubjectId);
      const subject = subjects.find(s => s.id === activeSubjectId);
      const staff = staffList.find(s => s.id === staffId);

      // Check for rigid OE slot conflicts before assigning
      const staffTimetable = await api.getStaffTimetable(staffId);
      const oeRigidSlots = [
        { day: 'Monday', time: 0 },
        { day: 'Wednesday', time: 0 },
        { day: 'Friday', time: 0 },
        { day: 'Saturday', time: 0 },
        { day: 'Saturday', time: 1 }
      ];

      const conflicts = staffTimetable.filter(slot => 
        oeRigidSlots.some(oe => oe.day === slot.day_of_week && oe.time === slot.time_slot)
      );

      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c => `- ${c.day_of_week} Period ${c.time_slot + 1}: ${c.courses?.name || c.course_id} (Sec ${c.section || 'A'})`).join('\n');
        const proceed = window.confirm(`WARNING: ${staff?.name} already has classes scheduled during the rigid Open Elective slots:\n\n${conflictDetails}\n\nAssigning them to ${subject?.name} will cause a generated conflict. Do you want to proceed anyway?`);
        if (!proceed) {
          setActiveSubjectId(null);
          return;
        }
      }

      if (existingAssignment) {
        await api.unassignStaff(activeSubjectId, existingAssignment.staffId);
      }

      await api.assignStaff(activeSubjectId, staffId);

      setSessionAssignments(prev => {
        const filtered = prev.filter(a => a.subjectId !== activeSubjectId);
        return [...filtered, { subjectId: activeSubjectId, staffId }];
      });

      const isChange = !!existingAssignment;
      const oldStaffName = isChange ? staffList.find(s => s.id === existingAssignment.staffId)?.name : null;

      const logEntry = (
        <div className={`flex items-center gap-3 text-sm p-3 bg-white rounded-lg border shadow-sm ${isChange ? 'border-amber-100' : 'border-gray-100'}`}>
          {isChange ? <RotateCcw className="w-5 h-5 text-amber-500 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{subject?.name}</span>
            {isChange && <span className="text-[10px] text-gray-500 italic">Changed from {oldStaffName}</span>}
          </div>
          <span className="text-gray-400">→</span>
          <span className="flex items-center gap-1 font-medium">
            <User className="w-4 h-4 text-gray-500" />
            {staff?.name}
          </span>
          <span className={`ml-auto text-xs px-2 py-1 rounded-md font-medium ${isChange ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isChange ? 'Re-assigned' : 'Assigned'}
          </span>
        </div>
      );

      setWorkLog(prev => [{ id: Math.random().toString(), message: logEntry, time: new Date().toLocaleTimeString() }, ...prev]);
      setActiveSubjectId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnassignStaff = async (subjectId: string, staffId: string) => {
    try {
      await api.unassignStaff(subjectId, staffId);
      const subject = subjects.find(s => s.id === subjectId);
      const staff = staffList.find(s => s.id === staffId);

      setSessionAssignments(prev => prev.filter(a => a.subjectId !== subjectId));

      const logEntry = (
        <div className="flex items-center gap-3 text-sm p-3 bg-white rounded-lg border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-medium text-gray-900">{subject?.name}</span>
          <span className="text-gray-400">×</span>
          <span className="flex items-center gap-1 font-medium text-gray-500 line-through">
            <User className="w-4 h-4 text-gray-400" />
            {staff?.name}
          </span>
          <span className="ml-auto text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">Unassigned</span>
        </div>
      );

      setWorkLog(prev => [{ id: Math.random().toString(), message: logEntry, time: new Date().toLocaleTimeString() }, ...prev]);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateTimetable = async () => {
    try {
      // Create a direct mapping for OE subjects exactly to their rigid slots.
      // OEs run strictly in parallel across the college, so there is no heuristic AI layout needed.
      const oeSchedule: ScheduledClass[] = [];
      const oeRigidSlots = [
        { day: 'Monday', timeIndex: 0 },
        { day: 'Wednesday', timeIndex: 0 },
        { day: 'Friday', timeIndex: 0 },
        { day: 'Saturday', timeIndex: 0 },
        { day: 'Saturday', timeIndex: 1 }
      ];

      for (const assignment of sessionAssignments) {
        for (const slot of oeRigidSlots) {
          oeSchedule.push({
            subjectId: assignment.subjectId,
            staffId: assignment.staffId,
            day: slot.day,
            timeIndex: slot.timeIndex
          });
        }
      }
      setTimetable(oeSchedule);
    } catch (err: any) {
      alert("Scheduling Constraint Violated: " + err.message);
    }
  };

  const handleSaveTimetable = async () => {
    if (timetable.length === 0) return;
    setIsSaving(true);
    try {
      await api.saveTimetable(timetable);
      alert('Timetable saved successfully!');
    } catch (err: any) {
      alert('Error saving timetable: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD]">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Open Elective Scheduler</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cross-departmental Open Elective subjects</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateTimetable}
            disabled={sessionAssignments.length === 0}
            className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 ${sessionAssignments.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white hover:shadow'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            Preview OE Slots
          </button>
          {timetable.length > 0 && (
            <button
              onClick={handleSaveTimetable}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Assignments'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: OE Subjects */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-[#FDFDFD]/50">
            <h2 className="font-semibold text-gray-800 tracking-tight">OE Subjects</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {subjects.map(sub => {
              const isAssigned = sessionAssignments.some(a => a.subjectId === sub.id);
              const isSelected = activeSubjectId === sub.id;
              const assignedStaff = staffList.find(s => s.id === sessionAssignments.find(a => a.subjectId === sub.id)?.staffId);

              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveSubjectId(isSelected ? null : sub.id)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden
                    ${isSelected ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-500/20' :
                      isAssigned ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300' :
                        'border-gray-200 hover:border-primary-300 bg-white hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-gray-700 font-bold bg-primary-100/50 px-1.5 py-0.5 rounded">{sub.id}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2 text-sm leading-tight">{sub.name}</h3>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {isAssigned ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-700 font-medium truncate max-w-[150px]">
                          <User className="w-3 h-3 inline mr-1" /> {assignedStaff?.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassignStaff(sub.id, assignedStaff!.id);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold underline"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">Unassigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Panel: Preview & Logs */}
        <div className="flex-1 flex flex-col bg-[#FDFDFD] overflow-hidden p-6 space-y-6">
          {/* Timetable Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-500" />
                OE Slot Preview
              </h3>
            </div>
            {timetable.length === 0 ? (
              <div className="h-48 flex items-center justify-center flex-col bg-[#FDFDFD]/50 text-center p-6">
                <CalendarIcon className="w-12 h-12 text-slate-200 mb-2" />
                <p className="text-sm text-gray-500">Assign staff and click "Preview OE Slots" to see the overlapping schedule blocks.</p>
              </div>
            ) : (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border">Day / Time</th>
                      <th className="px-4 py-2 border text-center">Period 1</th>
                      <th className="px-4 py-2 border text-center">Period 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td className="px-4 py-2 border font-medium bg-gray-50">{day}</td>
                        <td className="px-4 py-2 border text-center h-16">
                          {timetable.filter(t => t.day === day && t.timeIndex === 0).map(t => (
                            <div key={t.subjectId} className="text-[10px] bg-blue-50 text-blue-700 rounded px-1 py-0.5 mb-1 truncate" title={t.subjectId}>
                              {subjects.find(s => s.id === t.subjectId)?.name}
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-2 border text-center h-16">
                          {timetable.filter(t => t.day === day && t.timeIndex === 1).map(t => (
                            <div key={t.subjectId} className="text-[10px] bg-blue-50 text-blue-700 rounded px-1 py-0.5 mb-1 truncate" title={t.subjectId}>
                              {subjects.find(s => s.id === t.subjectId)?.name}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Log Section */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-[#FDFDFD]/50">
              <h3 className="text-base font-semibold text-gray-900">Assignment Log</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {workLog.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 italic">No assignments made in this session.</p>
              ) : (
                workLog.map(log => (
                  <div key={log.id} className="flex flex-col gap-1">
                    {log.message}
                    <span className="text-[10px] text-gray-400 font-medium ml-1">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Staff Selection */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm relative">
          {!activeSubjectId && (
            <div className="absolute inset-0 z-20 bg-[#FDFDFD]/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-700 font-medium shadow-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                Select an OE subject to assign staff.
              </p>
            </div>
          )}
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Assign Staff</h2>
            <div className="mt-3 relative">
              <input
                type="text"
                placeholder="Search staff..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-gray-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStaff.map(staff => {
              const maxedOut = staff.courses_assigned >= 10 || staff.hours >= 30;
              return (
                <div
                  key={staff.id}
                  onClick={() => !maxedOut && handleAssignStaff(staff.id)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer
                    ${maxedOut ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:border-primary-400 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">{staff.name}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{staff.specialization}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Load: {staff.hours}h</span>
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Courses: {staff.courses_assigned}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
