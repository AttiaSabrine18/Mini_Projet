import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, BookOpen, MessageSquare, Users,
  Settings, LogOut, GraduationCap, ClipboardList, FolderOpen,
  BarChart3, Building2, UserCheck, BookUser, Shield,
} from "lucide-react";
import { motion } from "framer-motion";

const studentLinks = [
  { to: "/dashboard",             icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/schedule",    icon: Calendar,        label: "Emploi du temps" },
  { to: "/dashboard/courses",     icon: BookOpen,        label: "Cours" },
  { to: "/dashboard/materials",   icon: FolderOpen,      label: "Supports" },
  { to: "/dashboard/forums",      icon: MessageSquare,   label: "Forums" },
  { to: "/dashboard/attendance",  icon: ClipboardList,   label: "Absences" },
];

const teacherLinks = [
  { to: "/dashboard",             icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/schedule",    icon: Calendar,        label: "Emploi du temps" },
  { to: "/dashboard/courses",     icon: BookOpen,        label: "Mes cours" },
  { to: "/dashboard/materials",   icon: FolderOpen,      label: "Supports" },
  { to: "/dashboard/forums",      icon: MessageSquare,   label: "Forums" },
  { to: "/dashboard/attendance",  icon: UserCheck,       label: "Présence" },
  { to: "/dashboard/students",    icon: Users,           label: "Étudiants" },
];

const adminLinks = [
  { to: "/dashboard",             icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/users",       icon: Users,           label: "Utilisateurs" },
  { to: "/dashboard/approvals",   icon: UserCheck,       label: "Demandes" },
  { to: "/dashboard/filieres",    icon: Building2,       label: "Filières" },
  { to: "/dashboard/schedule",    icon: Calendar,        label: "Emplois du temps" },
  { to: "/dashboard/courses",     icon: BookOpen,        label: "Cours" },
  { to: "/dashboard/stats",       icon: BarChart3,       label: "Statistiques" },
];

// Icône + label selon le rôle backend
const roleDisplay: Record<string, { icon: any; label: string }> = {
  ETUDIANT:       { icon: GraduationCap, label: "Étudiant" },
  ENSEIGNANT:     { icon: BookUser,      label: "Enseignant" },
  ADMINISTRATEUR: { icon: Shield,        label: "Administrateur" },
};

export default function DashboardSidebar() {
  const navigate = useNavigate();

  // ── Lire depuis "utilisateur" (clé stockée au login) ──────────────────────
  let utilisateur: any = null;
  try {
    const stored = localStorage.getItem("utilisateur");
    utilisateur = stored ? JSON.parse(stored) : null;
  } catch { /* JSON corrompu */ }

  // Fallback si rien en localStorage
  if (!utilisateur) {
    utilisateur = { typeUtilisateur: "ETUDIANT", prenom: "?", nom: "", email: "" };
  }

  const role = utilisateur.typeUtilisateur ?? "ETUDIANT";

  const links =
    role === "ADMINISTRATEUR" ? adminLinks
    : role === "ENSEIGNANT"   ? teacherLinks
    : studentLinks;

  const { icon: RoleIcon, label: roleLabel } = roleDisplay[role] ?? roleDisplay.ETUDIANT;

  const handleSignOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("utilisateur");
    navigate("/auth");
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-xl font-bold text-sidebar-primary">UniPortal</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">{roleLabel}</p>
      </div>

      {/* Navigation */}
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

      {/* Paramètres + Déconnexion */}
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

      {/* Profil utilisateur en bas */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary">
            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {utilisateur.prenom} {utilisateur.nom}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{utilisateur.email}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
