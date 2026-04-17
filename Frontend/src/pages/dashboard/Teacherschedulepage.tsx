import { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, Users, BookOpen,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("accessToken");

interface Seance {
  date:       string;
  heureDebut: string;
  heureFin:   string;
  type:       string;
  groupe:     string | null;
  salle:      string | null;
}

interface CoursSessions {
  [coursNom: string]: Seance[];
}

interface TeacherEDT {
  enseignant:   { matricule: string; grade: string };
  totalSeances: number;
  parCours:     CoursSessions;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  COURS_MAGISTRAL:   { label: "CM", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  TRAVAUX_DIRIGES:   { label: "TD", color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7", dot: "#10b981" },
  TRAVAUX_PRATIQUES: { label: "TP", color: "#6d28d9", bg: "#f5f3ff", border: "#c4b5fd", dot: "#8b5cf6" },
  EXAMEN:            { label: "EX", color: "#991b1b", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
};

const JOURS    = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const CRENEAUX = ["08:00","10:00","12:00","14:00","16:00"];

function getDay(dateStr: string) {
  const days = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  return days[new Date(dateStr).getDay()];
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

// ── Teacher timetable grid ────────────────────────────────────────────────────
function TeacherTimetable({ parCours }: { parCours: CoursSessions }) {
  const allSessions: (Seance & { coursNom: string })[] = [];
  Object.entries(parCours).forEach(([coursNom, seances]) => {
    seances.forEach(s => allSessions.push({ ...s, coursNom }));
  });

  const map: Record<string, (Seance & { coursNom: string })[]> = {};
  allSessions.forEach(s => {
    const key = `${getDay(s.date)}-${s.heureDebut}`;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });

  const coursColors = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4"];
  const coursColorMap: Record<string, string> = {};
  Object.keys(parCours).forEach((nom, i) => {
    coursColorMap[nom] = coursColors[i % coursColors.length];
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 860 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "70px repeat(6,1fr)", gap: 5, marginBottom: 5 }}>
          <div />
          {JOURS.map(j => (
            <div key={j} style={{
              textAlign: "center", padding: "8px 4px",
              fontSize: 11, fontWeight: 800, color: "#1e40af",
              background: "#eff6ff", borderRadius: 8,
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.05em", textTransform: "uppercase" as const,
            }}>{j}</div>
          ))}
        </div>

        {/* Rows */}
        {CRENEAUX.map(cr => (
          <div key={cr} style={{ display: "grid", gridTemplateColumns: "70px repeat(6,1fr)", gap: 5, marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: "#f3f4f6", color: "#6b7280",
                padding: "3px 7px", borderRadius: 5,
              }}>{cr}</span>
            </div>
            {JOURS.map(jour => {
              const cells = map[`${jour}-${cr}`] || [];
              if (!cells.length) return (
                <div key={jour} style={{
                  minHeight: 76, borderRadius: 10,
                  background: "#f9fafb", border: "1px dashed #e5e7eb",
                }} />
              );
              return (
                <div key={jour} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {cells.map((s, i) => {
                    const m     = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
                    const color = coursColorMap[s.coursNom] || "#3b82f6";
                    return (
                      <motion.div key={i} whileHover={{ scale: 1.02, y: -1 }} style={{
                        padding: "8px 10px", borderRadius: 10,
                        background: m.bg,
                        border: `1px solid ${m.border}`,
                        borderLeft: `3px solid ${color}`,
                        minHeight: 76, position: "relative", overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}>
                        <span style={{
                          position: "absolute", top: 5, right: 5,
                          fontSize: 8, fontWeight: 900, color: m.color,
                          background: "rgba(255,255,255,0.75)", padding: "1px 4px", borderRadius: 3,
                        }}>{m.label}</span>
                        <p style={{
                          fontSize: 11, fontWeight: 700, color: "#0f172a",
                          lineHeight: 1.3, paddingRight: 22, marginBottom: 3,
                          fontFamily: "'Playfair Display', serif",
                        }}>{s.coursNom}</p>
                        {s.groupe && (
                          <p style={{ fontSize: 10, color: "#64748b", marginBottom: 1 }}>Groupe {s.groupe}</p>
                        )}
                        {s.salle && (
                          <p style={{ fontSize: 9.5, color: "#94a3b8" }}>{s.salle.split(" (")[0]}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ nom, seances }: { nom: string; seances: Seance[] }) {
  const [open, setOpen] = useState(false);
  const upcoming = seances.filter(s => new Date(s.date) >= new Date()).length;

  return (
    <motion.div layout style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: "1px solid #e0e7ff",
      boxShadow: "0 2px 8px rgba(30,58,110,0.05)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left" as const,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg,#3b82f6,#1e40af)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <BookOpen style={{ width: 18, height: 18, color: "#fff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: "#0f172a",
            fontFamily: "'Playfair Display', serif",
          }}>{nom}</p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {seances.length} séance{seances.length !== 1 ? "s" : ""} · {upcoming} à venir
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[...new Set(seances.map(s => s.type))].map(t => {
            const m = TYPE_META[t] || TYPE_META.COURS_MAGISTRAL;
            return (
              <span key={t} style={{
                fontSize: 9, fontWeight: 800, color: m.color,
                background: m.bg, border: `1px solid ${m.border}`,
                padding: "2px 6px", borderRadius: 4,
              }}>{m.label}</span>
            );
          })}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: "#94a3b8" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "#94a3b8" }} />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid #f1f5f9", overflow: "hidden" }}
          >
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {seances.sort((a,b) => a.date.localeCompare(b.date)).map((s, i) => {
                const m      = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
                const isPast = new Date(s.date) < new Date();
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: isPast ? "#f8fafc" : m.bg,
                    border: `1px solid ${isPast ? "#e2e8f0" : m.border}`,
                    opacity: isPast ? 0.65 : 1,
                  }}>
                    {isPast
                      ? <CheckCircle2 style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
                      : <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: isPast ? "#94a3b8" : "#0f172a" }}>
                        {fmtDate(s.date)}
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        {s.heureDebut} – {s.heureFin}
                        {s.groupe ? ` · Gr. ${s.groupe}` : ""}
                        {s.salle ? ` · ${s.salle.split(" (")[0]}` : ""}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: m.color,
                      background: isPast ? "#f1f5f9" : "rgba(255,255,255,0.8)",
                      padding: "2px 6px", borderRadius: 4,
                    }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeacherSchedulePage() {
  const [data,    setData]    = useState<TeacherEDT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [view,    setView]    = useState<"grille"|"cours">("grille");

  const fetchEDT = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/edt/classes`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur");
      setData(json.data);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEDT(); }, []);

  const parCours  = data?.parCours ?? {};
  const nbCours   = Object.keys(parCours).length;
  const nbGroupes = new Set(
    Object.values(parCours).flat().map(s => s.groupe).filter(Boolean)
  ).size;
  const upcoming  = Object.values(parCours).flat().filter(s => new Date(s.date) >= new Date()).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "22px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "linear-gradient(135deg,#3b82f6,#1e40af)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}>
              <Calendar style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 700, color: "#fff",
                fontFamily: "'Playfair Display', serif",
              }}>Mes classes & emploi du temps</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {data?.enseignant ? `${data.enseignant.grade} · Matricule ${data.enseignant.matricule}` : "Chargement…"}
              </p>
            </div>
            <button onClick={fetchEDT} disabled={loading} style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <RefreshCw style={{ width: 13, height: 13, animation: loading ? "spin 1s linear infinite" : "none" }} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total séances",   val: data?.totalSeances ?? 0, color: "#3b82f6" },
            { label: "Cours enseignés", val: nbCours,                  color: "#10b981" },
            { label: "Groupes",         val: nbGroupes,                color: "#8b5cf6" },
            { label: "À venir",         val: upcoming,                 color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#fff", borderRadius: 14, padding: "16px 20px",
              border: "1px solid #e0e7ff",
              boxShadow: "0 2px 8px rgba(30,58,110,0.05)",
            }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Playfair Display', serif" }}>{s.val}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["grille","cours"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 18px", borderRadius: 9, cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              background: view === v ? "#1e40af" : "#fff",
              color: view === v ? "#fff" : "#64748b",
              border: view === v ? "1px solid #1e40af" : "1px solid #e0e7ff",
              textTransform: "capitalize" as const,
            }}>
              {v === "grille" ? "🗓 Vue grille" : "📚 Par cours"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                border: "3px solid #e0e7ff", borderTopColor: "#3b82f6",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ fontSize: 14, color: "#94a3b8" }}>Chargement de vos classes…</p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16,
            border: "1px solid #fca5a5",
          }}>
            <AlertCircle style={{ width: 36, height: 36, color: "#ef4444", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>{error}</p>
            <button onClick={fetchEDT} style={{
              padding: "8px 20px", borderRadius: 9,
              background: "#3b82f6", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Réessayer</button>
          </div>
        ) : !data || data.totalSeances === 0 || Object.keys(parCours).length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16,
            border: "1px dashed #e0e7ff",
          }}>
            <TrendingUp style={{ width: 44, height: 44, color: "#94a3b8", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Aucune classe assignée</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Vos cours apparaîtront ici une fois l'emploi du temps généré par l'administration.
            </p>
          </div>
        ) : view === "grille" ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 22,
            border: "1px solid #e0e7ff",
            boxShadow: "0 2px 10px rgba(30,58,110,0.05)",
          }}>
            <TeacherTimetable parCours={parCours} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(parCours).map(([nom, seances]) => (
              <CourseCard key={nom} nom={nom} seances={seances} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
