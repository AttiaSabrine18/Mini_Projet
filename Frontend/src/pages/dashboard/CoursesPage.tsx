import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Star, FileText, Download, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CoursesPage() {
  const [courses,        setCourses]        = useState<any[]>([]);
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);

  // ── Vue détail cours ───────────────────────────────────────────────────────
  const [selectedCours,  setSelectedCours]  = useState<any | null>(null);
  const [documents,      setDocuments]      = useState<any[]>([]);
  const [loadingDocs,    setLoadingDocs]    = useState(false);
  const [filterType,     setFilterType]     = useState('');
  const [downloading,    setDownloading]    = useState<number | null>(null);

  useEffect(() => { loadCours(); }, []);

  // ── Charger la liste des cours ─────────────────────────────────────────────
 const loadCours = async () => {
  setLoading(true);
  try {
    const res = await apiCall('/documents/cours-filiere');
    setCourses(res.data ?? []);
  } catch (err: any) {
    toast.error(err.message || 'Impossible de charger les cours.');
  } finally {
    setLoading(false);
  }
};

  // ── Clic sur un cours → charger ses documents ──────────────────────────────
  const handleSelectCours = async (cours: any) => {
    setSelectedCours(cours);
    setFilterType('');
    setDocuments([]);
    setLoadingDocs(true);
    try {
      const res = await apiCall(`/documents/cours/${cours.id}`);
      setDocuments(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des documents.');
    } finally {
      setLoadingDocs(false);
    }
  };

  // ── Télécharger un document ────────────────────────────────────────────────
  const handleDownload = async (doc: any) => {
    setDownloading(doc.id);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/documents/telecharger/${doc.id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur téléchargement');
      }
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${doc.titre}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${doc.titre}" téléchargé !`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const filtered = courses.filter((c) =>
    `${c.nom ?? ''} ${c.code ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDocs = documents.filter((d) =>
    filterType ? d.type === filterType : true
  );

  const typeBadgeColor: Record<string, string> = {
    COURS:  'bg-blue-100 text-blue-800',
    TD:     'bg-green-100 text-green-800',
    TP:     'bg-orange-100 text-orange-800',
    EXAMEN: 'bg-red-100 text-red-800',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  // ── Vue détail : documents d'un cours ──────────────────────────────────────
  if (selectedCours) return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header détail */}
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCours(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">{selectedCours.nom}</h1>
            <p className="text-muted-foreground text-sm">
              {selectedCours.code} · Documents disponibles
            </p>
          </div>
        </div>

        {/* Filtre type */}
        <div className="flex gap-2 flex-wrap mt-4">
          {['', 'COURS', 'TD', 'TP', 'EXAMEN'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterType === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t === '' ? 'Tous' : t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Liste documents */}
      {loadingDocs ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc, i) => (
              <motion.div
                key={doc.id} layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor[doc.type] ?? ''}`}>
                          {doc.type}
                        </span>
                        {doc.dateDepot && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.dateDepot), 'd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {doc.nbTelechargements} téléchargement(s)
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm" className="gap-2 shrink-0"
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                    >
                      {downloading === doc.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {downloading === doc.id ? 'En cours...' : 'Télécharger'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-muted-foreground">
                {documents.length === 0
                  ? 'Aucun document disponible pour ce cours'
                  : 'Aucun document pour ce type'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Vue liste : tous les cours ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Cours
        </h1>
        <p className="text-muted-foreground">Cliquez sur un cours pour voir ses documents</p>
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
              key={course.id} layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                onClick={() => handleSelectCours(course)}
                className="shadow-card border-0 hover:shadow-elevated transition-shadow cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-base group-hover:text-primary transition-colors">
                      {course.nom ?? course.title}
                    </CardTitle>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors mt-0.5" />
                  </div>
                  {(course.semestre ?? course.semester) && (
                    <Badge variant="secondary" className="w-fit">
                      S{course.semestre ?? course.semester}
                    </Badge>
                  )}
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

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-muted-foreground">Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
}