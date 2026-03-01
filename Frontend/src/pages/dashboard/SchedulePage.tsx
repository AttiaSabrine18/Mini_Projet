import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_COLORS = [
  "bg-primary/10 border-primary/20",
  "bg-accent/10 border-accent/20",
  "bg-chart-4/10 border-chart-4/20",
  "bg-chart-5/10 border-chart-5/20",
  "bg-chart-3/10 border-chart-3/20",
  "bg-secondary border-secondary",
];

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  course: { title: string } | null;
};

// Mock schedule data
const MOCK_SCHEDULES: Schedule[] = [
  { id: "1", day_of_week: 1, start_time: "09:00", end_time: "11:00", room: "A101", course: { title: "Introduction à la programmation" } },
  { id: "2", day_of_week: 1, start_time: "14:00", end_time: "16:00", room: "B203", course: { title: "Mathématiques pour l'informatique" } },
  { id: "3", day_of_week: 2, start_time: "10:00", end_time: "12:00", room: "C305", course: { title: "Bases de données" } },
  { id: "4", day_of_week: 2, start_time: "15:00", end_time: "17:00", room: "A102", course: { title: "Développement web" } },
  { id: "5", day_of_week: 3, start_time: "09:00", end_time: "12:00", room: "B201", course: { title: "Algorithmes et structures de données" } },
  { id: "6", day_of_week: 4, start_time: "13:00", end_time: "15:00", room: "C301", course: { title: "Intelligence artificielle" } },
  { id: "7", day_of_week: 5, start_time: "11:00", end_time: "13:00", room: "A104", course: { title: "Réseaux" } },
  { id: "8", day_of_week: 5, start_time: "15:00", end_time: "17:00", room: "B207", course: { title: "Sécurité informatique" } },
];

export default function SchedulePage() {
  const [schedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const daySchedules = schedules.filter((s) => s.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Emploi du temps
        </h1>
        <p className="text-muted-foreground">Consultez votre planning hebdomadaire</p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <motion.button
            key={day}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-card hover:bg-muted text-foreground"
            }`}
          >
            {DAYS[day]}
          </motion.button>
        ))}
      </div>

      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-3"
      >
        {daySchedules.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-muted-foreground">Aucun cours ce jour — profitez-en !</p>
            </CardContent>
          </Card>
        ) : (
          daySchedules.map((s, i) => (
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
                    <span className="text-xs font-medium">{s.start_time}</span>
                    <span className="text-xs text-muted-foreground">{s.end_time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.course?.title || "Cours"}</p>
                    {s.room && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {s.room}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}