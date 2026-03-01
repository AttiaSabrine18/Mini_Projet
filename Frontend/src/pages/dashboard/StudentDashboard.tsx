import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, MessageSquare, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Cours inscrits',        value: '6',   icon: BookOpen,      color: 'bg-primary/10 text-primary' },
  { label: 'Séances cette semaine', value: '12',  icon: Calendar,      color: 'bg-accent/10 text-accent' },
  { label: 'Forums actifs',         value: '4',   icon: MessageSquare, color: 'bg-chart-4/10 text-chart-4' },
  { label: 'Taux de présence',      value: '92%', icon: ClipboardList, color: 'bg-chart-5/10 text-chart-5' },
];

const todaySchedule = [
  { time: '08:00 - 09:30', course: 'Mathématiques', room: 'Salle A102' },
  { time: '10:00 - 11:30', course: 'Informatique',  room: 'Labo B204' },
  { time: '13:00 - 14:30', course: 'Physique',      room: 'Salle C301' },
];

const recentActivity = [
  { text: 'Nouveau support de cours ajouté - Algorithmique', time: 'Il y a 2h' },
  { text: 'Forum: Réponse du Prof. Martin',                  time: 'Il y a 5h' },
  { text: 'Note de TP Physique publiée',                     time: 'Hier' },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Bonjour 👋</h1>
        <p className="text-muted-foreground">Voici votre tableau de bord étudiant</p>
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
            <CardTitle className="font-display text-lg">Emploi du temps aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.map((item) => (
                <div key={item.time} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-primary min-w-[110px]">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.course}</p>
                    <p className="text-xs text-muted-foreground">{item.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm">{item.text}</p>
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