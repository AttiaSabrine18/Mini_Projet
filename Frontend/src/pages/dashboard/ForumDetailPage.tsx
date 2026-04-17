import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, MessageCircle, Send, Clock, BookOpen, Users,
  Trash2, Edit2, MoreVertical, Loader2, ShieldAlert, Eye,
  Paperclip, X, Download,
  CornerDownRight, RefreshCw, ThumbsUp, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const API        = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token      = () => localStorage.getItem("accessToken");
const MAX_FILE_MB = 5;

// ─────────────────────────────────────────────────────────────────────────────
//  Auth helpers
// ─────────────────────────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

function detectRole(user: Record<string, any>) {
  const raw = (user.typeUtilisateur || user.role || "").toUpperCase();
  if (raw === "ENSEIGNANT" || raw === "TEACHER")   return "teacher";
  if (raw === "ADMINISTRATEUR" || raw === "ADMIN") return "admin";
  return "student";
}

function getCurrentUserId(): number | null {
  try {
    const t = token();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1])).id || null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Date helpers
// ─────────────────────────────────────────────────────────────────────────────
function smartDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "—";
    const time = format(d, "HH:mm", { locale: fr });
    if (isToday(d))     return `Aujourd'hui à ${time}`;
    if (isYesterday(d)) return `Hier à ${time}`;
    return format(d, "d MMM yyyy 'à' HH:mm", { locale: fr });
  } catch { return "—"; }
}

function smartDateShort(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "—";
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  } catch { return "—"; }
}

function fmtSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024, sz = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sz[i]}`;
}

function fileEmoji(mime: string) {
  if (mime?.startsWith("image/"))                              return "🖼️";
  if (mime === "application/pdf")                             return "📄";
  if (mime?.includes("word"))                                 return "📝";
  if (mime?.includes("excel") || mime?.includes("spreadsheet")) return "📊";
  if (mime?.includes("presentation") || mime?.includes("powerpoint")) return "📽️";
  return "📎";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
type ForumMeta = {
  title: string; description: string | null; forum_type: string;
  created_at: string; course: string; creator_id: number | null;
};

type Attachment = {
  id: string; filename: string; filepath: string;
  filesize: number; mimetype: string;
};

type Post = {
  id: string; content: string; created_at: string; updated_at: string;
  author_id: number;
  author: { first_name: string; last_name: string; role: string };
  attachments: Attachment[];
  replies: Post[];
  likes: number;
  isOwn: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
//  mapMessage
// ─────────────────────────────────────────────────────────────────────────────
function mapMessage(m: any, uid: number | null): Post {
  const rawRole = (m.auteur?.typeUtilisateur || m.auteur?.role || "").toUpperCase();
  const role =
    rawRole === "ENSEIGNANT" || rawRole === "TEACHER"     ? "teacher" :
    rawRole === "ADMINISTRATEUR" || rawRole === "ADMIN"   ? "admin"   : "student";

  const authorId   = m.auteurId ?? m.author_id ?? null;
  const rawReplies = m.sousReponses || m.replies || [];

  return {
    id:         String(m.id),
    content:    m.contenu    || m.content    || "",
    created_at: m.datePublication || m.date  || m.created_at || "",
    updated_at: m.datePublication || m.date  || "",
    author_id:  authorId,
    author: {
      first_name: m.auteur?.prenom      || m.auteur?.first_name || "?",
      last_name:  m.auteur?.nom         || m.auteur?.last_name  || "",
      role,
    },
    attachments: (m.attachments || []).map((a: any) => ({
      id:       String(a.id),
      filename: a.filename,
      filepath: a.filepath,
      mimetype: a.mimetype || "",
      filesize: a.filesize || 0,
    })),
    replies: rawReplies.map((r: any) => mapMessage(r, uid)),
    likes:   m.nbLikes || m.likes || 0,
    isOwn:   uid !== null && authorId === uid,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  comptes_rendus:     "📝 Compte rendu",
  questions_reponses: "❓ Q&R",
  annouces:           "📢 Annonce",
  general:            "💬 Général",
};

const ROLE_COLORS: Record<string, string> = {
  teacher: "bg-primary/20 text-primary",
  admin:   "bg-destructive/20 text-destructive",
  student: "bg-chart-4/20 text-chart-4",
};

const ROLE_LABELS: Record<string, string> = {
  teacher: "Enseignant",
  admin:   "Admin",
  student: "Étudiant",
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ForumDetailPage() {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate    = useNavigate();

  const user          = getCurrentUser();
  const role          = detectRole(user);
  const isTeacher     = role === "teacher";
  const isAdmin       = role === "admin";
  const isStudent     = role === "student";
  const currentUserId = getCurrentUserId();

  const [forumMeta,     setForumMeta]     = useState<ForumMeta | null>(null);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [sending,       setSending]       = useState(false);
  const [newMessage,    setNewMessage]    = useState("");
  const [attachments,   setAttachments]   = useState<File[]>([]);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [editContent,   setEditContent]   = useState("");
  const [replyTo,       setReplyTo]       = useState<{ id: string; name: string } | null>(null);
  const [deleteDlg,     setDeleteDlg]     = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  // ── Fetch forum ────────────────────────────────────────────────────────────
  const fetchForum = useCallback(async (silent = false) => {
    if (!forumId) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res  = await fetch(`${API}/api/forum/${forumId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || `Erreur ${res.status}`);
        return;
      }

      const f = json.data;
      if (!f) { toast.error("Forum introuvable"); return; }

      setForumMeta({
        title:       f.titre       || "",
        description: f.description || null,
        forum_type:  (f.type       || "GENERAL").toLowerCase(),
        created_at:  f.dateCreation || "",
        course:      f.cours?.nom  || f.cours?.code || "Cours",
        creator_id:  f.createur?.utilisateurId ?? f.createur?.id ?? null,
      });

      const raw = f.reponses || f.messages || [];
      setPosts(raw.map((m: any) => mapMessage(m, currentUserId)));
    } catch (e) {
      console.error("[ForumDetail] fetch error:", e);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [forumId, currentUserId]);

  useEffect(() => { fetchForum(); }, [fetchForum]);

  // Auto scroll to bottom on new posts
  useEffect(() => {
    if (!loading && posts.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loading]);

  // Scroll button detection
  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFiles = (files: File[]) => {
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name} dépasse ${MAX_FILE_MB} MB`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...valid].slice(0, 5));
  };

  // ── Send message ───────────────────────────────────────────────────────────
  // IMPORTANT: uses FormData so multer can receive files
  const handleSend = async () => {
    const hasText  = newMessage.trim().length > 0;
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) return;
    if (!forumId) return;

    setSending(true);
    try {
      // Always use FormData — even for text-only messages
      // This is required because the route uses multer middleware
      const formData = new FormData();
      formData.append("contenu", newMessage.trim() || " "); // space fallback for file-only
      if (replyTo?.id) formData.append("parentId", String(replyTo.id));

      // Append each file under the field name "attachments"
      attachments.forEach(file => formData.append("attachments", file));

      const res = await fetch(`${API}/api/forum/${forumId}/reponse`, {
        method:  "POST",
        headers: {
          // ⚠️ DO NOT set Content-Type manually with FormData
          // The browser sets it automatically with the correct multipart boundary
          Authorization: `Bearer ${token()}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.message || "Erreur d'envoi");
        return;
      }

      setNewMessage("");
      setReplyTo(null);
      setAttachments([]);
      toast.success("Message envoyé !");
      await fetchForum(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  // ── Edit (local only — no backend endpoint yet) ────────────────────────────
  const handleSaveEdit = (postId: string) => {
    if (!editContent.trim()) return;
    setPosts(ps => ps.map(p =>
      p.id === postId ? { ...p, content: editContent.trim() } : p
    ));
    setEditId(null);
    setEditContent("");
    toast.success("Message modifié");
  };

  // ── Delete forum ───────────────────────────────────────────────────────────
  const handleDeleteForum = async () => {
    if (!forumId) return;
    try {
      const res = await fetch(`${API}/api/forum/${forumId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.message || "Erreur"); return; }
      toast.success("Forum supprimé");
      navigate("/dashboard/forums");
    } catch { toast.error("Erreur réseau"); }
  };

  const isForumCreator = isTeacher && forumMeta?.creator_id === currentUserId;
  const canDeleteForum = isAdmin || isForumCreator;
  const participants   = new Set(posts.map(p => p.author_id)).size;
  const myAvatarColor  = ROLE_COLORS[role] || ROLE_COLORS.student;

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!loading && !forumMeta) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-muted-foreground font-medium">Forum introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/forums")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux forums
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-0">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground gap-1.5"
            onClick={() => navigate("/dashboard/forums")}>
            <ArrowLeft className="h-4 w-4" /> Forums
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => fetchForum(true)} disabled={refreshing} title="Rafraîchir">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            {isStudent && (
              <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1.5">
                <Eye className="h-3 w-3" /> Participation
              </Badge>
            )}
            {canDeleteForum && !loading && (
              <Button variant="outline" size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
                onClick={() => setDeleteDlg(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Forum header card */}
        {loading ? (
          <Card className="shadow-sm border-0 ring-1 ring-border/50">
            <CardContent className="p-5 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Chargement…</span>
            </CardContent>
          </Card>
        ) : forumMeta && (
          <Card className="shadow-sm border-0 ring-1 ring-border/50 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-chart-4" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-xl leading-tight">{forumMeta.title}</h1>
                  {forumMeta.description && (
                    <p className="text-sm text-muted-foreground mt-1">{forumMeta.description}</p>
                  )}
                </div>
                {(isTeacher || isAdmin) && (
                  <Badge className="shrink-0 text-xs bg-primary/10 text-primary border-0 gap-1">
                    <ShieldAlert className="h-3 w-3" /> Géré par vous
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                <Badge variant="secondary" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" />{forumMeta.course}
                </Badge>
                <Badge className="text-xs bg-primary/10 text-primary border-0">
                  {TYPE_LABEL[forumMeta.forum_type] || "💬 Général"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <strong className="text-foreground">{posts.length}</strong>
                  &nbsp;message{posts.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <strong className="text-foreground">{participants}</strong>
                  &nbsp;participant{participants !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                  <Clock className="h-3 w-3" />
                  {smartDateTime(forumMeta.created_at).split(" à")[0]}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Messages list ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        <div ref={scrollRef} onScroll={onScroll}
          className="h-full overflow-y-auto space-y-3 pr-1 pb-2 scroll-smooth">

          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des messages…</p>
            </div>
          ) : posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center py-16 text-center">
              <div className="text-6xl mb-4">🗨️</div>
              <p className="font-semibold">Aucun message</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isStudent ? "Soyez le premier à poser une question !" : "Lancez la discussion !"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  isTeacher={isTeacher}
                  isAdmin={isAdmin}
                  editId={editId}
                  editContent={editContent}
                  onEdit={(id, c) => { setEditId(id); setEditContent(c); }}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => { setEditId(null); setEditContent(""); }}
                  onEditChange={setEditContent}
                  onReply={(id, name) => { setReplyTo({ id, name }); textareaRef.current?.focus(); }}
                  onDeleteForum={() => setDeleteDlg(true)}
                />
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Compose area ──────────────────────────────────────────────────── */}
      <div className="shrink-0 pt-3">
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardContent className="p-4 space-y-3">

            {/* Reply indicator */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
                >
                  <CornerDownRight className="h-3 w-3 shrink-0 text-primary" />
                  <span>Réponse à <strong className="text-foreground">{replyTo.name}</strong></span>
                  <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attachment previews */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2"
                >
                  {attachments.map((file, idx) => (
                    <div key={idx}
                      className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs max-w-[200px]">
                      <span className="text-base leading-none">{fileEmoji(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-muted-foreground">{fmtSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => setAttachments(a => a.filter((_, i) => i !== idx))}
                        className="hover:text-destructive transition-colors shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="flex gap-3 items-start"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); }}>

              <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                <AvatarFallback className={`text-xs font-bold ${myAvatarColor}`}>
                  {(user.prenom?.[0] || user.firstName?.[0] || "?").toUpperCase()}
                  {(user.nom?.[0]    || user.lastName?.[0]  || "").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <Textarea
                  ref={textareaRef}
                  placeholder={isStudent
                    ? "Posez votre question ou participez à la discussion…"
                    : "Rédigez votre réponse ou annonce…"}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={2}
                  className="text-sm resize-none focus-visible:ring-primary/50"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
                  }}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  {/* File picker */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || attachments.length >= 5}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Fichier {attachments.length > 0 && `(${attachments.length}/5)`}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    className="hidden"
                    onChange={e => {
                      handleFiles(Array.from(e.target.files || []));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />

                  <p className="text-[10px] text-muted-foreground hidden sm:block">
                    Ctrl+Entrée · Glisser-déposer accepté
                  </p>

                  {/* Send button — enabled if text OR files present */}
                  <Button
                    size="sm"
                    className="ml-auto gap-2 h-8"
                    onClick={handleSend}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                  >
                    {sending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</>
                      : <><Send className="h-3.5 w-3.5" /> Envoyer</>
                    }
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Delete forum dialog ────────────────────────────────────────────── */}
      <AlertDialog open={deleteDlg} onOpenChange={setDeleteDlg}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce forum ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForum}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PostCard
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({
  post, index, isTeacher, isAdmin,
  editId, editContent,
  onEdit, onSaveEdit, onCancelEdit, onEditChange, onReply, onDeleteForum,
}: {
  post:          Post;
  index:         number;
  isTeacher:     boolean;
  isAdmin:       boolean;
  editId:        string | null;
  editContent:   string;
  onEdit:        (id: string, content: string) => void;
  onSaveEdit:    (id: string) => void;
  onCancelEdit:  () => void;
  onEditChange:  (v: string) => void;
  onReply:       (id: string, name: string) => void;
  onDeleteForum: () => void;
}) {
  const isEditing   = editId === post.id;
  const canManage   = post.isOwn || isAdmin || isTeacher;
  const authorName  = `${post.author.first_name} ${post.author.last_name}`.trim() || "Utilisateur";
  const displayName = post.author.role === "teacher" ? `Prof. ${authorName}` : authorName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 300, damping: 28 }}
    >
      <Card className={`shadow-sm border-0 ring-1 ${
        post.isOwn ? "ring-primary/20 bg-primary/[0.02]" : "ring-border/40"
      } hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">

            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
              <AvatarFallback className={`text-xs font-bold ${ROLE_COLORS[post.author.role] || ROLE_COLORS.student}`}>
                {post.author.first_name?.[0] || "?"}{post.author.last_name?.[0] || ""}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold leading-none">{displayName}</span>
                <Badge variant="outline"
                  className={`text-[10px] px-1.5 py-0 border-0 leading-none ${ROLE_COLORS[post.author.role] || ROLE_COLORS.student}`}>
                  {ROLE_LABELS[post.author.role] || "Étudiant"}
                </Badge>
                {post.isOwn && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-dashed leading-none">
                    Vous
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto"
                  title={smartDateTime(post.created_at)}>
                  {smartDateShort(post.created_at)}
                </span>
              </div>

              {/* Body */}
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={e => onEditChange(e.target.value)}
                    rows={3}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onSaveEdit(post.id)}>Enregistrer</Button>
                    <Button size="sm" variant="ghost" onClick={onCancelEdit}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  {/* Attachments */}
                  {post.attachments.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {post.attachments.map(att => (
                        <a
                          key={att.id}
                          href={`${API}/uploads/${att.filepath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2.5 rounded-xl bg-muted/60 hover:bg-muted px-3 py-2 transition-colors ring-1 ring-border/40 hover:ring-primary/30"
                        >
                          <span className="text-xl">{fileEmoji(att.mimetype)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{att.filename}</p>
                            <p className="text-[10px] text-muted-foreground">{fmtSize(att.filesize)}</p>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center gap-3 mt-2.5">
                    <button
                      onClick={() => onReply(post.id, displayName)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <CornerDownRight className="h-3 w-3" /> Répondre
                    </button>
                    {post.likes > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" /> {post.likes}
                      </span>
                    )}
                  </div>

                  {/* Sub-replies */}
                  {post.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-border/50 space-y-3">
                      {post.replies.map(reply => {
                        const rName = `${reply.author.first_name} ${reply.author.last_name}`.trim();
                        return (
                          <div key={reply.id} className="flex items-start gap-2.5">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className={`text-[10px] font-bold ${ROLE_COLORS[reply.author.role] || ROLE_COLORS.student}`}>
                                {reply.author.first_name?.[0] || "?"}{reply.author.last_name?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 rounded-xl bg-muted/40 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                  {reply.author.role === "teacher" ? "Prof. " : ""}{rName}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-auto"
                                  title={smartDateTime(reply.created_at)}>
                                  {smartDateShort(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions dropdown */}
            {canManage && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {post.isOwn && (
                    <DropdownMenuItem onClick={() => onEdit(post.id, post.content)}>
                      <Edit2 className="h-3.5 w-3.5 mr-2" /> Modifier
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onReply(post.id, displayName)}>
                    <CornerDownRight className="h-3.5 w-3.5 mr-2" /> Répondre
                  </DropdownMenuItem>
                  {(isAdmin || isTeacher) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={onDeleteForum}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer le forum
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
