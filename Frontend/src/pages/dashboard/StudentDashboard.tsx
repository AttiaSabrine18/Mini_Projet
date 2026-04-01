import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall, getUtilisateur } from '@/lib/api';

export default function StudentDashboard() {
  const utilisateur = getUtilisateur();
  const [sessions,  setSessions]  = useState<any[]>([]);
  const [presence,  setPresence]  = useState<any>(null);
  const [cours,     setCours]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { 
    if (!utilisateur) {
      setLoading(false);
      return;
    }
    loadAll(); 
  }, [utilisateur?.id]); // Utiliser l'ID pour éviter la boucle infinie

  const loadAll = async () => {
    setLoading(true);
    try {
      // EDT du jour via l'endpoint édt
      const edtRes = await apiCall("/edt?jour=" + new Date().toISOString().slice(0, 10));
      setSessions(edtRes.data?.sessions ?? edtRes.data ?? []);
    } catch { /* ignore */ }

    try {
      // Utiliser la nouvelle route qui ne nécessite pas d'ID
      const presRes = await apiCall("/presences/mon-historique");
      setPresence(presRes.data?.statistiques);
    } catch { /* ignore */ }

    setLoading(false);
  };

  const stats = [
    { label: 'Séances aujourd\'hui', value: sessions.length, icon: Calendar,      color: 'bg-accent/10 text-accent'         },
    { label: 'Taux de présence',     value: presence?.tauxPresence ?? '—',        icon: ClipboardList, color: 'bg-chart-5/10 text-chart-5' },
    { label: 'Total séances',        value: presence?.total ?? '—', icon: BookOpen, color: 'bg-primary/10 text-primary'     },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">
          Bonjour {utilisateur?.prenom || ''} 👋
        </h1>
        <p className="text-muted-foreground">Voici votre tableau de bord étudiant</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="shadow-card border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="font-display text-lg">Emploi du temps aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">🎉 Aucun cours aujourd'hui !</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-primary min-w-[110px]">
                    {s.heureDebut} – {s.heureFin}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.cours?.nom ?? s.matiere ?? 'Cours'}</p>
                    <p className="text-xs text-muted-foreground">{s.salle?.nom ?? s.salle ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
