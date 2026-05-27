import { useEffect, useMemo, useState } from 'react';
import { api, type Staff } from '../lib/api';
import { CalendarIcon, Users, Clock, LayoutGrid, MessageSquare } from 'lucide-react';

type Department = { id: string; name: string };

type StaffSlot = {
  day_of_week?: string;
  time_slot?: number;
  course_id?: string;
  courseName?: string;
  staff_id?: string;
  staffName?: string;
  section?: string;
  courses?: { name?: string };
  day?: string;
  timeIndex?: number;
};

type ClassSlot = {
  day?: string;
  timeIndex?: number;
  courseName?: string;
  staffName?: string;
  section?: string;
  course_id?: string;
  courses?: { name?: string };
  staff_id?: string;
  subjectId?: string;
  courseType?: string;
  staffId?: string;
};

type TransformedStaff = Staff & {
  maxCourses: number;
  maxHours: number;
  coursesAssigned: number;
  hours: number;
};

type ChatMessage = {
  from: 'bot' | 'user';
  text: string;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableChatbot() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<TransformedStaff[]>([]);

  const [stage, setStage] = useState<'intro' | 'staff' | 'class' | 'done'>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffInput, setStaffInput] = useState('');
  const [staffTimetable, setStaffTimetable] = useState<StaffSlot[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('');
  const [classTimetable, setClassTimetable] = useState<ClassSlot[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const visibleStaffOptions = useMemo<TransformedStaff[]>(() => {
    if (!staffInput) return staff;
    const lowered = staffInput.toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(lowered));
  }, [staffInput, staff]);

  const appendMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    async function loadInitial() {
      try {
        const [deptData, staffData] = await Promise.all([api.getDepartments(), api.getStaff()]);
        setDepartments(deptData);
        setStaff(staffData);
        if (deptData?.length) setSelectedDepartment(deptData[0].id);
        setStage('intro');
        setMessages([
          { from: 'bot', text: 'Hi! I can help you explore timetable data. Choose an option:' },
          { from: 'bot', text: '1) Staff details and hours\n2) Class schedule' },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        appendMessage({ from: 'bot', text: 'Unable to load initial data: ' + message });
      }
    }
    loadInitial();
  }, []);

  const startStaffFlow = () => {
    setStage('staff');
    appendMessage({ from: 'user', text: 'Staff schedule & hours' });
    appendMessage({ from: 'bot', text: 'Type or select a staff name, then click "Get staff info".' });
  };

  const startClassFlow = () => {
    setStage('class');
    appendMessage({ from: 'user', text: 'Class schedule' });
    appendMessage({ from: 'bot', text: 'Select department/year/semester/section and optional day, then click "Get class schedule".' });
  };

  const fetchStaffInfo = async () => {
    let staffRecord = staff.find(s => s.id === selectedStaffId);
    if (!staffRecord && staffInput.trim()) {
      staffRecord = staff.find(s => s.name.toLowerCase() === staffInput.trim().toLowerCase());
    }
    if (!staffRecord) {
      appendMessage({ from: 'bot', text: 'Staff not found. Please choose from the filtered list.' });
      return;
    }

    setSelectedStaffId(staffRecord.id);
    setStaffInput(staffRecord.name);

    appendMessage({ from: 'user', text: `Query staff: ${staffRecord.name}` });

    setIsLoading(true);
    try {
      const timetableData = await api.getStaffTimetable(staffRecord.id);
      setStaffTimetable(timetableData);
      appendMessage({ from: 'bot', text: `Found ${timetableData.length} slots for ${staffRecord.name}. Total assigned hours: ${staffRecord.hours || 0}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage({ from: 'bot', text: 'Error fetching staff timetable: ' + message });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassSchedule = async () => {
    if (!selectedDepartment) {
      appendMessage({ from: 'bot', text: 'Please select a department first.' });
      return;
    }

    appendMessage({ from: 'user', text: `Query class schedule for dept=${selectedDepartment}, year=${selectedYear}, sem=${selectedSemester}, sec=${selectedSection}${selectedDay ? ', day=' + selectedDay : ''}` });

    setIsLoading(true);
    try {
      const timetableData = await api.getClassTimetables(
        selectedDepartment,
        Number(selectedYear),
        Number(selectedSemester),
        selectedSection
      );
      console.log('Chatbot fetched class timetable data:', timetableData);
      setClassTimetable(timetableData);

      const filtered = selectedDay ? timetableData.filter(slot => slot.day === selectedDay) : timetableData;
      appendMessage({ from: 'bot', text: `Found ${filtered.length} slots.` });

      if (filtered.length === 0) {
        appendMessage({ from: 'bot', text: 'No slots found for the given query.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage({ from: 'bot', text: 'Error fetching class timetable: ' + message });
    } finally {
      setIsLoading(false);
    }
  };

  const highlightedStaffSummary = useMemo(() => {
    if (!selectedStaffId) return null;
    const info = staff.find(s => s.id === selectedStaffId);
    if (!info) return null;
    const byDay = DAYS.map(day => ({ day, slots: staffTimetable.filter(slot => slot.day_of_week === day) }));
    return { info, byDay };
  }, [selectedStaffId, staffTimetable, staff]);

  const classByDay = useMemo(() => {
    return selectedDay ? classTimetable.filter(slot => slot.day === selectedDay) : classTimetable;
  }, [classTimetable, selectedDay]);

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD] overflow-hidden">
      <div className="bg-white border-b border-gray-200 py-5 px-6 shadow-sm flex flex-wrap gap-3 items-center">
        <CalendarIcon className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">Timetable Chatbot</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        <section className="lg:col-span-4 p-4 border-r border-gray-100 overflow-y-auto h-full bg-white">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <MessageSquare className="w-4 h-4 text-primary-500" />
            <span className="font-semibold">Chat flow</span>
          </div>
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`rounded-xl p-3 text-sm ${msg.from === 'bot' ? 'bg-blue-50 text-blue-800 text-left' : 'bg-gray-100 text-gray-800 text-right'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button onClick={startStaffFlow} className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">I want staff schedule/hours</button>
            <button onClick={startClassFlow} className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">I want class schedule</button>
            <button onClick={() => { setStage('intro'); setMessages([{from:'bot', text:'Choose an option from above.'}]); }} className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md">Start over</button>
          </div>
        </section>

        <section className="lg:col-span-8 p-4 overflow-y-auto h-full">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Chatbot action panel</h2>
            {stage === 'staff' && (
              <div className="space-y-3 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 pb-2 border-b border-gray-100">
                  <Users className="w-4 h-4" /> Select staff
                </div>

                <input
                  value={staffInput}
                  onChange={e => { setStaffInput(e.target.value); setSelectedStaffId(''); }}
                  placeholder="Type staff name"
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-300"
                />

                <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {visibleStaffOptions.length === 0 ? (
                    <div className="text-xs text-gray-500">No match</div>
                  ) : (
                    visibleStaffOptions.slice(0, 8).map(st => (
                      <button
                        key={st.id}
                        onClick={() => { setSelectedStaffId(st.id); setStaffInput(st.name); }}
                        className={`w-full text-left text-xs p-1 rounded ${selectedStaffId === st.id ? 'bg-blue-100' : 'hover:bg-white'} text-gray-700`}
                      >
                        {st.name} ({'Dept'})
                      </button>
                    ))
                  )}
                </div>

                <button onClick={fetchStaffInfo} className="mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Get staff info'}
                </button>
              </div>
            )}

            {stage === 'class' && (
              <div className="space-y-3 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 pb-2 border-b border-gray-100">
                  <LayoutGrid className="w-4 h-4" /> Choose class query
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="border rounded-lg p-2">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border rounded-lg p-2">
                    {[1,2,3,4].map(v => <option key={v} value={v}>{v} Year</option>)}
                  </select>
                  <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="border rounded-lg p-2">
                    {[1,2,3,4,5,6,7,8].map(v => <option key={v} value={v}>Sem {v}</option>)}
                  </select>
                  <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="border rounded-lg p-2">
                    {['A','B','C'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="border rounded-lg p-2">
                  <option value="">All days</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <button onClick={fetchClassSchedule} className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Get class schedule'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {highlightedStaffSummary && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                  <Clock className="w-4 h-4" /> Staff details for {highlightedStaffSummary.info.name}
                </div>
                <div className="text-sm text-gray-600">Total assigned hours (database value): {highlightedStaffSummary.info.hours ?? 'N/A'} | Courses: {highlightedStaffSummary.info.coursesAssigned ?? 'N/A'}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {highlightedStaffSummary.byDay.map(dayGroup => (
                    <div key={dayGroup.day} className="border p-2 rounded-lg bg-slate-50">
                      <div className="text-xs font-bold text-gray-500">{dayGroup.day}</div>
                      {dayGroup.slots.length === 0 ? (
                        <p className="text-xs text-gray-400 mt-1">No classes</p>
                      ) : (
                        <ul className="text-xs mt-1 space-y-1">
                          {dayGroup.slots.map((slot, idx) => {
                            const name = slot.courses?.name || slot.courseName || slot.course_id || 'Unknown';
                            return <li key={idx}>{`P${(slot.time_slot ?? slot.timeIndex ?? 0) + 1} - ${name}`}</li>;
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {classByDay.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                  <CalendarIcon className="w-4 h-4" /> Class schedule table
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border px-2 py-1">Day</th>
                        <th className="border px-2 py-1">Period</th>
                        <th className="border px-2 py-1">Course</th>
                        <th className="border px-2 py-1">Staff</th>
                        <th className="border px-2 py-1">Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classByDay.map((slot, idx) => (
                        <tr key={`${slot.day}-${slot.timeIndex}-${idx}`}>
                          <td className="border px-2 py-1">{slot.day}</td>
                          <td className="border px-2 py-1">P{(slot.timeIndex ?? 0) + 1}</td>
                          <td className="border px-2 py-1">{slot.courseName || slot.courses?.name || slot.course_id}</td>
                          <td className="border px-2 py-1">{slot.staffName || slot.staff_id}</td>
                          <td className="border px-2 py-1">{slot.section || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {stage === 'staff' && !highlightedStaffSummary && !isLoading && (
              <p className="text-sm text-gray-500">Pick a staff and click Get staff info to see hours and class list.</p>
            )}

            {stage === 'class' && classByDay.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500">No class schedule results yet. Choose options and click Get class schedule.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
