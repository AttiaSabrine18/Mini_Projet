import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['hsl(152, 32%, 36%)', 'hsl(28, 80%, 56%)', 'hsl(200, 50%, 50%)', 'hsl(340, 60%, 55%)'];

export default function StatsPage() {
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // GET /admin/statistiques
      const res = await apiCall('/admin/statistiques');
      setStats(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  const etudiants   = stats?.totalEtudiants   ?? stats?.etudiants   ?? 0;
  const enseignants = stats?.totalEnseignants ?? stats?.enseignants ?? 0;
  const cours       = stats?.totalCours       ?? stats?.cours       ?? 0;
  const filieres    = stats?.totalFilieres    ?? stats?.filieres    ?? 0;
  const pending     = stats?.demandesEnAttente ?? stats?.pending     ?? 0;

  const statCards = [
    { label: 'Étudiants',   value: etudiants,   icon: GraduationCap, color: 'bg-primary/10 text-primary'     },
    { label: 'Enseignants', value: enseignants, icon: BookOpen,      color: 'bg-accent/10 text-accent'       },
    { label: 'Cours',       value: cours,       icon: BookOpen,      color: 'bg-chart-4/10 text-chart-4'     },
    { label: 'En attente',  value: pending,     icon: TrendingUp,    color: 'bg-chart-5/10 text-chart-5'     },
  ];

  const barData = [
    { name: 'Étudiants',   count: etudiants   },
    { name: 'Enseignants', count: enseignants },
    { name: 'Cours',       count: cours       },
    { name: 'Filières',    count: filieres    },
  ];

  const roleData = [
    { name: 'Étudiants',   value: etudiants   },
    { name: 'Enseignants', value: enseignants },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Statistiques
        </h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="shadow-card border-0">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Répartition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Utilisateurs par rôle</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
