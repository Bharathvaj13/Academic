import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, UserCircle, Briefcase, BookOpen } from 'lucide-react';
import { api } from '../lib/api';

export default function StaffTimetable() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!staffId) return;
      try {
        setLoading(true);
        const staffData = await api.getStaffById(staffId);
        setStaff(staffData);
        
        const scheduleData = await api.getStaffTimetable(staffId);
        setTimetable(scheduleData);
      } catch (err: any) {
        alert("Error loading timetable: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [staffId]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Real-time logic mockup
  const currentDayIndex = new Date().getDay() - 1; // 0 for Monday
  const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
  
  // Assuming periods are 9AM to 4PM for 7 periods (1 hour each roughly)
  const getPeriodStatus = (dayStr: string, periodIndex: number) => {
    const dayTarget = DAYS.indexOf(dayStr);
    
    if (dayTarget < currentDayIndex) return 'past';
    if (dayTarget > currentDayIndex) return 'future';
    
    // It's today
    const periodStartHour = 9 + periodIndex;
    if (currentHour >= periodStartHour && currentHour < periodStartHour + 1) {
      return 'ongoing';
    }
    if (currentHour >= periodStartHour + 1) return 'past';
    return 'future';
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading staff timetable...</div>;
  }

  if (!staff) {
    return <div className="p-8 text-red-500">Staff member not found.</div>;
  }

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD] overflow-auto">
      {/* Header Profile */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 z-10">
        <button 
          onClick={() => navigate('/admin/staff')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center border border-gray-200 shadow-sm text-2xl font-bold text-gray-700">
               {staff.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{staff.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  <UserCircle className="w-4 h-4" /> {staff.departmentName || 'General'}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  <Briefcase className="w-4 h-4" /> {staff.specialization}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 border border-gray-200 bg-gray-50 px-5 py-3 rounded-xl shadow-sm">
            <div className="flex flex-col">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Assigned</span>
               <span className="font-bold text-gray-900 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" /> {staff.coursesAssigned} Courses</span>
            </div>
            <div className="w-[1px] h-8 bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Workload</span>
               <span className="font-bold text-gray-900 flex items-center gap-1.5"><Clock className="w-4 h-4 text-purple-500" /> {staff.hours} Hours</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               <CalendarIcon className="w-5 h-5 text-gray-400" /> Weekly Schedule
            </h2>
            <div className="flex items-center gap-4 text-sm font-medium">
               <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div> Ongoing</span>
               <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Upcoming</span>
               <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div> Completed</span>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left min-w-[700px]">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 border-r border-gray-200 w-24 text-center font-bold">Day / Time</th>
                     {Array.from({ length: 7 }).map((_, timeIndex) => (
                       <th key={timeIndex} className="px-4 py-3 border-r border-gray-200 text-center font-bold w-[12%]">
                          Period {timeIndex + 1}
                          <div className="text-[10px] font-normal text-gray-400 mt-0.5">{9 + timeIndex}:00 - {10 + timeIndex}:00</div>
                       </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {DAYS.map(day => (
                     <tr key={day} className="bg-white border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                     <td className="px-4 py-4 font-bold text-gray-700 bg-gray-50 border-r border-gray-200 text-center tracking-wider text-xs">
                        {day.substring(0, 3)}
                     </td>
                     {Array.from({ length: 7 }).map((_, timeIndex) => {
                        const slot = timetable.find(t => t.day_of_week === day && t.time_slot === timeIndex);
                        const status = getPeriodStatus(day, timeIndex);
                        
                        let statusColor = "bg-transparent";
                        let dotColor = "hidden";
                        let borderStyle = "border-transparent";

                        if (slot) {
                           if (status === 'ongoing') {
                              statusColor = "bg-emerald-50";
                              dotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                              borderStyle = "border-emerald-200";
                           } else if (status === 'future') {
                              statusColor = "bg-blue-50";
                              dotColor = "bg-blue-500";
                              borderStyle = "border-blue-100";
                           } else {
                              statusColor = "bg-gray-50";
                              dotColor = "bg-gray-400";
                              borderStyle = "border-gray-200";
                           }
                        }

                        return (
                           <td key={timeIndex} className="p-2 border-r border-gray-200 text-center relative h-24 align-top">
                           {slot ? (
                              <div className={`w-full h-full p-2.5 rounded-lg border flex flex-col justify-center items-center shadow-sm relative ${statusColor} ${borderStyle} transition-all`}>
                                 <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dotColor}`}></div>
                                 <span className="font-bold text-gray-900 text-xs leading-tight text-center mb-1 line-clamp-2">{slot.courses?.name || slot.course_id}</span>
                                 <div className="flex flex-wrap justify-center gap-1 mt-1">
                                    <span className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{slot.courses?.type || 'Class'}</span>
                                    {slot.section && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Sec {slot.section}</span>}
                                 </div>
                              </div>
                           ) : (
                              <div className="w-full h-full flex flex-col justify-center items-center opacity-0 hover:opacity-100 transition-opacity text-gray-300">
                                 <span className="text-xs font-medium">-</span>
                              </div>
                           )}
                           </td>
                        );
                     })}
                     </tr>
                  ))}
               </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
