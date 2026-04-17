import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, BookOpen, MessageSquare, Users,
  Settings, LogOut, GraduationCap, ClipboardList, FolderOpen,
  BarChart3, Building2, UserCheck, BookUser, Shield, FileText,
  Cpu,Newspaper,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── ÉTUDIANT ─────────────────────────────────────────────────────
const studentLinks = [
  { to: "/dashboard",            icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/actualites",     icon: Newspaper,       label: "Actualités" },
  { to: "/dashboard/fiche",      icon: FileText,        label: "Ma fiche"        },
  { to: "/student/timetable",   icon: Calendar,        label: "Emploi du temps" },
  { to: "/dashboard/courses",    icon: BookOpen,        label: "Cours"           },
  { to: "/dashboard/materials",  icon: FolderOpen,      label: "Supports"        },
  { to: "/dashboard/forums",     icon: MessageSquare,   label: "Forums"          },
  { to: "/dashboard/attendance", icon: ClipboardList,   label: "Absences"        },
];

// ─── ENSEIGNANT ───────────────────────────────────────────────────
const teacherLinks = [
  { to: "/dashboard/actualites",     icon: Newspaper,       label: "Actualités" },
  { to: "/dashboard/teacher",            icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/teacher/schedule",   icon: Calendar,        label: "Emploi du temps" },
  { to: "/dashboard/teacher/courses",    icon: BookOpen,        label: "Mes cours"       },
  { to: "/dashboard/teacher/materials",  icon: FolderOpen,      label: "Supports"        },
  { to: "/dashboard/teacher/forums",     icon: MessageSquare,   label: "Forums"          },
  { to: "/dashboard/teacher/attendance", icon: UserCheck,       label: "Présence"        },
  { to: "/dashboard/teacher/students",   icon: Users,           label: "Étudiants"       },
  { to: "/dashboard/teacher/settings",   icon: Settings,        label: "Paramètres"      },
];

// ─── ADMIN ────────────────────────────────────────────────────────
const adminLinks = [
  { to: "/dashboard/actualites",     icon: Newspaper,       label: "Actualités" }, 
  { to: "/dashboard/admin",                   icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/dashboard/admin/users",             icon: Users,           label: "Utilisateurs"    },
  { to: "/dashboard/admin/approvals",         icon: UserCheck,       label: "Demandes"        },
  { to: "/dashboard/admin/inscriptions",      icon: FileText,        label: "Inscriptions"    },
  { to: "/dashboard/admin/filieres",          icon: Building2,       label: "Filières"        },
  { to: "/dashboard/admin/courses",           icon: BookOpen,        label: "Cours"           },
  { to: "/dashboard/admin/edt/generer",       icon: Cpu,             label: "Générer EDT",  highlight: true },
  { to: "/dashboard/admin/stats",             icon: BarChart3,       label: "Statistiques"    },
  { to: "/dashboard/admin/settings",          icon: Settings,        label: "Paramètres"      },
];

const roleDisplay: Record<string, { icon: any; label: string }> = {
  ETUDIANT:       { icon: GraduationCap, label: "Étudiant"       },
  ENSEIGNANT:     { icon: BookUser,      label: "Enseignant"      },
  ADMINISTRATEUR: { icon: Shield,        label: "Administrateur"  },
};

export default function DashboardSidebar() {
  const navigate = useNavigate();

  let utilisateur: any = null;
  try {
    const stored = localStorage.getItem("utilisateur");
    utilisateur = stored ? JSON.parse(stored) : null;
  } catch { /* JSON corrompu */ }

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

  const settingsPath =
    role === "ADMINISTRATEUR" ? "/dashboard/admin/settings"
    : role === "ENSEIGNANT"   ? "/dashboard/teacher/settings"
    : "/dashboard/settings";

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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isHighlight = (link as any).highlight;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard" || link.to === "/dashboard/teacher" || link.to === "/dashboard/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : isHighlight
                    ? "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isHighlight && !isActive ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 16, height: 16, borderRadius: 4,
                      background: "linear-gradient(135deg, #3b82f6, #1e3a6e)",
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: 10, height: 10, color: "#fff" }} />
                    </span>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {isHighlight && !isActive && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      padding: "2px 6px", borderRadius: 4,
                      background: "rgba(59,130,246,0.15)",
                      color: "#60a5fa",
                    }}>IA</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-4 border-t border-sidebar-border">
        {role === "ETUDIANT" && (
          <NavLink
            to={settingsPath}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors mb-1"
          >
            <Settings className="h-4 w-4" /> Paramètres
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>

      {/* Profil */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary shrink-0">
            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{utilisateur.prenom} {utilisateur.nom}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{utilisateur.email}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
