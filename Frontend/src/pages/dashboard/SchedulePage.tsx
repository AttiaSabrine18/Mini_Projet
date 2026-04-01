import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const DAY_COLORS = [
  'bg-primary/10 border-primary/20',
  'bg-accent/10 border-accent/20',
  'bg-chart-4/10 border-chart-4/20',
  'bg-chart-5/10 border-chart-5/20',
  'bg-chart-3/10 border-chart-3/20',
  'bg-secondary border-secondary',
];

// Retourne la date ISO (YYYY-MM-DD) du prochain jour de la semaine donné
function getDateForDay(targetDay: number): string {
  const today = new Date();
  const current = today.getDay(); // 0=dim ... 6=sam
  const diff = (targetDay - current + 7) % 7;
  const target = new Date(today);
  target.setDate(today.getDate() + (diff === 0 ? 0 : diff));
  return target.toISOString().slice(0, 10);
}

export default function SchedulePage() {
  const [sessions,     setSessions]     = useState<any[]>([]);
  const [selectedDay,  setSelectedDay]  = useState(new Date().getDay() === 0 ? 1 : new Date().getDay());
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { loadEDT(selectedDay); }, [selectedDay]);

  const loadEDT = async (day: number) => {
    setLoading(true);
    try {
      const jour = getDateForDay(day);
      // GET /edt?jour=YYYY-MM-DD
      const res = await apiCall(`/edt?jour=${jour}`);
      // La réponse peut être data.sessions ou data directement (tableau)
      const raw = res.data?.sessions ?? res.data ?? [];
      setSessions(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      toast.error(err.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Emploi du temps
        </h1>
        <p className="text-muted-foreground">Consultez votre planning hebdomadaire</p>
      </motion.div>

      {/* Sélecteur jours */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <motion.button
            key={day}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'bg-card hover:bg-muted text-foreground'
            }`}
          >
            {DAYS[day]}
          </motion.button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {sessions.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-muted-foreground">Aucun cours ce jour — profitez-en !</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map((s: any, i: number) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`shadow-card border ${DAY_COLORS[i % DAY_COLORS.length]}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex flex-col items-center min-w-[70px]">
                      <Clock className="h-4 w-4 text-primary mb-1" />
                      <span className="text-xs font-medium">{s.heureDebut}</span>
                      <span className="text-xs text-muted-foreground">{s.heureFin}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{s.cours?.nom ?? s.matiere ?? 'Cours'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.type?.replace('_', ' ')} {s.groupe ? `· Groupe ${s.groupe}` : ''}
                      </p>
                      {(s.salle?.nom ?? s.salle) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {s.salle?.nom ?? s.salle}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
