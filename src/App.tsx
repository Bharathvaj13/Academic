import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from './assets/logo.webp';
import Dashboard from './pages/Dashboard';
import ClassScheduler from './pages/ClassScheduler';
import StaffList from './pages/StaffList';
import CourseList from './pages/CourseList';
import StaffTimetable from './pages/StaffTimetable';
import OEScheduler from './pages/OEScheduler';
import ClassTimetableView from './pages/ClassTimetableView';
import TimetableChatbot from './pages/TimetableChatbot';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItemClass = (path: string) => {
    const isActive = location.pathname.includes(path);
    return `flex items-center gap-2 text-[13px] font-medium transition-colors px-3 h-8 rounded-md ${
      isActive 
        ? 'bg-gray-100 text-gray-900 border border-gray-200/50 shadow-sm' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-indigo-500/30">
      {/* Top Header Navbar */}
      <header className="border-b border-gray-200 flex-none bg-[#FDFDFD]">
        <div className="max-w-screen-2xl mx-auto px-4 w-full">
          <div className="flex justify-between h-14 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-8">
              <img src={logo} alt="Academia Logo" className="w-32 h-8 rounded-sm shadow-sm" />
              <span className="text-[14px] font-semibold text-gray-900 tracking-tight">Academia</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1 flex-1">
              <Link to="/dashboard" className={navItemClass('/dashboard')}>
                Overview
              </Link>
              <Link to="/admin/scheduler" className={navItemClass('/admin/scheduler')}>
                Scheduler
              </Link>
              <Link to="/admin/departments" className={navItemClass('/admin/departments')}>
                Courses
              </Link>
              <Link to="/admin/staff" className={navItemClass('/admin/staff')}>
                Staff
              </Link>
              <Link to="/admin/timetables" className={navItemClass('/admin/timetables')}>
                Class Timetables
              </Link>
              <Link to="/admin/chatbot" className={navItemClass('/admin/chatbot')}>
                Chatbot
              </Link>
              <Link to="/admin/oe-scheduler" className={navItemClass('/admin/oe-scheduler')}>
                OE Scheduler
              </Link>
            </nav>

            {/* Profile / Logout */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden md:flex items-center gap-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-[10px] text-gray-700 font-medium border border-gray-200 shadow-sm">A</div>
                Admin
              </div>
              <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
              <button className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-md hover:bg-gray-50" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <Layout>
              <Dashboard />
            </Layout>
          } 
        />
        <Route 
          path="/admin/scheduler" 
          element={
            <Layout>
              <ClassScheduler />
            </Layout>
          } 
        />
        <Route 
          path="/admin/departments" 
          element={
            <Layout>
              <CourseList />
            </Layout>
          } 
        />
        <Route 
          path="/admin/staff" 
          element={
            <Layout>
              <StaffList />
            </Layout>
          } 
        />
        <Route 
          path="/staff/schedule/:staffId" 
          element={
            <Layout>
              <StaffTimetable />
            </Layout>
          } 
        />
        <Route 
          path="/admin/oe-scheduler" 
          element={
            <Layout>
              <OEScheduler />
            </Layout>
          } 
        />
        <Route 
          path="/admin/timetables" 
          element={
            <Layout>
              <ClassTimetableView />
            </Layout>
          } 
        />
        <Route 
          path="/admin/chatbot" 
          element={
            <Layout>
              <TimetableChatbot />
            </Layout>
          } 
        />
        <Route 
          path="*" 
          element={
            <Layout>
              <div className="p-8 text-gray-900"><h2 className="text-xl font-medium">Page currently under construction</h2></div>
            </Layout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
