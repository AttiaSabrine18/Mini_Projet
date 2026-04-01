import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCours(); }, []);

  const loadCours = async () => {
    setLoading(true);
    try {
      // Essai 1 : endpoint dédié /cours
      try {
        const res = await apiCall('/cours?limit=200');
        const list = res.data?.cours ?? res.data ?? [];
        if (list.length > 0) { setCourses(list); return; }
      } catch { /* tenter l'alternative */ }

      // Essai 2 : extraire les cours depuis l'EDT (toute la semaine)
      const days = ['2025-01-06','2025-01-07','2025-01-08','2025-01-09','2025-01-10'];
      const coursMap = new Map<number, any>();

      for (const jour of days) {
        try {
          const res = await apiCall(`/edt?jour=${jour}`);
          const sessions = res.data?.sessions ?? res.data ?? [];
          for (const s of sessions) {
            if (s.cours && !coursMap.has(s.cours.id)) {
              coursMap.set(s.cours.id, {
                id:          s.cours.id,
                nom:         s.cours.nom,
                code:        s.cours.code,
                description: s.cours.description ?? null,
                credits:     s.cours.credits ?? null,
                semestre:    s.cours.semestre ?? null,
              });
            }
          }
        } catch { /* ignorer jours sans données */ }
      }

      setCourses([...coursMap.values()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c) =>
    `${c.nom ?? ''} ${c.code ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Cours
        </h1>
        <p className="text-muted-foreground">Explorez vos cours disponibles</p>
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
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-base group-hover:text-primary transition-colors">
                      {course.nom ?? course.title}
                    </CardTitle>
                    {(course.semestre ?? course.semester) && (
                      <Badge variant="secondary" className="shrink-0">
                        S{course.semestre ?? course.semester}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {course.code && (
                    <p className="text-xs text-muted-foreground mb-2 font-mono">{course.code}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description ?? 'Aucune description disponible'}
                  </p>
                  {course.credits && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {course.credits} crédits
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-muted-foreground">Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
}
