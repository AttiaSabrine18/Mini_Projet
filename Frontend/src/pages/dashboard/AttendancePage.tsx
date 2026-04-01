import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, XCircle, Clock, Users, BookOpen,
  AlertTriangle, ChevronRight, Calendar,
} from "lucide-react";
import { apiCall, getUtilisateur } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Session {
  id: number;
  type: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  groupe: string;
  estAnnulee: boolean;
  cours: { id: number; nom: string; code: string };
  stats: { presencesMarquees: number; presents: number; absents: number; presenceComplete: boolean };
}

interface Etudiant {
  etudiantId: number;
  nom: string;
  prenom: string;
  numeroEtudiant: string;
  groupe: string;
  presenceMarquee: boolean;
  estPresent: boolean | null;
  justification: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const WORK_DAYS = [1, 2, 3, 4, 5, 6]; // Lundi → Samedi

function getDateForDay(targetDay: number): string {
  const today = new Date();
  const diff = (targetDay - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// ─── Spinner réutilisable ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AttendancePage() {
  const utilisateur = getUtilisateur();
  const role = utilisateur?.typeUtilisateur;

  // ─── État enseignant ────────────────────────────────────────────────────────
  const todayIndex = new Date().getDay() === 0 ? 1 : new Date().getDay();
  const [selectedDay,     setSelectedDay]     = useState(todayIndex);
  const [sessions,        setSessions]        = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [etudiants,       setEtudiants]       = useState<Etudiant[]>([]);
  const [presences,       setPresences]       = useState<Record<number, boolean>>({});
  const [justifs,         setJustifs]         = useState<Record<number, string>>({});

  // étape : "days" → "sessions" → "marquage"
  const [step, setStep] = useState<"days" | "sessions" | "marquage">("days");

  // ─── État étudiant ──────────────────────────────────────────────────────────
  const [historique, setHistorique] = useState<any[]>([]);
  const [statsEtu,   setStatsEtu]   = useState<any>(null);

  // ─── État admin ─────────────────────────────────────────────────────────────
  const [seancesSansPresence, setSeancesSansPresence] = useState<any[]>([]);

  const [loading,     setLoading]     = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (role === "ENSEIGNANT")     { setLoadingPage(false); }
    else if (role === "ETUDIANT")  { loadHistoriqueEtudiant(); }
    else if (role === "ADMINISTRATEUR") { loadSeancesSansPresence(); }
  }, [role]);

  // ── Charger les séances d'un jour ──────────────────────────────────────────
  const loadSessionsDuJour = async (day: number) => {
    setSelectedDay(day);
    setLoading(true);
    try {
      // Réutilise l'endpoint existant : filtre côté backend sur la date
      const date = getDateForDay(day);
      // Si le backend accepte ?date=YYYY-MM-DD, sinon on filtre depuis /sessions/aujourd-hui
      // et on adapte selon le jour sélectionné
      const data = await apiCall(`/presences/sessions?date=${date}`);
      setSessions(data.data?.sessions ?? []);
      setStep("sessions");
    } catch {
      // Fallback : si le backend n'a pas cet endpoint, on utilise aujourd'hui
      try {
        const data = await apiCall("/presences/sessions/aujourd-hui");
        const all: Session[] = data.data?.sessions ?? [];
        // Filtre local sur la date
        const date = getDateForDay(day);
        setSessions(all.filter((s) => s.date?.slice(0, 10) === date));
        setStep("sessions");
      } catch (err: any) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Charger les étudiants d'une séance ─────────────────────────────────────
  const loadEtudiants = async (session: Session) => {
    setSelectedSession(session);
    setLoading(true);
    try {
      const data = await apiCall(`/presences/sessions/${session.id}/etudiants`);
      const liste: Etudiant[] = data.data?.etudiants ?? [];
      setEtudiants(liste);

      const initP: Record<number, boolean> = {};
      const initJ: Record<number, string>  = {};
      liste.forEach((e) => {
        initP[e.etudiantId] = e.estPresent ?? true;
        initJ[e.etudiantId] = e.justification ?? "";
      });
      setPresences(initP);
      setJustifs(initJ);
      setStep("marquage");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Soumettre toutes les présences ─────────────────────────────────────────
  const soumettreBulk = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const body = etudiants.map((e) => ({
        etudiantId:    e.etudiantId,
        estPresent:    presences[e.etudiantId] ?? true,
        justification: !presences[e.etudiantId] ? (justifs[e.etudiantId] || undefined) : undefined,
      }));

      const data = await apiCall("/presences/bulk", {
        method: "POST",
        body: JSON.stringify({ sessionId: selectedSession.id, presences: body }),
      });

      toast.success(data.message ?? "Présences enregistrées !");
      setStep("sessions");
      // Rafraîchir la liste des séances
      loadSessionsDuJour(selectedDay);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Annuler une séance ─────────────────────────────────────────────────────
  const annulerSeance = async (sessionId: number) => {
    try {
      await apiCall(`/presences/sessions/${sessionId}/statut`, {
        method: "PATCH",
        body: JSON.stringify({ statut: "ANNULEE" }),
      });
      toast.success("Séance annulée.");
      loadSessionsDuJour(selectedDay);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Historique étudiant ────────────────────────────────────────────────────
  const loadHistoriqueEtudiant = async () => {
    setLoadingPage(true);
    try {
      const data = await apiCall("/presences/mon-historique");
      setHistorique(data.data?.historique ?? []);
      setStatsEtu(data.data?.statistiques);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPage(false);
    }
  };

  // ── Admin : séances sans présences ─────────────────────────────────────────
  const loadSeancesSansPresence = async () => {
    setLoadingPage(true);
    try {
      const data = await apiCall("/presences/admin/seances-sans-presence");
      setSeancesSansPresence(data.data?.seances ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPage(false);
    }
  };

  if (loadingPage) return <Spinner />;

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE ENSEIGNANT
  // ══════════════════════════════════════════════════════════════════════════
  if (role === "ENSEIGNANT") {

    // ── Étape 3 : Marquage des présences ───────────────────────────────────
    if (step === "marquage" && selectedSession) {
      const nbPresents = Object.values(presences).filter(Boolean).length;
      const nbAbsents  = etudiants.length - nbPresents;

      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setStep("days")} className="hover:text-foreground transition-colors">
              Jours
            </button>
            <ChevronRight size={14} />
            <button onClick={() => setStep("sessions")} className="hover:text-foreground transition-colors">
              {DAYS[selectedDay]}
            </button>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">{selectedSession.cours?.nom}</span>
          </div>

          {/* En-tête séance */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-lg">{selectedSession.cours?.nom}</p>
                <p className="text-sm text-muted-foreground">
                  <Clock size={12} className="inline mr-1" />
                  {selectedSession.heureDebut} – {selectedSession.heureFin}
                  {" · "}Groupe <strong>{selectedSession.groupe}</strong>
                  {" · "}{formatDateFr(selectedSession.date)}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-semibold">{nbPresents} présents</span>
                <span className="text-red-500 font-semibold">{nbAbsents} absents</span>
              </div>
            </CardContent>
          </Card>

          {etudiants.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun étudiant inscrit à ce cours.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Boutons rapides */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setPresences(Object.fromEntries(etudiants.map(e => [e.etudiantId, true])))}>
                  ✅ Tous présents
                </Button>
                <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => setPresences(Object.fromEntries(etudiants.map(e => [e.etudiantId, false])))}>
                  ❌ Tous absents
                </Button>
                <span className="ml-auto text-sm text-muted-foreground self-center">
                  {etudiants.length} étudiant(s)
                </span>
              </div>

              {/* Liste étudiants */}
              <div className="space-y-2">
                {etudiants.map((etu) => {
                  const estPresent = presences[etu.etudiantId] ?? true;
                  return (
                    <Card key={etu.etudiantId}
                      className={`transition-colors ${estPresent ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        {/* Avatar + infos */}
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            estPresent ? "bg-green-500" : "bg-red-400"
                          }`}>
                            {etu.prenom[0]}{etu.nom[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{etu.prenom} {etu.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              {etu.numeroEtudiant} · Gr. {etu.groupe}
                            </p>
                          </div>
                        </div>

                        {/* Contrôles droite */}
                        <div className="flex items-center gap-2">
                          {/* Justification (visible seulement si absent) */}
                          {!estPresent && (
                            <input
                              className="text-xs border rounded px-2 py-1.5 w-32 bg-white"
                              placeholder="Motif d'absence..."
                              value={justifs[etu.etudiantId] ?? ""}
                              onChange={(e) => setJustifs({ ...justifs, [etu.etudiantId]: e.target.value })}
                            />
                          )}
                          {/* Toggle présent / absent */}
                          <button
                            onClick={() => setPresences({ ...presences, [etu.etudiantId]: !estPresent })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              estPresent
                                ? "border-green-300 text-green-700 bg-white hover:bg-green-50"
                                : "border-red-300 text-red-600 bg-white hover:bg-red-50"
                            }`}
                          >
                            {estPresent
                              ? <><CheckCircle size={14} /> Présent</>
                              : <><XCircle    size={14} /> Absent</>
                            }
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Bouton soumettre */}
              <Button className="w-full" size="lg" onClick={soumettreBulk} disabled={loading}>
                {loading
                  ? "Enregistrement..."
                  : `Enregistrer les présences (${nbPresents} présents / ${nbAbsents} absents)`
                }
              </Button>
            </>
          )}
        </div>
      );
    }

    // ── Étape 2 : Liste des séances du jour sélectionné ────────────────────
    if (step === "sessions") {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setStep("days")} className="hover:text-foreground transition-colors">
              Jours
            </button>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">{DAYS[selectedDay]}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{DAYS[selectedDay]}</h1>
              <p className="text-sm text-muted-foreground">{formatDateFr(getDateForDay(selectedDay))}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadSessionsDuJour(selectedDay)}>
              🔄 Actualiser
            </Button>
          </div>

          {loading ? <Spinner /> : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-muted-foreground">Aucune séance ce jour.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <Card key={s.id}
                  className={`transition-all ${s.estAnnulee ? "opacity-50" : "hover:shadow-md"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Heure */}
                      <div className="text-center min-w-[72px] border-r pr-3">
                        <p className="text-sm font-semibold text-primary">{s.heureDebut}</p>
                        <p className="text-xs text-muted-foreground">{s.heureFin}</p>
                      </div>

                      {/* Infos séance */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{s.cours?.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.type?.replace("_", " ")} · Groupe {s.groupe}
                        </p>
                        {!s.estAnnulee && s.stats?.presencesMarquees > 0 && (
                          <p className="text-xs mt-1">
                            <span className="text-green-600">{s.stats.presents} présents</span>
                            {" · "}
                            <span className="text-red-400">{s.stats.absents} absents</span>
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {s.estAnnulee ? (
                          <Badge variant="destructive">Annulée</Badge>
                        ) : (
                          <>
                            <Badge variant={s.stats?.presenceComplete ? "default" : "secondary"}>
                              <Users size={10} className="mr-1" />
                              {s.stats?.presents ?? 0}
                            </Badge>
                            <Button size="sm" onClick={() => loadEtudiants(s)} disabled={loading}>
                              {s.stats?.presenceComplete ? "Modifier" : "Marquer"}
                              <ChevronRight size={14} className="ml-1" />
                            </Button>
                            <Button size="sm" variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => annulerSeance(s.id)}>
                              Annuler
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── Étape 1 : Sélection du jour ─────────────────────────────────────────
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Gestion des présences
          </h1>
          <p className="text-muted-foreground">Choisissez un jour pour voir vos séances</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {WORK_DAYS.map((day) => {
            const isToday = day === new Date().getDay();
            const date    = getDateForDay(day);
            return (
              <button
                key={day}
                onClick={() => loadSessionsDuJour(day)}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  isToday
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <span className="text-xs text-muted-foreground">{DAYS_SHORT[day]}</span>
                <span className="text-lg font-bold">{new Date(date).getDate()}</span>
                {isToday && (
                  <span className="text-xs text-primary font-medium">Aujourd'hui</span>
                )}
              </button>
            );
          })}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Cliquez sur un jour pour voir vos séances et gérer les présences</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE ÉTUDIANT — Historique absences
  // ══════════════════════════════════════════════════════════════════════════
  if (role === "ETUDIANT") {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes absences</h1>
          <p className="text-muted-foreground">Historique de vos présences</p>
        </div>

        {statsEtu && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Séances totales", value: statsEtu.total,        color: "text-foreground" },
              { label: "Présent",         value: statsEtu.presents,     color: "text-green-600"  },
              { label: "Taux présence",   value: statsEtu.tauxPresence, color: "text-primary"    },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des séances</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {historique.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Aucune donnée de présence.</p>
            ) : (
              historique.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {p.estPresent
                      ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                      : <XCircle    size={18} className="text-red-400   shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium">{p.session?.cours?.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.session?.date
                          ? new Date(p.session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                          : ""}
                        {p.session?.heureDebut && ` · ${p.session.heureDebut}`}
                      </p>
                      {p.justification && (
                        <p className="text-xs text-amber-600 mt-0.5">Motif : {p.justification}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={p.estPresent ? "default" : "destructive"}>
                    {p.estPresent ? "Présent" : "Absent"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE ADMIN — Séances sans présences
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Séances sans présences</h1>
          <p className="text-muted-foreground">Enseignants potentiellement absents</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSeancesSansPresence}>🔄 Actualiser</Button>
      </div>

      {seancesSansPresence.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-green-600 font-medium">
            ✅ Toutes les séances passées ont leurs présences marquées !
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle size={16} className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700">
              {seancesSansPresence.length} séance(s) sans présences détectée(s)
            </p>
          </div>

          <div className="space-y-3">
            {seancesSansPresence.map((s: any) => (
              <Card key={s.id} className="border-orange-200">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{s.cours?.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      {" · "}{s.heureDebut} – {s.heureFin}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enseignant : {s.enseignant?.utilisateur?.prenom} {s.enseignant?.utilisateur?.nom}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive"
                    onClick={async () => {
                      try {
                        await apiCall(`/presences/sessions/${s.id}/statut`, {
                          method: "PATCH",
                          body: JSON.stringify({ statut: "ANNULEE" }),
                        });
                        toast.success("Séance annulée.");
                        loadSeancesSansPresence();
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}>
                    Marquer annulée
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
