import { useState, useEffect } from 'react';
import { CalendarIcon, Building } from 'lucide-react';
import { api } from '../lib/api';

export default function ClassTimetableView() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('3');
  const [selectedSemester, setSelectedSemester] = useState('6');
  const [selectedSection, setSelectedSection] = useState('A');
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Fetch departments
    api.getDepartments().then(data => {
      setDepartments(data);
      if (data.length > 0) setSelectedDept(data[0].id);
    }).catch(err => console.error(err));
  }, []);

  const handleFetchTimetable = async () => {
    if (!selectedDept) return;
    console.log('ClassTimetableView: Fetching timetable for:', {
      selectedDept,
      selectedYear,
      selectedSemester,
      selectedSection
    });
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await api.getClassTimetables(
        selectedDept, 
        parseInt(selectedYear), 
        parseInt(selectedSemester), 
        selectedSection
      );
      console.log('ClassTimetableView: Received data:', data);
      setTimetable(data);
    } catch (err: any) {
      console.error('ClassTimetableView: Error fetching timetable:', err);
      alert("Error fetching timetable: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD] overflow-hidden relative">
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm relative">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Saved Class Timetables</h1>
          <p className="text-sm text-gray-500 mt-1">View the generated and saved schedules for any specific class division.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Department</label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <select 
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 pl-9 outline-none"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-24">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Year</label>
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
            >
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div className="w-24">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Sem</label>
            <select 
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>

          <div className="w-24">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Sec</label>
            <select 
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
            >
              {['A', 'B', 'C'].map(s => <option key={s} value={s}>Sec {s}</option>)}
            </select>
          </div>

          <button 
            onClick={handleFetchTimetable}
            disabled={isLoading || !selectedDept}
            className="h-[42px] px-6 bg-gray-900 hover:bg-black text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center min-w-[140px]"
          >
            {isLoading ? 'Loading...' : 'View Timetable'}
          </button>
        </div>

        {/* Timetable View */}
        {hasSearched && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
               <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                 <CalendarIcon className="w-5 h-5 text-primary-500" />
                 {departments.find(d => d.id === selectedDept)?.name} - Year {selectedYear}, Sem {selectedSemester}, Sec {selectedSection}
               </h3>
            </div>
            
            {timetable.length === 0 ? (
               <div className="h-48 flex items-center justify-center flex-col bg-[#FDFDFD]/50 text-center p-6">
                 <CalendarIcon className="w-12 h-12 text-slate-200 mb-2" />
                 <p className="text-sm text-gray-500">No timetable found for this class.</p>
                 <p className="text-xs text-gray-400 mt-1">Make sure you have generated and saved a schedule using the System Scheduler.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 border font-semibold text-gray-600">Day / Time</th>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <th key={i} className="px-4 py-3 border text-center font-semibold text-gray-600">P{i + 1} <span className="text-xs font-normal text-gray-400 block">{9+i}:00</span></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 border font-medium bg-gray-50/80 text-gray-700">{day}</td>
                          {Array.from({ length: 7 }).map((_, timeIndex) => {
                            const slots = timetable.filter(t => t.day === day && t.timeIndex === timeIndex);
                            
                            // Inject OE generic block if sem 6/7 and rigid slot
                            const isOESem = selectedSemester === '6' || selectedSemester === '7';
                            const isOESlot = isOESem && (
                              (day === 'Monday' && timeIndex === 0) ||
                              (day === 'Wednesday' && timeIndex === 0) ||
                              (day === 'Friday' && timeIndex === 0) ||
                              (day === 'Saturday' && timeIndex === 0) ||
                              (day === 'Saturday' && timeIndex === 1)
                            );

                            return (
                              <td key={timeIndex} className="p-2 border text-center h-[72px] align-middle">
                                {slots.length > 0 ? (
                                  <div className="flex flex-col gap-1 w-full h-full">
                                    {slots.map((t, idx) => (
                                      <div key={idx} className="bg-blue-50 border border-blue-100 rounded p-1.5 flex flex-col h-full justify-center" title={t.courseName}>
                                        <span className="font-bold text-[11px] text-blue-900 leading-tight block truncate max-w-[120px] mx-auto">{t.courseName}</span>
                                        <span className="text-[9px] text-blue-600 font-medium block truncate max-w-[120px] mx-auto">{t.staffName}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : isOESlot ? (
                                  <div className="bg-amber-50 border border-amber-100 rounded p-1.5 flex flex-col h-full justify-center" title="OPEN ELECTIVE">
                                     <span className="font-bold text-[11px] text-amber-900 leading-tight block mx-auto text-center" style={{whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>OPEN ELECTIVE</span>
                                     <span className="text-[9px] text-amber-600 font-medium block truncate max-w-[120px] mx-auto opacity-80">(Rigid Slot)</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
