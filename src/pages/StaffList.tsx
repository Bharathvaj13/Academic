import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, BookOpen, Clock, UserPlus, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Staff } from '../lib/api';

export default function StaffList() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', department_id: '', specialization: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(e => console.error(e));
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.department_id || !newStaff.specialization) {
      return alert("Please fill all fields");
    }
    setIsSubmitting(true);
    try {
      await api.addStaff(newStaff);
      setShowAddModal(false);
      setNewStaff({ name: '', department_id: '', specialization: '' });
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err: any) {
      alert("Error adding staff: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadStaff() {
      try {
        const data = await api.getStaff();
        setStaffList(data);
      } catch (err: any) {
        alert("Error loading staff: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col bg-[#FDFDFD]">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Staff Directory
          </h1>
          <p className="text-gray-500 mt-1">Manage and view all registered academic staff members.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search staff by name or specialization..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FDFDFD] border-b border-gray-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4 text-center">Courses limits</th>
                <th className="px-6 py-4 text-center">Workload (hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading staff directory...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No staff members found.</td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr 
                    key={staff.id} 
                    onClick={() => navigate(`/staff/schedule/${staff.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {staff.name.charAt(0)}
                      </div>
                      {staff.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-sm whitespace-normal">
                        {staff.specialization.split(',').slice(0, 3).map((spec, i) => (
                          <span key={i} className="text-[10px] bg-gray-50 text-slate-600 px-2 py-1 rounded font-medium border border-gray-200">
                            {spec.trim()}
                          </span>
                        ))}
                        {staff.specialization.split(',').length > 3 && (
                          <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded font-medium border border-gray-200">
                            +{staff.specialization.split(',').length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        {(staff as any).coursesAssigned || staff.courses_assigned || 0} / {(staff as any).maxCourses || staff.max_courses || 5}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {staff.hours || 0}h / {(staff as any).maxHours || staff.max_hours || 20}h
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#FDFDFD]">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <UserPlus className="w-5 h-5 text-emerald-500" /> Add New Staff
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. Dr. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <select required value={newStaff.department_id} onChange={e => setNewStaff({...newStaff, department_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium">
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization (comma separated)</label>
                <input required type="text" value={newStaff.specialization} onChange={e => setNewStaff({...newStaff, specialization: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. Machine Learning, Cloud Computing" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
