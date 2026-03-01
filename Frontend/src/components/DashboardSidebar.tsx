import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, BookOpen, MessageSquare, Users,
  Settings, LogOut, GraduationCap, ClipboardList, FolderOpen,
  BarChart3, Building2, UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const studentLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/schedule", icon: Calendar, label: "Emploi du temps" },
  { to: "/dashboard/courses", icon: BookOpen, label: "Cours" },
  { to: "/dashboard/materials", icon: FolderOpen, label: "Supports" },
  { to: "/dashboard/forums", icon: MessageSquare, label: "Forums" },
  { to: "/dashboard/attendance", icon: ClipboardList, label: "Absences" },
];

const teacherLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/schedule", icon: Calendar, label: "Emploi du temps" },
  { to: "/dashboard/courses", icon: BookOpen, label: "Mes cours" },
  { to: "/dashboard/materials", icon: FolderOpen, label: "Supports" },
  { to: "/dashboard/forums", icon: MessageSquare, label: "Forums" },
  { to: "/dashboard/attendance", icon: UserCheck, label: "Présence" },
  { to: "/dashboard/students", icon: Users, label: "Étudiants" },
];

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/users", icon: Users, label: "Utilisateurs" },
  { to: "/dashboard/approvals", icon: UserCheck, label: "Demandes" },
  { to: "/dashboard/filieres", icon: Building2, label: "Filières" },
  { to: "/dashboard/schedule", icon: Calendar, label: "Emplois du temps" },
  { to: "/dashboard/courses", icon: BookOpen, label: "Cours" },
  { to: "/dashboard/stats", icon: BarChart3, label: "Statistiques" },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();

  // Read user from localStorage (set during login)
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : { role: "student", firstName: "?", lastName: "", email: "" };

  const links =
    user.role === "admin" ? adminLinks
    : user.role === "teacher" ? teacherLinks
    : studentLinks;

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col"
    >
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-xl font-bold text-sidebar-primary">UniPortal</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1 capitalize">{user.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="h-4 w-4" /> Paramètres
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}