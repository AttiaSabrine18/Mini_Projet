import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, BookOpen, Building2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState({ etudiants: 0, enseignants: 0, cours: 0, filieres: 0 });
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Stats globales — GET /admin/statistiques
      const statsRes = await apiCall('/admin/statistiques');
      const s = statsRes.data;
      setStats({
        etudiants:   s.totalEtudiants  ?? s.etudiants  ?? 0,
        enseignants: s.totalEnseignants ?? s.enseignants ?? 0,
        cours:       s.totalCours      ?? s.cours       ?? 0,
        filieres:    s.totalFilieres   ?? s.filieres    ?? 0,
      });
    } catch { /* silencieux */ }

    try {
      // Demandes en attente — GET /admin/demandes
      const demandesRes = await apiCall('/admin/demandes');
      setPending(demandesRes.data?.demandes ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approuver = async (id: number) => {
    try {
      await apiCall(`/admin/demandes/${id}/valider`, { method: 'PUT' });
      toast.success('Compte validé ✅');
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const refuser = async (id: number) => {
    try {
      await apiCall(`/admin/demandes/${id}/refuser`, {
        method: 'PUT',
        body: JSON.stringify({ raison: "Demande refusée par l'administrateur" }),
      });
      toast.success('Demande refusée');
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const statCards = [
    { label: 'Étudiants',   value: stats.etudiants,   icon: GraduationCap, color: 'bg-primary/10 text-primary'     },
    { label: 'Enseignants', value: stats.enseignants, icon: BookOpen,      color: 'bg-accent/10 text-accent'       },
    { label: 'Cours',       value: stats.cours,       icon: BookOpen,      color: 'bg-chart-4/10 text-chart-4'     },
    { label: 'Filières',    value: stats.filieres,    icon: Building2,     color: 'bg-chart-3/10 text-chart-3'     },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground">Gérez votre plateforme universitaire</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demandes en attente ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">✅ Aucune demande en attente</p>
          ) : (
            <div className="space-y-3">
              {pending.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{u.typeUtilisateur}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approuver(u.id)} className="gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Approuver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => refuser(u.id)} className="gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Refuser
                    </Button>
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
