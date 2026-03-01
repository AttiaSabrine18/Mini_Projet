import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock data for static display
const MOCK_COURSES = [
  {
    id: "1",
    title: "Introduction à la programmation",
    description: "Apprenez les bases de la programmation avec Python",
    credits: 3,
    semester: 1,
  },
  {
    id: "2",
    title: "Mathématiques pour l'informatique",
    description: "Algèbre linéaire, calcul et logique mathématique",
    credits: 4,
    semester: 1,
  },
  {
    id: "3",
    title: "Bases de données",
    description: "Conception et implémentation de bases de données relationnelles",
    credits: 3,
    semester: 2,
  },
  {
    id: "4",
    title: "Développement web",
    description: "Création d'applications web modernes avec React et Node.js",
    credits: 4,
    semester: 2,
  },
  {
    id: "5",
    title: "Algorithmes et structures de données",
    description: "Étude des algorithmes fondamentaux et des structures de données",
    credits: 3,
    semester: 3,
  },
  {
    id: "6",
    title: "Intelligence artificielle",
    description: "Introduction aux concepts et techniques de l'IA",
    credits: 3,
    semester: 3,
  },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_COURSES.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Cours
        </h1>
        <p className="text-muted-foreground">Explorez nos cours disponibles</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un cours..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-display text-base group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      S{course.semester || 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description || "Aucune description disponible"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {course.credits || 3} crédits
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-muted-foreground">Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
}