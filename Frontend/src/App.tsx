import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ApprovalsPage from './pages/dashboard/ApprovalsPage';
import AttendancePage from './pages/dashboard/AttendancePage';
import CoursesPage from './pages/dashboard/CoursesPage';
import FiliersPage from './pages/dashboard/FiliersPage';
import ForumsPage from './pages/dashboard/ForumsPage';
import MaterialsPage from './pages/dashboard/MaterialsPage';
import SchedulePage from './pages/dashboard/SchedulePage';
import SettingsPage from './pages/dashboard/SettingsPage';
import StatsPage from './pages/dashboard/StatsPage';
import StudentsPage from './pages/dashboard/StudentPage';
import UsersPage from './pages/dashboard/UsersPage';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="forums" element={<ForumsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="filieres" element={<FiliersPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/dashboard/teacher" element={<DashboardLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="forums" element={<ForumsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/dashboard/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="filieres" element={<FiliersPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
