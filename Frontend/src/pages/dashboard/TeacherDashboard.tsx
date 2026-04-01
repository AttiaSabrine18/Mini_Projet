import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall, getUtilisateur } from '@/lib/api';

export default function TeacherDashboard() {
  const utilisateur = getUtilisateur();
  const [sessions,  setSessions]  = useState<any[]>([]);
  const [stats,     setStats]     = useState({ cours: 0, presents: 0, absents: 0 });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { if (utilisateur?.id) loadAll(); }, [utilisateur?.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/presences/sessions/aujourd-hui");
      const s   = res.data?.sessions ?? [];
      setSessions(s);
      const totalPresents = s.reduce((acc: number, x: any) => acc + (x.stats?.presents ?? 0), 0);
      const totalAbsents  = s.reduce((acc: number, x: any) => acc + (x.stats?.absents  ?? 0), 0);
      setStats({ cours: s.length, presents: totalPresents, absents: totalAbsents });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Séances aujourd\'hui', value: stats.cours,    icon: BookOpen,  color: 'bg-primary/10 text-primary'  },
    { label: 'Étudiants présents',   value: stats.presents, icon: UserCheck, color: 'bg-accent/10 text-accent'    },
    { label: 'Étudiants absents',    value: stats.absents,  icon: Users,     color: 'bg-chart-4/10 text-chart-4'  },
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
          Bonjour, Prof. {utilisateur?.prenom || ''} 👋
        </h1>
        <p className="text-muted-foreground">Voici votre espace enseignant</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
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
          <CardTitle className="font-display text-lg">Séances d'aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucune séance aujourd'hui.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-primary min-w-[110px]">
                    {s.heureDebut} – {s.heureFin}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.cours?.nom ?? 'Cours'}</p>
                    <p className="text-xs text-muted-foreground">Groupe {s.groupe}</p>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-green-600 font-medium">{s.stats?.presents ?? 0} présents</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-red-400">{s.stats?.absents ?? 0} absents</span>
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
