import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, Search, MessageCircle, Plus, ChevronRight,
  BookOpen, Clock, Users, Loader2, GraduationCap, Eye,
  TrendingUp, Sparkles, Filter, Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("accessToken");

// ─────────────────────────────────────────────────────────────────────────────
//  ROLE DETECTION
//  Source of truth = JWT payload (decoded from accessToken).
//  Falls back to every possible field in the stored "user" object.
//  Matches any casing / language the backend might use.
// ─────────────────────────────────────────────────────────────────────────────
function decodeJwtPayload(): Record<string, any> {
  try {
    const t = token();
    if (!t) return {};
    return JSON.parse(atob(t.split(".")[1]));
  } catch { return {}; }
}

function getStoredUser(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

/**
 * Returns "teacher" | "admin" | "student"
 * Reads from JWT first (most reliable), then from every field that
 * any version of this backend might have stored.
 */
function detectRole(): "teacher" | "admin" | "student" {
  const jwt  = decodeJwtPayload();
  const user = getStoredUser();

  // Collect every candidate value, normalise to uppercase
  const candidates: string[] = [
    jwt.typeUtilisateur,
    jwt.role,
    jwt.type,
    jwt.userType,
    user.typeUtilisateur,
    user.role,
    user.type,
    user.userType,
    user.profil,
  ]
    .filter(Boolean)
    .map(v => String(v).toUpperCase().trim());

  const TEACHER_VALUES = ["ENSEIGNANT", "TEACHER", "PROF", "PROFESSEUR"];
  const ADMIN_VALUES   = ["ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR"];

  for (const v of candidates) {
    if (TEACHER_VALUES.some(t => v.includes(t))) return "teacher";
    if (ADMIN_VALUES.some(a => v.includes(a)))   return "admin";
  }

  return "student";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
type Forum = {
  id:          string;
  title:       string;
  description: string | null;
  forum_type:  string;
  created_at:  string;
  course:      { title: string } | null;
  promotion:   string | null;
  creator:     { first_name: string; last_name: string };
  post_count:  number;
};
type Course    = { id: string; title: string };
type Promotion = { id: string; label: string };

function mapForum(f: any): Forum {
  const promo = f.cours?.programme?.promotion;
  return {
    id:          String(f.id),
    title:       f.titre       || "",
    description: f.description || null,
    forum_type:  (f.type       || "GENERAL").toLowerCase(),
    created_at:  f.dateCreation || "",
    course:      f.cours ? { title: f.cours.nom || f.cours.code || "Cours" } : null,
    promotion:   promo ? `${promo.niveau} - ${promo.anneeUniversitaire}` : null,
    creator: {
      first_name: f.createur?.utilisateur?.prenom || "",
      last_name:  f.createur?.utilisateur?.nom    || "",
    },
    post_count: f.nbMessages || 0,
  };
}

function smartDate(s: string) {
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "—";
    if (isToday(d))     return "Aujourd'hui";
    if (isYesterday(d)) return "Hier";
    return format(d, "d MMM yyyy", { locale: fr });
  } catch { return "—"; }
}

const TYPE_META: Record<string, { label: string; emoji: string; pill: string }> = {
  comptes_rendus:     { label: "Compte rendu", emoji: "📝", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  questions_reponses: { label: "Q&R",          emoji: "❓", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400"   },
  annouces:           { label: "Annonce",       emoji: "📢", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400"         },
  general:            { label: "Général",       emoji: "💬", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400"         },
};
const getMeta = (t: string) => TYPE_META[t] || TYPE_META["general"];

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ForumsPage() {
  const navigate = useNavigate();

  // Detect role ONCE on mount via JWT + localStorage
  const role      = detectRole();
  const isTeacher = role === "teacher";
  const isAdmin   = role === "admin";
  const isStudent = role === "student";
  const canCreate = isTeacher || isAdmin;

  const [forums,      setForums]      = useState<Forum[]>([]);
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [promotions,  setPromotions]  = useState<Promotion[]>([]);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [promoFilter, setPromoFilter] = useState("all");
  const [sortBy,      setSortBy]      = useState<"recent" | "active">("recent");
  const [loading,     setLoading]     = useState(true);
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [newTitle,    setNewTitle]    = useState("");
  const [newDesc,     setNewDesc]     = useState("");
  const [newType,     setNewType]     = useState("general");
  const [newCourseId, setNewCourseId] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchForums = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/forum`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.message || `Erreur ${res.status}`);
        return;
      }
      const data          = await res.json();
      const raw: any[]    = data.data?.threads || data.data || [];
      const mapped        = raw.map(mapForum);
      setForums(mapped);

      const pm = new Map<string, string>();
      mapped.forEach(f => { if (f.promotion) pm.set(f.promotion, f.promotion); });
      setPromotions(Array.from(pm.entries()).map(([id, label]) => ({ id, label })));
    } catch {
      toast.error("Erreur de chargement des forums");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (!canCreate) return;
    try {
      const res  = await fetch(`${API}/api/cours`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      setCourses(list.map((c: any) => ({ id: String(c.id), title: c.nom || c.code })));
    } catch {}
  };

  useEffect(() => {
    fetchForums();
    fetchCourses();
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim() || !newCourseId) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/forum`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          titre:       newTitle.trim(),
          description: newDesc.trim() || null,
          type:        newType.toUpperCase(),
          coursId:     parseInt(newCourseId),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.message || "Erreur lors de la création");
        return;
      }
      toast.success("Forum créé avec succès !");
      setDialogOpen(false);
      setNewTitle(""); setNewDesc(""); setNewType("general"); setNewCourseId("");
      fetchForums();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setCreating(false);
    }
  };

  // ── Filter / sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = forums.filter(f => {
      const q = search.toLowerCase();
      return (
        (f.title.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)) &&
        (typeFilter  === "all" || f.forum_type === typeFilter) &&
        (promoFilter === "all" || f.promotion  === promoFilter)
      );
    });
    if (sortBy === "active") list = [...list].sort((a, b) => b.post_count - a.post_count);
    return list;
  }, [forums, search, typeFilter, promoFilter, sortBy]);

  const totalMessages = forums.reduce((s, f) => s + f.post_count, 0);
  const activeCourses = new Set(forums.map(f => f.course?.title).filter(Boolean)).size;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-7 text-white shadow-2xl"
>
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles className="h-3.5 w-3.5" />
              {isStudent ? "Espace étudiant" : isAdmin ? "Espace administrateur" : "Espace enseignant"}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <MessageSquare className="h-8 w-8" /> Forums
            </h1>
            <p className="mt-1 text-sm text-white/75 max-w-md">
              {isStudent
                ? "Posez vos questions et participez aux discussions avec vos enseignants."
                : "Créez des forums, animez les discussions et guidez vos étudiants."}
            </p>
          </div>

          {/* Right: stats + action */}
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
            {[
  { icon: MessageSquare, val: forums.length, label: "forums"   },
  { icon: MessageCircle, val: totalMessages, label: "messages" },
  { icon: BookOpen,      val: activeCourses, label: "cours"    },
].map(s => (
  <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2.5 min-w-[90px]">
    <s.icon className="h-4 w-4 text-white/70 shrink-0" />
    <div>
      <p className="text-2xl font-bold leading-none">{s.val}</p>
      <p className="text-[10px] text-white/65 mt-0.5">{s.label}</p>
    </div>
  </div>
))}
            </div>

            {/* ── CREATE BUTTON — only teachers & admins ── */}
            {canCreate && (
              <Button
                size="lg"
                onClick={() => setDialogOpen(true)}
                className="gap-2 bg-white text-primary font-bold shadow-xl hover:bg-white/90 hover:scale-[1.02] active:scale-100 transition-all w-full md:w-auto"
              >
                <Plus className="h-5 w-5" />
                Nouveau Forum
              </Button>
            )}

            {/* Students see an informational tag */}
            {isStudent && (
              <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white/80 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Lecture &amp; participation uniquement
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Student banner ─────────────────────────────────────────────────── */}
      {isStudent && (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300"
  >
          <Eye className="h-4 w-4 shrink-0" />
          <p>
            Vous pouvez <strong>lire et répondre</strong> dans tous les forums.
            Seuls les enseignants peuvent créer de nouveaux forums.
          </p>
        </motion.div>
      )}

      {/* ══ FILTERS ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2.5 items-center"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un forum…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[155px] h-10">
            <Filter className="h-3.5 w-3.5 mr-1.5 opacity-50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="general">💬 Général</SelectItem>
            <SelectItem value="questions_reponses">❓ Q&R</SelectItem>
            <SelectItem value="comptes_rendus">📝 Compte rendu</SelectItem>
            <SelectItem value="annouces">📢 Annonce</SelectItem>
          </SelectContent>
        </Select>

        {promotions.length > 0 && (
          <Select value={promoFilter} onValueChange={setPromoFilter}>
            <SelectTrigger className="w-[185px] h-10">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5 opacity-50" />
              <SelectValue placeholder="Toutes promos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes promotions</SelectItem>
              {promotions.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={v => setSortBy(v as "recent" | "active")}>
          <SelectTrigger className="w-[145px] h-10">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5 opacity-50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="active">Plus actifs</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-1">
          <Hash className="h-3 w-3" />
          {filtered.length} forum{filtered.length !== 1 ? "s" : ""}
          {search && <span> · « <strong>{search}</strong> »</span>}
        </p>
      )}

      {/* ══ LIST ══════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des forums…</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((forum, i) => {
              const meta  = getMeta(forum.forum_type);
              const isHot = forum.post_count > 5;
              return (
                <motion.div
                  key={forum.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.035, type: "spring", stiffness: 320, damping: 28 }}
                >
                  <Card
                    className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/50 hover:ring-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/dashboard/forums/${forum.id}`)}
                  >
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-primary scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-200 rounded-r-full" />
                    <CardContent className="p-4 pl-5 flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br from-muted to-muted/50 shadow-inner group-hover:scale-105 transition-transform">
                        {meta.emoji}
                        {isHot && <span className="absolute -top-1.5 -right-1.5 text-sm">🔥</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {forum.title}
                        </p>
                        {forum.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {forum.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {forum.course && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                              <BookOpen className="h-2.5 w-2.5" />{forum.course.title}
                            </span>
                          )}
                          {forum.promotion && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-chart-4/10 text-chart-4 rounded-full px-2 py-0.5">
                              <GraduationCap className="h-2.5 w-2.5" />{forum.promotion}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${meta.pill}`}>
                            {meta.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <strong className="text-foreground">{forum.post_count}</strong>
                            &nbsp;message{forum.post_count !== 1 ? "s" : ""}
                          </span>
                          {(forum.creator.first_name || forum.creator.last_name) && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Prof.&nbsp;{forum.creator.first_name} {forum.creator.last_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />{smartDate(forum.created_at)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <div className="text-6xl mb-4">💬</div>
              <p className="text-base font-semibold">Aucun forum trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? `Aucun résultat pour « ${search} ».`
                  : "Aucun forum disponible pour le moment."}
              </p>
              {canCreate && (
                <Button className="mt-5 gap-2" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Créer le premier forum
                </Button>
              )}
              {isStudent && (
                <p className="text-xs text-muted-foreground mt-3">
                  Contactez votre enseignant pour qu'il crée un forum.
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ══ CREATE DIALOG ═════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen && canCreate} onOpenChange={open => canCreate && setDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="h-5 w-5 text-primary" />
              Créer un nouveau forum
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="f-title">Titre *</Label>
              <Input
                id="f-title"
                placeholder="Ex : Questions sur l'Algorithmique"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                maxLength={120}
              />
              <p className="text-[11px] text-muted-foreground text-right">{newTitle.length}/120</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="f-desc">Description</Label>
              <Textarea
                id="f-desc"
                placeholder="Décrivez l'objectif de ce forum…"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">💬 Général</SelectItem>
                    <SelectItem value="questions_reponses">❓ Q&R</SelectItem>
                    <SelectItem value="comptes_rendus">📝 Compte rendu</SelectItem>
                    <SelectItem value="annouces">📢 Annonce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cours associé *</Label>
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                  <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Aucun cours disponible
                      </div>
                    ) : (
                      courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newCourseId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                La promotion sera automatiquement déduite du cours sélectionné.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim() || !newCourseId}
            >
              {creating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création…</>
                : <><Plus className="h-4 w-4 mr-1.5" /> Créer le forum</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
