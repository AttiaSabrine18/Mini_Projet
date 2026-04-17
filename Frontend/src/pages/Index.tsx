import { Link } from "react-router-dom";
import {
  GraduationCap, BookOpen, Users, Calendar,
  MessageSquare, Shield, ArrowRight, ChevronDown,
  Star, CheckCircle2, Sparkles,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const BG_HERO = "/issatso.webp";

const features = [
  { icon: GraduationCap, title: "Espace Étudiant",    desc: "Consultez vos cours, emploi du temps et soumettez vos travaux facilement.", accent: "#2563eb", bg: "#eff6ff" }, /* Updated: replaced green with blue */
  { icon: BookOpen,      title: "Gestion des Cours",  desc: "Les enseignants déposent supports, créent des forums et suivent la présence.", accent: "#1d4ed8", bg: "#eff6ff" }, /* Updated: replaced amber with blue */
  { icon: Calendar,      title: "Emploi du Temps",    desc: "Planification hebdomadaire intelligente pour étudiants et enseignants.", accent: "#1e3a6e", bg: "#eff4fd" },
  { icon: MessageSquare, title: "Forums & Échanges",  desc: "Espaces de discussion, comptes rendus et questions/réponses interactifs.", accent: "#3b82f6", bg: "#eff6ff" }, /* Updated: replaced purple with blue */
  { icon: Shield,        title: "Administration",      desc: "Validation des comptes, gestion des filières et statistiques avancées.", accent: "#2563eb", bg: "#eff6ff" }, /* Updated: replaced red with blue */
  { icon: Users,         title: "Collaboration",       desc: "Travaillez ensemble dans un environnement numérique moderne et intuitif.", accent: "#0ea5e9", bg: "#f0f9ff" }, /* Updated: replaced teal with light blue */
];

const checks = [
  "Interface intuitive et responsive",
  "Sécurité et confidentialité des données",
  "Accès en temps réel aux ressources",
  "Communication simplifiée entre tous",
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: "inline-block", padding: "4px 14px", borderRadius: 40,
    background: "#eff6ff", color: "#1e3a6e", fontSize: 11,
    fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const,
    marginBottom: 18, border: "1px solid #bfdbfe", /* Updated: lighter blue border */
    fontFamily: "'Playfair Display', serif",
  }}>{children}</span>
);

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", background: "#f8f8f6" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .pf { font-family: 'Playfair Display', serif !important; }
        .inter { font-family: 'Inter', sans-serif !important; }
        ::selection { background: rgba(59,130,246,0.28); } /* Updated: light blue selection */
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 60,
          background: "rgba(7,17,31,0.6)",
          backdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center",
        }}
      >
        <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)", /* Updated: blue gradient instead of amber */
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(59,130,246,0.35)",
            }}>
              <GraduationCap style={{ width: 17, height: 17, color: "#fff" }} />
            </div>
            <span className="pf" style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>UniPortal</span>
          </Link>

          <div className="inter" style={{ display: "flex", gap: 32, fontSize: 13 }}>
            {[["Fonctionnalités", "#features"], ["À propos", "#about"], ["Contact", "#contact"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", transition: "color 0.18s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
              >{label}</a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <button className="inter" style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.75)", padding: "7px 16px", borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >Connexion</button>
            </Link>
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <button className="inter" style={{
                background: "#3b82f6", border: "none", /* Updated: blue instead of amber */
                color: "#fff", padding: "7px 18px", borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s",
                boxShadow: "0 2px 12px rgba(59,130,246,0.4)",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "translateY(0)"; }}
              >S'inscrire</button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO — full-width image, blur behind text ─────────── */}
      <section ref={heroRef} style={{
        minHeight: "100vh", paddingTop: 60,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center",
      }}>
        {/* Full-width campus image — sharp on the right, will be blurred on left via overlay */}
        <motion.div style={{ y: bgY, position: "absolute", inset: 0 }}>
          <img
            src={BG_HERO}
            alt="ISSATSO Campus"
            style={{
              width: "100%", height: "115%", objectFit: "cover",
              objectPosition: "center 35%",
              filter: "brightness(0.82) saturate(1.06) contrast(1.03)",
            }}
          />
        </motion.div>

        {/* Blur layer — strongest on left, fades to nothing on right
            Uses a masked backdrop-filter so the image beneath is blurred, not just darkened */}
        <div style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(7px)",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 75%)",
          maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 75%)",
        }} />

        {/* Subtle dark tint over blur zone only, for text contrast */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(5,12,24,0.55) 0%, rgba(5,12,24,0.3) 35%, rgba(5,12,24,0.05) 60%, transparent 75%)",
        }} />

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
          background: "linear-gradient(to top, rgba(5,12,24,0.45), transparent)",
        }} />

        {/* Text content — left-aligned, sits on the blurred zone */}
        <motion.div style={{ opacity: contentOpacity, position: "relative", zIndex: 10, width: "100%" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px" }}>
            <div style={{ maxWidth: 560 }}>
            <motion.div
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.7 }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "6px 14px", borderRadius: 40, marginBottom: 30,
                background: "rgba(59,130,246,0.12)", /* Updated: blue background */
                border: "1px solid rgba(59,130,246,0.28)",
              }}>
                <Sparkles style={{ width: 11, height: 11, color: "#60a5fa" }} /> 
                <span className="inter" style={{ color: "rgba(59,130,246,0.9)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em" }}>
                  ISSATSO — Sousse, Tunisie
                </span>
              </div>

              <h1 className="pf" style={{
                fontSize: "clamp(40px, 4.5vw, 70px)", fontWeight: 700,
                color: "#fff", lineHeight: 1.06, marginBottom: 22, letterSpacing: "-0.3px",
              }}>
                Votre espace<br />
                <span style={{
                  fontStyle: "italic", fontWeight: 600,
                  background: "linear-gradient(90deg, #bfdbfe, #60a5fa)", /* Updated: blue gradient */
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>académique</span>
                <br />numérique
              </h1>

              <p className="inter" style={{
                color: "rgba(255,255,255,0.65)", fontSize: 15.5, lineHeight: 1.72,
                maxWidth: 400, marginBottom: 40, fontWeight: 300,
              }}>
                Gérez vos cours, collaborez avec vos enseignants et accédez à vos ressources pédagogiques — en un seul endroit.
              </p>

              <div style={{ display: "flex", gap: 12 }}>
                <Link to="/auth" style={{ textDecoration: "none" }}>
                  <button className="inter" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: "#fff", color: "#0f1f3d", border: "none", cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.22)", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.22)"; }}
                  >Commencer <ArrowRight style={{ width: 15, height: 15 }} /></button>
                </Link>
                <a href="#features" style={{ textDecoration: "none" }}>
                  <button className="inter" style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                    background: "transparent", color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                  >Explorer <ChevronDown style={{ width: 15, height: 15 }} /></button>
                </a>
              </div>

              {/* Mini stats */}
              <div style={{
                display: "flex", gap: 36, marginTop: 60,
                paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.12)",
              }}>
                {[["2 000+", "Étudiants"], ["150+", "Enseignants"], ["99%", "Satisfaction"]].map(([v, l]) => (
                  <div key={l}>
                    <p className="pf" style={{ fontSize: 28, fontWeight: 700, color: "#60a5fa", lineHeight: 1 }}>{v}</p> 
                    <p className="inter" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 5, letterSpacing: "0.04em" }}>{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Floating rating card — bottom right, over the sharp part of the image */}
        <motion.div
          initial={{ opacity: 0, y: 16, x: 10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ delay: 1, duration: 0.55 }}
          style={{
            position: "absolute", bottom: 44, right: 52, zIndex: 20,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            borderRadius: 16, padding: "16px 18px",
            boxShadow: "0 20px 56px rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.85)",
            minWidth: 190,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg, #1e3a6e, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Users style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <div>
              <p className="pf" style={{ fontSize: 13, fontWeight: 700, color: "#0f1f3d" }}>Communauté active</p>
              <p className="inter" style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>2 000+ utilisateurs</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 11, paddingTop: 11, borderTop: "1px solid #f0f0ee" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} style={{ width: 11, height: 11, fill: "#60a5fa", stroke: "none" }} /> /* Updated: blue stars */
            ))}
            <span className="inter" style={{ fontSize: 11, color: "#9ca3af", marginLeft: 5 }}>Évalué 5/5</span>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: "108px 0", background: "#f8f8f6" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 60 }}>
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 className="pf" style={{ fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 700, color: "#0f1f3d", marginBottom: 14, lineHeight: 1.1 }}>
              Tout ce dont vous avez besoin
            </h2>
            <p className="inter" style={{ color: "#6b7280", fontSize: 15, maxWidth: 420, lineHeight: 1.68 }}>
              Une plateforme complète pensée pour connecter étudiants, enseignants et administration.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -5 }}
                  style={{
                    padding: "28px 24px", borderRadius: 18, background: "#fff",
                    border: "1px solid #ebebeb",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    cursor: "default", transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.09)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 13,
                    background: f.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20, border: `1px solid ${f.accent}1a`,
                  }}>
                    <Icon style={{ width: 22, height: 22, color: f.accent }} />
                  </div>
                  <h3 className="pf" style={{ fontSize: 19, fontWeight: 700, color: "#0f1f3d", marginBottom: 8 }}>{f.title}</h3>
                  <p className="inter" style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────── */}
      <section id="about" style={{ padding: "108px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionLabel>À propos</SectionLabel>
              <h2 className="pf" style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 700, color: "#0f1f3d", lineHeight: 1.12, marginBottom: 20 }}>
                Conçue pour l'excellence académique
              </h2>
              <p className="inter" style={{ color: "#6b7280", lineHeight: 1.78, marginBottom: 32, fontSize: 15 }}>
                UniPortal est développée spécifiquement pour l'ISSATSO afin de moderniser la gestion académique et offrir une expérience numérique fluide à toute la communauté universitaire.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 40 }}>
                {checks.map(item => (
                  <div key={item} className="inter" style={{ display: "flex", alignItems: "center", gap: 11, color: "#374151", fontSize: 14 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <CheckCircle2 style={{ width: 13, height: 13, color: "#2563eb" }} /> 
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <button className="inter" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 26px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: "#0f1f3d", color: "#fff", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(15,31,61,0.22)", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1e3a6e"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#0f1f3d"; e.currentTarget.style.transform = "translateY(0)"; }}
                >Rejoindre la plateforme <ArrowRight style={{ width: 15, height: 15 }} /></button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ position: "relative" }}>
              <div style={{
                position: "absolute", top: 20, right: -18, bottom: -20, left: 20,
                borderRadius: 24, background: "#eff6ff", zIndex: 0,
              }} />
              <div style={{ position: "relative", zIndex: 1, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.13)" }}>
                <img
                  src={BG_HERO}
                  alt="ISSATSO Campus"
                  style={{
                    width: "100%", height: 340, objectFit: "cover",
                    objectPosition: "center 25%",
                    filter: "brightness(0.92) saturate(1.1)",
                  }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,31,61,0.28) 0%, transparent 60%)" }} />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                style={{
                  position: "absolute", bottom: -18, left: -18, zIndex: 2,
                  background: "#fff", borderRadius: 14, padding: "14px 18px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid #ebebeb",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star style={{ width: 17, height: 17, fill: "#60a5fa", stroke: "none" }} /> 
                </div>
                <div>
                  <p className="pf" style={{ fontSize: 13, fontWeight: 700, color: "#0f1f3d" }}>Reconnu & certifié</p>
                  <p className="inter" style={{ fontSize: 11.5, color: "#9ca3af" }}>Ministère de l'Enseignement</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "120px 0", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={BG_HERO} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover",
            objectPosition: "center 58%",
            filter: "brightness(0.52) saturate(0.85)",
          }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(5,12,26,0.35) 0%, rgba(5,12,26,0.72) 100%)" }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 30 }}>
              <div style={{ height: 1, width: 44, background: "rgba(96,165,250,0.45)" }} /> 
              <Star style={{ width: 13, height: 13, fill: "#60a5fa", stroke: "none" }} /> 
              <div style={{ height: 1, width: 44, background: "rgba(96,165,250,0.45)" }} /> 
            </div>
            <h2 className="pf" style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 700, color: "#fff", marginBottom: 18, lineHeight: 1.1 }}>
              Prêt à rejoindre<br />
              <em style={{ fontStyle: "italic", color: "#bfdbfe" }}>la plateforme ?</em> 
            </h2>
            <p className="inter" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 360, margin: "0 auto 44px", fontSize: 15, lineHeight: 1.68, fontWeight: 300 }}>
              Créez votre compte en quelques secondes et accédez à votre espace académique.
            </p>
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <button className="inter" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 34px", borderRadius: 11, fontSize: 15, fontWeight: 700,
                background: "#fff", color: "#0f1f3d", border: "none", cursor: "pointer",
                boxShadow: "0 6px 32px rgba(0,0,0,0.28)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,0,0,0.28)"; }}
              >Créer mon compte <ArrowRight style={{ width: 16, height: 16 }} /></button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer id="contact" style={{ background: "#07111f", padding: "52px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)", /* Updated: blue gradient */
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <GraduationCap style={{ width: 15, height: 15, color: "#fff" }} />
              </div>
              <span className="pf" style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>UniPortal</span>
            </Link>
            <p className="inter" style={{ color: "rgba(255,255,255,0.22)", fontSize: 12 }}>© 2026 ISSATSO · Sousse, Tunisie</p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Confidentialité", "Contact"].map(l => (
                <a key={l} href="#" className="inter" style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textDecoration: "none", transition: "color 0.18s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
