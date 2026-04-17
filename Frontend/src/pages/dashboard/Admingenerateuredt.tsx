import { useState, useRef, useEffect } from "react";
import {
  Calendar, Cpu, CheckCircle2, AlertTriangle,
  Download, RefreshCw, ChevronRight, Zap,
  Clock, MapPin, User, BookOpen, TrendingUp,
  Loader2, Play, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("accessToken");

// ── Types ─────────────────────────────────────────────────────────────────────
interface Promotion {
  id: number;
  code: string;
  niveau: string;
  anneeUniversitaire: string;
  specialite?: { nom: string; filiere?: { nom: string } };
}

interface Session {
  id:         number;
  code:       string;
  type:       "COURS_MAGISTRAL" | "TRAVAUX_DIRIGES" | "TRAVAUX_PRATIQUES" | "EXAMEN";
  date:       string;
  heureDebut: string;
  heureFin:   string;
  groupe:     string;
  estAnnulee: boolean;
  cours:      { nom: string; code: string } | null;
  module:     { nom: string; type: string } | null;
  salle:      { nom: string; batiment: string; capacite: number } | null;
  enseignant: { nom: string; prenom: string; grade: string } | null;
  emploiTemps:{ semaine: number; annee: string; groupe: string } | null;
}

interface GenResult {
  score:    number;
  qualite:  "Excellent" | "Bon" | "Acceptable";
  edt:      Session[];
  conflits: { type: string; message: string }[];
  nbSeances: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const JOURS    = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const CRENEAUX = ["08:00", "10:00", "12:00", "14:00", "16:00"];

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  COURS_MAGISTRAL:   { label: "CM", color: "#1e3a6e", bg: "#eff6ff", border: "#bfdbfe" },
  TRAVAUX_DIRIGES:   { label: "TD", color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7" },
  TRAVAUX_PRATIQUES: { label: "TP", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  EXAMEN:            { label: "EX", color: "#991b1b", bg: "#fef2f2", border: "#fca5a5" },
};

const QUALITE_META = {
  Excellent:  { color: "#065f46", bg: "#ecfdf5" },
  Bon:        { color: "#1e3a6e", bg: "#eff6ff" },
  Acceptable: { color: "#92400e", bg: "#fffbeb" },
};

// ── Shared tiny components ────────────────────────────────────────────────────
const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: "block", fontSize: 11, fontWeight: 700,
    color: "#374151", marginBottom: 6, letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontFamily: "'Playfair Display', serif",
  }}>{children}</label>
);

const Inp = (props: any) => (
  <input {...props} style={{
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #dbeafe", background: "#fff",
    fontSize: 14, color: "#0f1f3d", outline: "none",
    fontFamily: "'Inter', sans-serif", boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
  }}
    onFocus={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor = "#dbeafe"; e.currentTarget.style.boxShadow = "none"; }}
  />
);

const Sel = ({ children, ...props }: any) => (
  <select {...props} style={{
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #dbeafe", background: "#fff",
    fontSize: 14, color: "#0f1f3d", outline: "none",
    fontFamily: "'Inter', sans-serif", cursor: "pointer",
    appearance: "none" as const, boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
  }}
    onFocus={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor = "#dbeafe"; e.currentTarget.style.boxShadow = "none"; }}
  >{children}</select>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Évolution</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1e3a6e" }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#e0e7ff", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#3b82f6,#1e3a6e)" }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ── Timetable grid ────────────────────────────────────────────────────────────
function TimetableGrid({ sessions }: { sessions: Session[] }) {
  const [active, setActive] = useState<Session | null>(null);

  // Map: "Lundi-08:00" → Session[]
  const map: Record<string, Session[]> = {};
  sessions.forEach(s => {
    const d    = new Date(s.date);
    const days = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const jour = days[d.getDay()] || "Lundi";
    const key  = `${jour}-${s.heureDebut}`;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 860 }}>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "72px repeat(6,1fr)", gap: 5, marginBottom: 5 }}>
            <div />
            {JOURS.map(j => (
              <div key={j} style={{
                textAlign: "center", padding: "7px 4px",
                fontSize: 11, fontWeight: 800, color: "#1e3a6e",
                background: "#eff6ff", borderRadius: 7,
                fontFamily: "'Playfair Display', serif", letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
              }}>{j}</div>
            ))}
          </div>

          {/* Rows */}
          {CRENEAUX.map(cr => (
            <div key={cr} style={{ display: "grid", gridTemplateColumns: "72px repeat(6,1fr)", gap: 5, marginBottom: 5 }}>
              {/* Time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "#6b7280",
                  background: "#f3f4f6", padding: "3px 7px", borderRadius: 5,
                }}>{cr}</span>
              </div>

              {/* Cells */}
              {JOURS.map(jour => {
                const cells = map[`${jour}-${cr}`] || [];
                if (!cells.length) return (
                  <div key={jour} style={{
                    minHeight: 70, borderRadius: 9,
                    background: "#f9fafb", border: "1px dashed #e5e7eb",
                  }} />
                );
                return (
                  <div key={jour} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {cells.map(s => {
                      const m = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
                      return (
                        <motion.div
                          key={s.id}
                          whileHover={{ scale: 1.02, y: -1 }}
                          onClick={() => setActive(s)}
                          style={{
                            padding: "7px 9px", borderRadius: 9, cursor: "pointer",
                            background: m.bg, border: `1px solid ${m.border}`,
                            minHeight: 70, position: "relative", overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            transition: "box-shadow 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
                        >
                          <span style={{
                            position: "absolute", top: 5, right: 5,
                            fontSize: 8, fontWeight: 900, color: m.color,
                            background: "rgba(255,255,255,0.75)", padding: "1px 4px",
                            borderRadius: 3, letterSpacing: "0.06em",
                          }}>{m.label}</span>
                          <p style={{
                            fontSize: 11, fontWeight: 700, color: m.color,
                            lineHeight: 1.3, paddingRight: 22, marginBottom: 2,
                            fontFamily: "'Playfair Display', serif",
                          }}>{s.cours?.nom || "—"}</p>
                          {s.enseignant && (
                            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 1 }}>
                              {s.enseignant.prenom} {s.enseignant.nom}
                            </p>
                          )}
                          {s.salle && (
                            <p style={{ fontSize: 9.5, color: "#9ca3af" }}>{s.salle.nom}</p>
                          )}
                          <p style={{ fontSize: 9, color: m.color, opacity: 0.7, marginTop: 2, fontWeight: 600 }}>
                            {s.groupe}
                          </p>
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
                background: "#fff", borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 400, margin: 24,
                boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
                border: "1px solid #e0e7ff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <span style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 5,
                    background: TYPE_META[active.type]?.bg,
                    color: TYPE_META[active.type]?.color,
                    fontSize: 10, fontWeight: 800, marginBottom: 7,
                    letterSpacing: "0.06em",
                  }}>{TYPE_META[active.type]?.label} · {active.type.replace(/_/g, " ")}</span>
                  <h3 style={{
                    fontSize: 17, fontWeight: 700, color: "#0f1f3d",
                    fontFamily: "'Playfair Display', serif",
                  }}>{active.cours?.nom || "Séance"}</h3>
                </div>
                <button onClick={() => setActive(null)} style={{
                  background: "#f3f4f6", border: "none", borderRadius: 8,
                  width: 30, height: 30, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X style={{ width: 14, height: 14, color: "#6b7280" }} />
                </button>
              </div>

              {[
                { icon: Clock,    label: "Horaire",    val: `${active.heureDebut} – ${active.heureFin}` },
                { icon: Calendar, label: "Groupe",     val: active.groupe },
                { icon: MapPin,   label: "Salle",      val: active.salle ? `${active.salle.nom} · ${active.salle.batiment} (${active.salle.capacite} pl.)` : "—" },
                { icon: User,     label: "Enseignant", val: active.enseignant ? `${active.enseignant.prenom} ${active.enseignant.nom}` : "—" },
                { icon: BookOpen, label: "Module",     val: active.module?.nom || "—" },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, background: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon style={{ width: 13, height: 13, color: "#2563eb" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 1 }}>{label}</p>
                    <p style={{ fontSize: 13, color: "#0f1f3d", fontWeight: 500 }}>{val}</p>
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

// ── Liste view ────────────────────────────────────────────────────────────────
function ListView({ sessions }: { sessions: Session[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sessions.map((s, i) => {
        const m = TYPE_META[s.type] || TYPE_META.COURS_MAGISTRAL;
        return (
          <motion.div
            key={s.id ?? i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.015 }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 16px", borderRadius: 11,
              background: m.bg, border: `1px solid ${m.border}`,
            }}
          >
            <span style={{
              fontSize: 9, fontWeight: 900, color: m.color,
              background: "rgba(255,255,255,0.8)", padding: "2px 7px",
              borderRadius: 5, flexShrink: 0, letterSpacing: "0.06em",
            }}>{m.label}</span>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: "#0f1f3d",
                fontFamily: "'Playfair Display', serif",
              }}>{s.cours?.nom || "—"}</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {s.groupe} · {s.salle?.nom || "—"} · {s.enseignant ? `${s.enseignant.prenom} ${s.enseignant.nom}` : "—"}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: m.color }}>
                {s.heureDebut} – {s.heureFin}
              </p>
              <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminGenerateurEDT() {
  const [promotions,         setPromotions]         = useState<Promotion[]>([]);
  const [promotionsLoading,  setPromotionsLoading]  = useState(true);
  const [promotionId,        setPromotionId]        = useState("");
  const [semaine,            setSemaine]            = useState("");
  const [anneeUniv,          setAnneeUniv]          = useState("2025-2026");
  const [loading,            setLoading]            = useState(false);
  const [progress,           setProgress]           = useState(0);
  const [progressMsg,        setProgressMsg]        = useState("");
  const [result,             setResult]             = useState<GenResult | null>(null);
  const [error,              setError]              = useState<string | null>(null);
  const [view,               setView]               = useState<"grille" | "liste">("grille");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/promotions`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(json => {
        const list: Promotion[] = json.data ?? [];
        setPromotions(list);
        if (list.length > 0) setPromotionId(String(list[0].id));
      })
      .catch(() => setPromotions([]))
      .finally(() => setPromotionsLoading(false));
  }, []);

  function startSim() {
    setProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 2.5;
      if (p >= 95) { clearInterval(timerRef.current!); p = 95; }
      setProgress(p);
      setProgressMsg(`Génération ${Math.floor((p / 100) * 200)}/200 — optimisation…`);
    }, 200);
  }

  async function handleGenerer() {
    if (!promotionId || !semaine || !anneeUniv) { setError("Veuillez remplir tous les champs."); return; }
    setError(null);
    setResult(null);
    setLoading(true);
    startSim();

    try {
      const res = await fetch(`${API}/api/edt/generer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          promotionId:        parseInt(promotionId),
          semaine:            parseInt(semaine),
          anneeUniversitaire: anneeUniv,
        }),
      });

      clearInterval(timerRef.current!);
      setProgress(100);

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur serveur.");

      // Handle both response shapes
      const data = json.data ?? json;
      setResult({
        score:    data.score    ?? 0,
        qualite:  data.qualite  ?? "Bon",
        edt:      Array.isArray(data.edt) ? data.edt : [],
        conflits: data.conflits ?? data.conflitsResiduels ?? [],
        nbSeances: data.nbSeances ?? 0,
      });
      setProgressMsg("Algorithme terminé ✦");
    } catch (err: any) {
      clearInterval(timerRef.current!);
      setError(err.message || "Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  }

  const qMeta = result ? (QUALITE_META[result.qualite] || QUALITE_META.Bon) : QUALITE_META.Bon;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        .pf { font-family: 'Playfair Display', serif !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#07111f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            {["Administration", "Emploi du temps", "Génération"].map((t, i, arr) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 11, color: i === arr.length - 1 ? "#60a5fa" : "rgba(255,255,255,0.35)" }}>{t}</span>
                {i < arr.length - 1 && <ChevronRight style={{ width: 11, height: 11, color: "rgba(255,255,255,0.2)" }} />}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg,#3b82f6,#1e3a6e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
            }}>
              <Cpu style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <h1 className="pf" style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
                Générateur d'emploi du temps
              </h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3 }}>
                Algorithme génétique · Optimisation multi-contraintes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Config card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 22,
              border: "1px solid #e0e7ff",
              boxShadow: "0 2px 10px rgba(30,58,110,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Calendar style={{ width: 16, height: 16, color: "#2563eb" }} />
                </div>
                <div>
                  <p className="pf" style={{ fontSize: 14, fontWeight: 700, color: "#0f1f3d" }}>Paramètres</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>Configuration de la génération</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <Lbl>Promotion</Lbl>
                  {promotionsLoading ? (
                    <div style={{
                      padding: "10px 14px", borderRadius: 10, border: "1.5px solid #dbeafe",
                      background: "#f8faff", fontSize: 13, color: "#9ca3af",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                      Chargement…
                    </div>
                  ) : promotions.length === 0 ? (
                    <div style={{
                      padding: "10px 14px", borderRadius: 10,
                      border: "1.5px solid #fca5a5", background: "#fef2f2",
                      fontSize: 13, color: "#dc2626",
                    }}>Aucune promotion disponible</div>
                  ) : (
                    <Sel value={promotionId} onChange={(e: any) => setPromotionId(e.target.value)}>
                      {promotions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.niveau} · {p.anneeUniversitaire}
                          {p.specialite?.filiere ? ` · ${p.specialite.filiere.nom}` : ""}
                        </option>
                      ))}
                    </Sel>
                  )}
                </div>

                <div>
                  <Lbl>Semaine</Lbl>
                  <Inp
                    type="number" min="1" max="52" placeholder="ex. 14"
                    value={semaine}
                    onChange={(e: any) => setSemaine(e.target.value)}
                  />
                  <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Numéro de semaine (1–52)</p>
                </div>

                <div>
                  <Lbl>Année universitaire</Lbl>
                  <Sel value={anneeUniv} onChange={(e: any) => setAnneeUniv(e.target.value)}>
                    {["2024-2025","2025-2026","2026-2027"].map(y => <option key={y} value={y}>{y}</option>)}
                  </Sel>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 12px", borderRadius: 9, marginTop: 14,
                      background: "#fef2f2", border: "1px solid #fca5a5",
                    }}
                  >
                    <AlertTriangle style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleGenerer}
                disabled={loading}
                style={{
                  width: "100%", marginTop: 18, padding: "12px 0",
                  borderRadius: 11, border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading
                    ? "#93c5fd"
                    : "linear-gradient(135deg,#3b82f6,#1e3a6e)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 18px rgba(59,130,246,0.3)",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
              >
                {loading
                  ? <><Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Génération…</>
                  : <><Play style={{ width: 14, height: 14 }} /> Lancer l'algorithme</>
                }
              </button>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>

            {/* Progress */}
            <AnimatePresence>
              {(loading || result) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: "#fff", borderRadius: 16, padding: 20,
                    border: "1px solid #e0e7ff",
                    boxShadow: "0 2px 10px rgba(30,58,110,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                    <TrendingUp style={{ width: 15, height: 15, color: "#3b82f6" }} />
                    <p className="pf" style={{ fontSize: 13, fontWeight: 700, color: "#0f1f3d" }}>Progression</p>
                  </div>
                  <ProgressBar value={progress} />
                  {progressMsg && (
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 7, lineHeight: 1.5 }}>{progressMsg}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            
          </div>

          {/* RIGHT */}
          <div>
            {!result && !loading && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "56px 28px",
                border: "1px dashed #bfdbfe", textAlign: "center",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16, background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px",
                }}>
                  <Zap style={{ width: 26, height: 26, color: "#3b82f6" }} />
                </div>
                <h3 className="pf" style={{ fontSize: 18, fontWeight: 700, color: "#0f1f3d", marginBottom: 8 }}>
                  Prêt à générer
                </h3>
                <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 300, margin: "0 auto", lineHeight: 1.65 }}>
                  Configurez les paramètres et lancez l'algorithme génétique pour obtenir un emploi du temps optimisé.
                </p>
              </div>
            )}

            {loading && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "56px 28px",
                border: "1px solid #e0e7ff", textAlign: "center",
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  style={{
                    width: 52, height: 52, borderRadius: "50%",
                    border: "3px solid #e0e7ff", borderTopColor: "#3b82f6",
                    margin: "0 auto 22px",
                  }}
                />
                <h3 className="pf" style={{ fontSize: 18, fontWeight: 700, color: "#0f1f3d", marginBottom: 6 }}>
                  Algorithme en cours…
                </h3>
                <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
                  Optimisation des contraintes horaires en cours.<br />
                  Cela peut prendre quelques secondes.
                </p>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Toolbar */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14, flexWrap: "wrap", gap: 10,
                }}>
                  <div>
                    <h2 className="pf" style={{ fontSize: 18, fontWeight: 700, color: "#0f1f3d" }}>
                      Emploi du temps généré
                    </h2>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      {result.edt.length} séances · Semaine {semaine} · {anneeUniv}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 7 }}>
                    {/* View toggle */}
                    <div style={{
                      display: "flex", background: "#fff", borderRadius: 9,
                      border: "1px solid #e0e7ff", overflow: "hidden",
                    }}>
                      {(["grille","liste"] as const).map(v => (
                        <button key={v} onClick={() => setView(v)} style={{
                          padding: "7px 14px", border: "none", cursor: "pointer",
                          fontSize: 12, fontWeight: 600,
                          background: view === v ? "#1e3a6e" : "transparent",
                          color: view === v ? "#fff" : "#6b7280",
                          textTransform: "capitalize" as const,
                          transition: "all 0.15s",
                        }}>{v}</button>
                      ))}
                    </div>

                    <button onClick={handleGenerer} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", borderRadius: 9,
                      border: "1px solid #bfdbfe", background: "#eff6ff",
                      color: "#1e3a6e", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}
                    >
                      <RefreshCw style={{ width: 12, height: 12 }} /> Régénérer
                    </button>

                    <button style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", borderRadius: 9,
                      border: "none", background: "#0f1f3d",
                      color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(15,31,61,0.2)",
                      transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#1e3a6e"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#0f1f3d"; }}
                    >
                      <Download style={{ width: 12, height: 12 }} /> Exporter
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: 20,
                  border: "1px solid #e0e7ff",
                  boxShadow: "0 2px 10px rgba(30,58,110,0.06)",
                }}>
                  {result.edt.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <p style={{ fontSize: 14, color: "#9ca3af" }}>Aucune séance générée.</p>
                    </div>
                  ) : view === "grille" ? (
                    <TimetableGrid sessions={result.edt} />
                  ) : (
                    <ListView sessions={result.edt} />
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
