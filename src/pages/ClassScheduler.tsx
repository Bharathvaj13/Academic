import { useState, useEffect } from 'react';
import { Search, User, CheckCircle2, AlertCircle, Calendar as CalendarIcon, Clock, Save, Download, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../lib/api';
import type { Subject, Staff, Assignment } from '../lib/api';
import { generateTimetable } from '../lib/schedulerWorker';
import type { ScheduledClass } from '../lib/schedulerWorker';

export default function ClassScheduler() {
  const [searchTerm, setSearchTerm] = useState('');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sessionAssignments, setSessionAssignments] = useState<{ subjectId: string, staffId: string }[]>([]);

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [workLog, setWorkLog] = useState<{ id: string, message: React.ReactNode, time: string }[]>([]);

  const [timetable, setTimetable] = useState<ScheduledClass[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Configuration State
  const [isConfigured, setIsConfigured] = useState(false);
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedRegulation, setSelectedRegulation] = useState<string>('2023');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('A');

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(e => alert(e.message));
  }, []);

  // Fetch data after configuration
  const fetchData = async () => {
    // Route staff fetching based on relationships
    let staffDeptId = selectedDept;
    const deptInfo = departments.find(d => d.id === selectedDept);

    if (deptInfo) {
      const deptName = deptInfo.name.toLowerCase();
      const isAIML_CSD = deptName.includes('aiml') || deptName.includes('csd') || deptName.includes('machine learning');
      const isAIDS_IT = deptName.includes('aids') || deptName.includes('information technology') || deptName === 'it' || deptName.includes('data science') || deptName.includes('it_department');

      if (isAIML_CSD) {
        const cseDept = departments.find(d => d.name.toLowerCase().includes('computer science') || d.name.toLowerCase() === 'cse');
        if (cseDept) staffDeptId = cseDept.id;
      } else if (isAIDS_IT) {
        const itDept = departments.find(d => d.name.toLowerCase().includes('information technology') || d.name.toLowerCase() === 'it');
        if (itDept) staffDeptId = itDept.id;
      }
    }

    const sList = await api.getStaff(staffDeptId);
    const subList = await api.getSubjects(selectedDept, undefined, selectedSemester);
    const assignments = await api.getAssignments(selectedSection);

    // Map existing assignments for current subjects
    const subjectIds = subList.map(s => s.id);
    const filteredAssignments = assignments.filter(a => subjectIds.includes(a.subjectId));

    setStaffList(sList);
    setSubjects(subList);
    setSessionAssignments(filteredAssignments);

    // Try to load existing saved timetable for this class
    try {
      const existingTimetable = await api.getClassTimetables(selectedDept, selectedYear, selectedSemester, selectedSection);
      if (existingTimetable.length > 0) {
        let loadedTimetable = existingTimetable.map(t => ({
          subjectId: t.subjectId,
          staffId: t.staffId,
          day: t.day,
          timeIndex: t.timeIndex
        }));

        if (selectedSemester === 6 || selectedSemester === 7) {
           const oeRigidSlots = [
             { day: 'Monday', timeIndex: 0 },
             { day: 'Wednesday', timeIndex: 0 },
             { day: 'Friday', timeIndex: 0 },
             { day: 'Saturday', timeIndex: 0 },
             { day: 'Saturday', timeIndex: 1 }
           ];
           oeRigidSlots.forEach(slot => {
             loadedTimetable.push({
                subjectId: 'COMMON-OE',
                staffId: 'NO-STAFF-COMMON',
                day: slot.day,
                timeIndex: slot.timeIndex
             });
           });
        }
        
        setTimetable(loadedTimetable);
      } else {
        setTimetable([]);
      }
    } catch (err) {
       console.info("No existing timetable loaded", err);
       setTimetable([]);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      fetchData();
    }
  }, [isConfigured, selectedDept, selectedYear, selectedSemester, selectedSection]);

  const handleAssignStaff = async (staffId: string) => {
    if (!activeSubjectId) return;

    try {
      const existingAssignment = sessionAssignments.find(a => a.subjectId === activeSubjectId);
      const subject = subjects.find(s => s.id === activeSubjectId);
      const staff = staffList.find(s => s.id === staffId);

      if (existingAssignment) {
        // Unassign old staff first to maintain correct workload in DB
        await api.unassignStaff(activeSubjectId, existingAssignment.staffId, selectedSection);
      }

      await api.assignStaff(activeSubjectId, staffId, selectedSection);

      // Track session assignment locally
      setSessionAssignments(prev => {
        const filtered = prev.filter(a => a.subjectId !== activeSubjectId);
        return [...filtered, { subjectId: activeSubjectId, staffId }];
      });

      // Update UI log
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
      setActiveSubjectId(null); // Clear selection
      await fetchData(); // Refresh data to update loads
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnassignStaff = async (subjectId: string, staffId: string) => {
    try {
      await api.unassignStaff(subjectId, staffId, selectedSection);
      
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
      // Filter out OE assignments in the departmental scheduler as they are managed via OEScheduler.tsx
      const filteredAssignments = sessionAssignments.filter(a => {
        const sub = subjects.find(s => s.id === a.subjectId);
        const isOE = sub && (sub.name.toLowerCase() === 'oe' || sub.name.toLowerCase().includes('open elective') || sub.type === 'OE');
        return !isOE;
      });

      // Find all staff involved in the filtered assignments
      const involvedStaffIds = [...new Set(filteredAssignments.map(a => a.staffId))];
      // Fetch global timetable boundaries
      const globalBlocks = await api.getGlobalTimetables(involvedStaffIds);

      const schedule = generateTimetable(subjects, staffList, filteredAssignments as Assignment[], globalBlocks);

      if (schedule.length === 0 && subjects.length > 0 && sessionAssignments.length > 0) {
        alert("Could not generate schedule! Please check for staff capacity or overlapping global constraints.");
      }

      setTimetable(schedule);
    } catch (err: any) {
      // Provide detailed error from the worker
      alert("Scheduling Constraint Violated: " + err.message);
    }
  };

  const handleAdjustHours = (subjectId: string, delta: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId && s.type === 'Common') {
        const newHours = Math.max(1, Math.min(2, s.hours + delta));
        return { ...s, hours: newHours };
      }
      return s;
    }));
  };

  const handleSaveTimetable = async () => {
    if (timetable.length === 0) return;
    console.log('ClassScheduler: Saving timetable with params:', {
      selectedDept,
      selectedYear,
      selectedSemester,
      selectedSection,
      timetableLength: timetable.length
    });
    setIsSaving(true);
    try {
      await api.saveTimetable(timetable, selectedSection);
      alert('Timetable saved successfully to Database!');
    } catch (err: any) {
      console.error('ClassScheduler: Error saving timetable:', err);
      alert('Error saving timetable: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (timetable.length === 0) {
      alert('No timetable generated yet. Please generate timetable first.');
      return;
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const header = ['Day', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7'];

    const rows = DAYS.map(day => {
      const row = [day];
      for (let period = 0; period < 7; period++) {
        const slot = timetable.find(t => t.day === day && t.timeIndex === period);
        if (slot) {
          const sub = subjects.find(s => s.id === slot.subjectId);
          const staff = staffList.find(s => s.id === slot.staffId);
          const subjectName = sub ? sub.name : slot.subjectId;
          const staffName = staff ? staff.name : 'Unassigned';
          row.push(`${subjectName}\n${staffName}`);
        } else {
          row.push('-');
        }
      }
      return row;
    });

    try {
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      pdf.setFontSize(14);
      const title = `${departments.find(d => d.id === selectedDept)?.name || 'Academia'} - Class Timetable`;
      pdf.text(title, 40, 30);

      autoTable(pdf, {
        head: [header],
        body: rows,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, halign: 'center' },
        bodyStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' }
        }
      });

      const fileName = `Class_Timetable_${selectedDept || 'unknown'}_Y${selectedYear}_S${selectedSemester}_${selectedSection}.pdf`;
      pdf.save(fileName);
    } catch (error: any) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF: ${error?.message || error}. Please try again.`);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleStartScheduling = () => {
    if (!selectedDept) {
      alert("Please select a department");
      return;
    }
    setIsConfigured(true);
  };

  const handleResetConfig = () => {
    if (window.confirm("Are you sure you want to start over? Any unsaved changes will be lost.")) {
      setIsConfigured(false);
      setTimetable([]);
      setWorkLog([]);
      setActiveSubjectId(null);
    }
  };

  if (!isConfigured) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FDFDFD] p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl overflow-hidden">
          <div className="bg-gray-900 text-white p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-900/90 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900">Scheduler Preferences</h2>
            <p className="text-primary-100 mt-2">Configure target division before generating schedules</p>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-[#FDFDFD] border border-gray-200 rounded-lg px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Regulation</label>
              <select value={selectedRegulation} onChange={e => setSelectedRegulation(e.target.value)} className="w-full bg-[#FDFDFD] border border-gray-200 rounded-lg px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2020">2020</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
              <select value={selectedYear} onChange={e => {
                const newYear = Number(e.target.value);
                setSelectedYear(newYear);
                setSelectedSemester((newYear * 2) - 1);
              }} className="w-full bg-[#FDFDFD] border border-gray-200 rounded-lg px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
              <select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value))} className="w-full bg-[#FDFDFD] border border-gray-200 rounded-lg px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                {[(selectedYear * 2) - 1, selectedYear * 2].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full bg-[#FDFDFD] border border-gray-200 rounded-lg px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-[#FDFDFD] border-t border-gray-200 flex justify-end">
            <button
              onClick={handleStartScheduling}
              className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all"
            >
              Start Scheduling
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeDepartmentName = departments.find(d => d.id === selectedDept)?.name || 'Unknown Dept';

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD]">
      {/* Configuration Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Class Scheduler</h1>
          <div className="text-sm text-gray-500 mt-1 flex gap-2">
            <span className="bg-gray-50 px-2 py-0.5 rounded font-medium border border-gray-200">Reg: {selectedRegulation}</span>
            <span className="bg-gray-50 px-2 py-0.5 rounded font-medium border border-gray-200 truncate max-w-[150px]">{activeDepartmentName}</span>
            <span className="bg-gray-50 px-2 py-0.5 rounded font-medium border border-gray-200 flex items-center gap-1">
              Sec:
              <select 
                value={selectedSection} 
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                }}
                className="bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </span>
            <span className="bg-gray-50 px-2 py-0.5 rounded font-medium border border-gray-200">Year {selectedYear}</span>
            <span className="bg-gray-50 px-2 py-0.5 rounded font-medium border border-gray-200">Sem {selectedSemester}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetConfig}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 border border-gray-200"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            Reset Config
          </button>

          <button
            onClick={handleGenerateTimetable}
            disabled={sessionAssignments.length === 0}
            className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 ${sessionAssignments.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white hover:shadow'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            Generate AI Timetable
          </button>

          {timetable.length > 0 && (
            <>
              <button
                onClick={handleSaveTimetable}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-gray-900 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save DB'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-gray-900 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Subjects */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-[#FDFDFD]/50">
            <h2 className="font-semibold text-gray-800">Curriculum Subjects</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a subject to assign staff</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {['Department', 'Common'].map(category => {
              const filteredSubjects = subjects.filter(s => category === 'Common' ? s.type === 'Common' : s.type !== 'Common');
              if (filteredSubjects.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{category} Subjects</h3>
                  <div className="space-y-2">
                    {filteredSubjects.map(sub => {
                      const isAssigned = sessionAssignments.some(a => a.subjectId === sub.id);
                      const isSelected = activeSubjectId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setActiveSubjectId(isSelected ? null : sub.id);
                          }}
                          className={`p-3.5 rounded-xl border-2 transition-all relative overflow-hidden
                            ${isSelected ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-500/20' :
                              isAssigned ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300' :
                                'border-gray-200 hover:border-primary-300 bg-white hover:shadow-sm'}
                            cursor-pointer`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-gray-700 font-bold bg-primary-100/50 px-1.5 py-0.5 rounded">{sub.id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${sub.type === 'Lab' ? 'bg-purple-100 text-purple-700' : sub.type === 'Common' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {sub.type}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mt-2 text-sm leading-tight">{sub.name}</h3>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                              {sub.hours} hrs/wk
                              {sub.type === 'Common' && (
                                <div className="ml-2 flex items-center gap-1 border-l pl-2 border-gray-200">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAdjustHours(sub.id, -1); }}
                                    disabled={sub.hours <= 1}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-gray-900 font-bold leading-none cursor-pointer"
                                  >-</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAdjustHours(sub.id, 1); }}
                                    disabled={sub.hours >= 2}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-gray-900 font-bold leading-none cursor-pointer"
                                  >+</button>
                                </div>
                              )}
                            </span>
                            {isAssigned && !(sub.name.toLowerCase() === 'oe' || sub.name.toLowerCase().includes('open elective') || sub.type === 'OE') && (
                              <div className="flex flex-col gap-1.5 ml-auto">
                                <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Assigned
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const assignment = sessionAssignments.find(a => a.subjectId === sub.id);
                                    if (assignment) handleUnassignStaff(sub.id, assignment.staffId);
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-bold underline cursor-pointer"
                                >
                                  Unassign
                                </button>
                              </div>
                            )}
                            {(sub.name.toLowerCase() === 'oe' || sub.name.toLowerCase().includes('open elective') || sub.type === 'OE') && (
                              <div className="flex flex-col gap-1 ml-auto text-right">
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                  Rigid Slots
                                </span>
                                <span className="text-[8px] text-gray-400 italic">Managed in OE Scheduler</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Timetable Viewer */}
        <div className="flex-1 flex flex-col bg-[#FDFDFD] overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">

            {/* Timetable View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary-500" />
                  Generated Weekly Schedule
                </h3>
                {timetable.length > 0 && (
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conflict-free
                  </span>
                )}
              </div>

              {timetable.length === 0 ? (
                <div className="h-64 flex items-center justify-center flex-col bg-[#FDFDFD]/50">
                  <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-gray-900 font-medium">No Timetable Generated</h4>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">Assign staff to subjects and click "Generate AI Timetable" to visualize the schedule.</p>
                </div>
              ) : (
                <div id="timetable-table-area" className="p-4 overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-xs text-gray-500 uppercase bg-[#FDFDFD] border border-gray-200 rounded-t-lg">
                      <tr>
                        <th className="px-4 py-3 border-r border-gray-200 w-24 text-center">Day / Time</th>
                        {Array.from({ length: 7 }).map((_, timeIndex) => (
                          <th key={timeIndex} className="px-4 py-3 border-r border-gray-200 text-center font-semibold w-[12%]">Period {timeIndex + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => (
                        <tr key={day} className="bg-white border-b border-l border-r border-gray-200 hover:bg-[#FDFDFD] transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-700 bg-slate-50 border-r border-gray-200 text-center tracking-wider text-xs">
                            {day.substring(0, 3)}
                          </td>
                          {(() => {
                            const cells = [];
                            for (let timeIndex = 0; timeIndex < 7;) {
                              const cls = timetable.find(t => t.day === day && t.timeIndex === timeIndex);

                              if (!cls) {
                                cells.push(
                                  <td key={timeIndex} className="px-2 py-2 border-r border-gray-200 text-center relative h-20 hover:bg-slate-50/50"></td>
                                );
                                timeIndex++;
                                continue;
                              }

                              const subjectInfo = subjects.find(s => s.id === cls.subjectId);

                              let span = 1;
                              if (subjectInfo?.type === 'Lab' || subjectInfo?.type === 'Practical') {
                                while (timeIndex + span < 7) {
                                  const nextCls = timetable.find(t => t.day === day && t.timeIndex === timeIndex + span);
                                  if (nextCls && nextCls.subjectId === cls.subjectId) {
                                    span++;
                                  } else {
                                    break;
                                  }
                                }
                              }

                              cells.push(
                                <td key={timeIndex} colSpan={span} className="p-2 border-r border-gray-200 text-center relative h-24 align-middle">
                                  <div className="h-full w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-center items-center transition-colors hover:border-emerald-300 hover:shadow-md">
                                    <span className="font-semibold text-gray-900 text-sm leading-tight px-1 line-clamp-3">{subjectInfo?.name || cls.subjectId}</span>
                                  </div>
                                </td>
                              );

                              timeIndex += span;
                            }
                            return cells;
                          })()}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Updates Workflow */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-[#FDFDFD]/50">
                <h3 className="text-base font-semibold text-gray-900">Assignment Log</h3>
              </div>
              <div className="p-5">
                {workLog.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 italic">No assignments made yet.</p>
                ) : (
                  <div className="space-y-3">
                    {workLog.map(log => (
                      <div key={log.id} className="flex flex-col gap-1">
                        {log.message}
                        <span className="text-[10px] text-gray-400 font-medium ml-1">{log.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Staff Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm z-10 relative">

          {/* Overlay if no subject is selected */}
          {!activeSubjectId && (
            <div className="absolute inset-0 z-20 bg-[#FDFDFD]/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-primary-500 border border-gray-100">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-gray-700 font-medium shadow-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                Please select a subject from the left panel to assign a staff member.
              </p>
            </div>
          )}

          <div className="p-4 border-b border-gray-100 bg-[#FDFDFD]/50">
            <h2 className="font-semibold text-gray-800 tracking-tight">Staff Assignment panel</h2>
            <div className="mt-3 relative">
              <input
                type="text"
                placeholder="Search staff by name or specialization..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-gray-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!activeSubjectId}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {activeSubjectId && (
              <div className="mt-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-widest block mb-1">Assigning For</span>
                <span className="text-sm font-bold text-blue-900">{subjects.find(s => s.id === activeSubjectId)?.name}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFDFD]/30">
            {filteredStaff.map((staff: any) => {
              const maxedOut = staff.coursesAssigned >= staff.maxCourses || staff.hours >= staff.maxHours;

              return (
                <div
                  key={staff.id}
                  onClick={() => !maxedOut && handleAssignStaff(staff.id)}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden group
                    ${maxedOut ? 'border-red-200 bg-red-50/40 opacity-75 cursor-not-allowed' : 'border-gray-200 bg-white hover:border-primary-400 cursor-pointer shadow-sm hover:shadow-md'}`}
                >
                  {maxedOut && (
                    <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 font-bold rounded-bl-lg flex items-center gap-1 shadow-sm">
                      <AlertCircle className="w-3 h-3" /> Max Load Reached
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${maxedOut ? 'bg-red-50 border-red-100 text-red-400' : 'bg-[#FDFDFD] border-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:text-primary-500 transition-colors'}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{staff.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5 line-clamp-2">
                        {staff.specialization.split(',').map((spec: string, i: number) => (
                          <span key={i} className="text-[10px] bg-gray-50 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-gray-200">{spec.trim()}</span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                        <div className={`rounded-lg px-2.5 py-1.5 border flex flex-col justify-center ${staff.coursesAssigned >= staff.maxCourses ? 'bg-red-50 border-red-100' : 'bg-[#FDFDFD] border-gray-100'}`}>
                          <span className="text-gray-500 font-medium mb-0.5">Courses</span>
                          <span className={`font-bold text-sm ${staff.coursesAssigned >= staff.maxCourses ? 'text-red-600' : 'text-gray-900'}`}>
                            {staff.coursesAssigned} <span className="text-gray-400 text-xs font-medium">/ {staff.maxCourses}</span>
                          </span>
                        </div>
                        <div className={`rounded-lg px-2.5 py-1.5 border flex flex-col justify-center ${staff.hours >= staff.maxHours ? 'bg-red-50 border-red-100' : 'bg-[#FDFDFD] border-gray-100'}`}>
                          <span className="text-gray-500 font-medium mb-0.5">Workload</span>
                          <span className={`font-bold text-sm ${staff.hours >= staff.maxHours ? 'text-red-600' : 'text-gray-900'}`}>
                            {staff.hours}h <span className="text-gray-400 text-xs font-medium">/ {staff.maxHours}h</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!maxedOut && activeSubjectId && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignStaff(staff.id);
                        }}
                        className="bg-primary-50 text-gray-700 hover:bg-gray-900 text-white hover:text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Assign to Subject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredStaff.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">No staff found</p>
                <p className="text-xs text-gray-500 mt-1 placeholder:max-w-[200px] mx-auto">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
