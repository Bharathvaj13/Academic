import { useState, useEffect } from 'react';
import { ArrowRight, GraduationCap, UserCircle2, CalendarDays, BookOpen, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Dashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  
  useEffect(() => {
    api.getRecentActivity(6).then(setActivities).catch(console.error);
  }, []);

  return (
    <div className="h-full overflow-auto bg-[#FDFDFD]">
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="mb-12 mt-4">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
             System Overview
          </h1>
          <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">
             Manage the academic environment. View aggregated data across courses and active staff members.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative group overflow-hidden shadow-sm">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <GraduationCap className="w-5 h-5 text-gray-400 mb-6" />
             <p className="text-[13px] font-medium text-gray-500 mb-1">Total Courses</p>
             <h2 className="text-3xl font-medium text-gray-900 tracking-tight">342</h2>
          </div>
          
          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative group overflow-hidden shadow-sm">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <UserCircle2 className="w-5 h-5 text-gray-400 mb-6" />
             <p className="text-[13px] font-medium text-gray-500 mb-1">Active Staff</p>
             <h2 className="text-3xl font-medium text-gray-900 tracking-tight">94</h2>
          </div>

          <div className="p-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative group overflow-hidden shadow-sm">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Clock className="w-5 h-5 text-gray-400 mb-6" />
             <p className="text-[13px] font-medium text-gray-500 mb-1">System Status</p>
             <h2 className="text-3xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div> 
               Active
             </h2>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* Module Actions Block (col-span-2 on large screens) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
             {/* Module 1 */}
             <Link to="/admin/scheduler" className="block p-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors relative group overflow-hidden hover:shadow-md h-full">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-12">
                   <CalendarDays className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" />
                   <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-[17px] font-medium text-gray-900 mb-2 tracking-tight">System Scheduler</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">Configure constraints and utilize the heuristic engine to generate conflict-free division timetables.</p>
             </Link>

             {/* Module 2 */}
             <Link to="/admin/staff" className="block p-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors relative group overflow-hidden hover:shadow-md h-full">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-12">
                   <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" />
                   <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-[17px] font-medium text-gray-900 mb-2 tracking-tight">Staff Workload</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">Track individual faculty allocations, assess weekly teaching hours, and monitor capacity.</p>
             </Link>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[340px]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-[#FDFDFD]/50">
              <Activity className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Recent Assignments</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-400 italic">No recent activity found.</p>
                </div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="text-sm p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                    <p className="text-gray-800 font-medium mb-1 drop-shadow-sm leading-tight text-xs">
                      <span className="text-primary-600 truncate inline-block max-w-[140px] align-bottom mr-1" title={act.staffName}>{act.staffName}</span>
                      was assigned to 
                      <span className="font-bold ml-1 text-gray-900 truncate inline-block max-w-[200px] align-bottom" title={act.courseName}>{act.courseName}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        Sec {act.section}
                      </span>
                      <span className="text-[10px] text-gray-400">{act.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
