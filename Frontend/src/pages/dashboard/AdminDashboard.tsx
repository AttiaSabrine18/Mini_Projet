import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, BookOpen, Building2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Étudiants',  value: 48, icon: GraduationCap, color: 'bg-primary/10 text-primary' },
  { label: 'Enseignants', value: 12, icon: BookOpen,      color: 'bg-accent/10 text-accent' },
  { label: 'Cours',       value: 24, icon: BookOpen,      color: 'bg-chart-4/10 text-chart-4' },
  { label: 'Filières',    value: 5,  icon: Building2,     color: 'bg-chart-3/10 text-chart-3' },
];

const pendingUsers = [
  { id: '1', initials: 'AB', name: 'Ahmed Benali',   email: 'ahmed@email.com',  role: 'student' },
  { id: '2', initials: 'SM', name: 'Sara Mansouri',  email: 'sara@email.com',   role: 'teacher' },
  { id: '3', initials: 'KL', name: 'Karim Ladjali',  email: 'karim@email.com',  role: 'student' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground">Gérez votre plateforme universitaire</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demandes en attente ({pendingUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {user.initials}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Approuver
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}