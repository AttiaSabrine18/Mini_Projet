import { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, User, BookOpen,
  Loader2, RefreshCw, Filter, ChevronLeft, ChevronRight,
  GraduationCap, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("accessToken");

interface Session {
  id:          number;
  type:        string;
  date:        string;
  heureDebut:  string;
  heureFin:    string;
  groupe:      string;
  estAnnulee:  boolean;
  cours:       { nom: string; code: string } | null;
  module:      { nom: string; type: string } | null;
  salle:       { nom: string; batiment: string; capacite: number } | null;
  enseignant:  { nom: string; prenom: string; grade: string } | null;
  emploiTemps: { semaine: number; annee: string; groupe: string } | null;
}

const JOURS    = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const CRENEAUX = ["08:00","10:00","12:00","14:00","16:00"];

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  COURS_MAGISTRAL:   { label: "CM", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  TRAVAUX_DIRIGES:   { label: "TD", color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7", dot: "#10b981" },
  TRAVAUX_PRATIQUES: { label: "TP", color: "#6d28d9", bg: "#f5f3ff", border: "#c4b5fd", dot: "#8b5cf6" },
  EXAMEN:            { label: "EX", color: "#991b1b", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
};

function getDay(dateStr: string) {
  const d    = new Date(dateStr);
  const days = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  return days[d.getDay()];
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Timetable grid ────────────────────────────────────────────────────────────
function TimetableGrid({ sessions }: { sessions: Session[] }) {
  const [active, setActive] = useState<Session | null>(null);

  const map: Record<string, Session[]> = {};
  sessions.forEach(s => {
    const key = `${getDay(s.date)}-${s.heureDebut}`;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });

  return (
    <>
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
                    background: "#f9fafb",
                    border: "1px dashed #e5e7eb",
                  }} />
                );
                return (
                  <div key={jour} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {cells.map(s => {
                      const m = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
                      return (
                        <motion.div
                          key={s.id}
                          whileHover={{ scale: 1.02, y: -1 }}
                          onClick={() => setActive(s)}
                          style={{
                            padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                            background: s.estAnnulee ? "#f3f4f6" : m.bg,
                            border: `1px solid ${s.estAnnulee ? "#e5e7eb" : m.border}`,
                            minHeight: 76, position: "relative", overflow: "hidden",
                            opacity: s.estAnnulee ? 0.6 : 1,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                          }}
                        >
                          {s.estAnnulee && (
                            <span style={{
                              position: "absolute", top: 0, left: 0, right: 0,
                              background: "#ef4444", color: "#fff",
                              fontSize: 8, fontWeight: 800, textAlign: "center",
                              padding: "2px 0", letterSpacing: "0.1em",
                            }}>ANNULÉE</span>
                          )}
                          <span style={{
                            position: "absolute", top: s.estAnnulee ? 14 : 5, right: 5,
                            fontSize: 8, fontWeight: 900, color: m.color,
                            background: "rgba(255,255,255,0.75)", padding: "1px 4px",
                            borderRadius: 3,
                          }}>{m.label}</span>
                          <p style={{
                            fontSize: 11, fontWeight: 700, color: s.estAnnulee ? "#9ca3af" : m.color,
                            lineHeight: 1.3, paddingRight: 22, marginBottom: 2,
                            marginTop: s.estAnnulee ? 10 : 0,
                            fontFamily: "'Playfair Display', serif",
                          }}>{s.cours?.nom || "—"}</p>
                          {s.enseignant && (
                            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 1 }}>
                              Prof. {s.enseignant.prenom} {s.enseignant.nom}
                            </p>
                          )}
                          {s.salle && (
                            <p style={{ fontSize: 9.5, color: "#9ca3af" }}>{s.salle.nom}</p>
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

      {/* Detail modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(7,17,31,0.5)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 20, padding: 26,
                width: "100%", maxWidth: 400, margin: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
                border: "1px solid #e0e7ff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span style={{
                    display: "inline-block", padding: "2px 9px", borderRadius: 5,
                    background: TYPE_META[active.type]?.bg, color: TYPE_META[active.type]?.color,
                    fontSize: 10, fontWeight: 800, marginBottom: 6,
                  }}>{TYPE_META[active.type]?.label} · {active.type.replace(/_/g," ")}</span>
                  <h3 style={{
                    fontSize: 16, fontWeight: 700, color: "#0f172a",
                    fontFamily: "'Playfair Display', serif",
                  }}>{active.cours?.nom || "Séance"}</h3>
                </div>
                <button onClick={() => setActive(null)} style={{
                  background: "#f1f5f9", border: "none", borderRadius: 8,
                  width: 28, height: 28, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>

              {active.estAnnulee && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 12px", borderRadius: 8, marginBottom: 14,
                  background: "#fef2f2", border: "1px solid #fca5a5",
                }}>
                  <AlertCircle style={{ width: 13, height: 13, color: "#ef4444" }} />
                  <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Séance annulée</p>
                </div>
              )}

              {[
                { icon: Calendar, label: "Date",       val: fmtDate(active.date) },
                { icon: Clock,    label: "Horaire",    val: `${active.heureDebut} – ${active.heureFin}` },
                { icon: MapPin,   label: "Salle",      val: active.salle ? `${active.salle.nom} · ${active.salle.batiment}` : "—" },
                { icon: User,     label: "Enseignant", val: active.enseignant ? `Prof. ${active.enseignant.prenom} ${active.enseignant.nom}` : "—" },
                { icon: BookOpen, label: "Groupe",     val: active.groupe },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon style={{ width: 13, height: 13, color: "#2563eb" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 1 }}>{label}</p>
                    <p style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{val}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ sessions }: { sessions: Session[] }) {
  const grouped: Record<string, Session[]> = {};
  sessions.forEach(s => {
    const key = s.date.split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, slist]) => (
        <div key={date}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#64748b",
            marginBottom: 8, textTransform: "capitalize" as const,
            letterSpacing: "0.04em",
          }}>{fmtDate(date)}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {slist.sort((a,b) => a.heureDebut.localeCompare(b.heureDebut)).map((s,i) => {
              const m = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", borderRadius: 12,
                    background: s.estAnnulee ? "#f8fafc" : m.bg,
                    border: `1px solid ${s.estAnnulee ? "#e2e8f0" : m.border}`,
                    opacity: s.estAnnulee ? 0.7 : 1,
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{
                    width: 3, position: "absolute", left: 0, top: 0, bottom: 0,
                    borderRadius: "12px 0 0 12px",
                    background: m.dot,
                  }} />

                  <div style={{ paddingLeft: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{s.heureDebut}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8" }}>{s.heureFin}</p>
                  </div>

                  <span style={{
                    fontSize: 9, fontWeight: 900, color: m.color,
                    background: "rgba(255,255,255,0.8)", padding: "2px 6px",
                    borderRadius: 4, flexShrink: 0,
                  }}>{m.label}</span>

                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: "#0f172a",
                      fontFamily: "'Playfair Display', serif",
                    }}>{s.cours?.nom || "—"}</p>
                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {s.enseignant ? `Prof. ${s.enseignant.prenom} ${s.enseignant.nom}` : "—"}
                      {s.salle ? ` · ${s.salle.nom}` : ""}
                    </p>
                  </div>

                  {s.estAnnulee && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: "#ef4444",
                      background: "#fef2f2", padding: "2px 7px",
                      borderRadius: 4, border: "1px solid #fca5a5",
                    }}>ANNULÉE</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [view,       setView]       = useState<"grille"|"liste">("grille");
  const [typeFilter, setTypeFilter] = useState("all");
  const [semaine,    setSemaine]    = useState<number | null>(null);
  const [groupe,     setGroupe]     = useState<string>("");

  const fetchEDT = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/edt`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur");

      const data = json.data;
      // Handle both { sessions: [] } and direct array shapes
      setSessions(Array.isArray(data) ? data : (data?.sessions ?? []));
      setGroupe(data?.groupe || "");

      const now   = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const week  = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
      setSemaine(week);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEDT(); }, []);

  const filtered = sessions.filter(s => typeFilter === "all" || s.type === typeFilter);
  const upcoming  = sessions.filter(s => new Date(s.date) >= new Date() && !s.estAnnulee).length;
  const cancelled = sessions.filter(s => s.estAnnulee).length;
  const thisWeek  = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - now.getDay() + 1);
    const endWeek   = new Date(startWeek); endWeek.setDate(startWeek.getDate() + 6);
    return d >= startWeek && d <= endWeek;
  }).length;

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
              }}>Mon emploi du temps</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {groupe ? `Groupe ${groupe}` : "Chargement…"}
                {semaine ? ` · Semaine ${semaine}` : ""}
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

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total séances", val: sessions.length, color: "#3b82f6" },
            { label: "À venir",       val: upcoming,        color: "#10b981" },
            { label: "Annulées",      val: cancelled,       color: "#ef4444" },
            { label: "Cette semaine", val: thisWeek,        color: "#8b5cf6" },
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

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" as const }}>
            {[
              { val: "all",               label: "Tous"   },
              { val: "COURS_MAGISTRAL",   label: "CM"     },
              { val: "TRAVAUX_DIRIGES",   label: "TD"     },
              { val: "TRAVAUX_PRATIQUES", label: "TP"     },
              { val: "EXAMEN",            label: "Examen" },
            ].map(f => (
              <button key={f.val} onClick={() => setTypeFilter(f.val)} style={{
                padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                background: typeFilter === f.val ? "#1e40af" : "#fff",
                color: typeFilter === f.val ? "#fff" : "#64748b",
                border: typeFilter === f.val ? "1px solid #1e40af" : "1px solid #e0e7ff",
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{
            display: "flex", background: "#fff", borderRadius: 9,
            border: "1px solid #e0e7ff", overflow: "hidden",
          }}>
            {(["grille","liste"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "7px 14px", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                background: view === v ? "#1e40af" : "transparent",
                color: view === v ? "#fff" : "#64748b",
                textTransform: "capitalize" as const,
              }}>{v}</button>
            ))}
          </div>
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
            <p style={{ fontSize: 14, color: "#94a3b8" }}>Chargement de votre emploi du temps…</p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16,
            border: "1px solid #fca5a5",
          }}>
            <AlertCircle style={{ width: 40, height: 40, color: "#ef4444", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>Erreur de chargement</p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>{error}</p>
            <button onClick={fetchEDT} style={{
              padding: "8px 20px", borderRadius: 9,
              background: "#3b82f6", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16,
            border: "1px dashed #e0e7ff",
          }}>
            <GraduationCap style={{ width: 44, height: 44, color: "#94a3b8", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Aucune séance trouvée</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Votre emploi du temps n'a pas encore été généré ou aucune séance ne correspond aux filtres.
            </p>
          </div>
        ) : (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 22,
            border: "1px solid #e0e7ff",
            boxShadow: "0 2px 10px rgba(30,58,110,0.05)",
          }}>
            {view === "grille" ? <TimetableGrid sessions={filtered} /> : <ListView sessions={filtered} />}
          </div>
        )}
      </div>
    </div>
  );
}
