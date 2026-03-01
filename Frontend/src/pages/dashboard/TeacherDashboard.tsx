import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, MessageSquare, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Mes cours',      value: '4',   icon: BookOpen,     color: 'bg-primary/10 text-primary' },
  { label: 'Étudiants',     value: '120',  icon: Users,        color: 'bg-accent/10 text-accent' },
  { label: 'Forums',        value: '6',   icon: MessageSquare, color: 'bg-chart-4/10 text-chart-4' },
  { label: 'Présence moy.', value: '88%', icon: UserCheck,     color: 'bg-chart-5/10 text-chart-5' },
];

const todayCourses = [
  { time: '08:00 - 09:30', course: 'Algorithmique',   group: 'Groupe A1' },
  { time: '10:00 - 11:30', course: 'Base de données', group: 'Groupe B2' },
  { time: '14:00 - 15:30', course: 'Algorithmique',   group: 'Groupe A2' },
];

const recentSubmissions = [
  { initials: 'A', student: 'Ahmed B.',  text: 'Compte rendu TP3 - Algorithmique',  time: 'Il y a 1h' },
  { initials: 'S', student: 'Sara M.',   text: 'Compte rendu TP2 - Base de données', time: 'Il y a 3h' },
  { initials: 'K', student: 'Karim L.',  text: 'Réponse forum - SQL avancé',         time: 'Hier' },
];

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Bonjour, Prof. 👋</h1>
        <p className="text-muted-foreground">Voici votre espace enseignant</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Cours d'aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayCourses.map((item) => (
                <div key={item.time + item.group} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-primary min-w-[110px]">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.course}</p>
                    <p className="text-xs text-muted-foreground">{item.group}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Soumissions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.student}</p>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}