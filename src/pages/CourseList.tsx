import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Subject } from '../lib/api';

export default function CourseList() {
  const [courses, setCourses] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await api.getSubjects();
        setCourses(data);
      } catch (err: any) {
        alert("Error loading courses: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const filteredCourses = courses.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col bg-[#FDFDFD]">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            Curriculum Courses
          </h1>
          <p className="text-gray-500 mt-1">Browse all available subjects tailored to specific regulations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by course code or name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FDFDFD] border-b border-gray-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-center">L T P J</th>
                <th className="px-6 py-4 text-center">Credits</th>
                <th className="px-6 py-4 text-center">Weekly Hrs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading courses directory...</td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No courses found.</td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-[#FDFDFD]/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                      <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded">
                        {course.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase ${course.type.toLowerCase().includes('lab') || course.type.toLowerCase() === 'practical' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {course.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-mono text-gray-500 text-xs font-semibold tracking-widest bg-[#FDFDFD] px-2.5 py-1 rounded-lg border border-gray-100 inline-block">
                        {course.l || 0}-{course.t || 0}-{course.p || 0}-{course.j || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                      {course.credits || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium font-mono">
                      {course.weekly_hours || course.hours || 0}h
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
