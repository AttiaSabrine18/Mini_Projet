import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, GraduationCap, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const students = [
  { id: "1", first_name: "Ahmed", last_name: "Benali", email: "ahmed.benali@email.com" },
  { id: "2", first_name: "Sara", last_name: "Mansouri", email: "sara.mansouri@email.com" },
  { id: "3", first_name: "Karim", last_name: "Ladjali", email: "karim.ladjali@email.com" },
  { id: "4", first_name: "Fatima", last_name: "Zahra", email: "fatima.zahra@email.com" },
  { id: "5", first_name: "Youssef", last_name: "Amrani", email: "youssef.amrani@email.com" },
  { id: "6", first_name: "Nadia", last_name: "Boukhalfa", email: "nadia.boukhalfa@email.com" },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Étudiants
        </h1>
        <p className="text-muted-foreground">{filtered.length} étudiants inscrits</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un étudiant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((student, i) => (
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> {student.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-muted-foreground">Aucun étudiant trouvé</p>
        </div>
      )}
    </div>
  );
}
