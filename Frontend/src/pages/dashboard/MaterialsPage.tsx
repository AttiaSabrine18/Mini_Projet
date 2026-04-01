// MaterialsPage.tsx
// Si ton backend n'a pas encore /cours/supports, la page affiche un état vide propre.
// Quand tu crées l'endpoint, elle se connecte automatiquement.

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadMaterials(); }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Essai endpoint /cours/supports ou /supports
      let list: any[] = [];
      try {
        const res = await apiCall('/cours/supports?limit=100');
        list = res.data?.supports ?? res.data ?? [];
      } catch {
        try {
          const res = await apiCall('/supports?limit=100');
          list = res.data?.supports ?? res.data ?? [];
        } catch { /* endpoint pas encore créé */ }
      }
      setMaterials(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter((m) =>
    (m.titre ?? m.title ?? '').toLowerCase().includes(search.toLowerCase())
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
          <FolderOpen className="h-6 w-6 text-primary" /> Supports de cours
        </h1>
        <p className="text-muted-foreground">Accédez à tous vos documents</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un support..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((mat, i) => (
            <motion.div
              key={mat.id}
              layout
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
                    <p className="font-medium text-sm truncate">{mat.titre ?? mat.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(mat.cours?.nom ?? mat.course?.title) && (
                        <Badge variant="secondary" className="text-xs">
                          {mat.cours?.nom ?? mat.course?.title}
                        </Badge>
                      )}
                      {(mat.createdAt ?? mat.created_at) && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(mat.createdAt ?? mat.created_at), 'd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  {(mat.fichierUrl ?? mat.file_url) && (
                    <a
                      href={mat.fichierUrl ?? mat.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-muted-foreground">
            {materials.length === 0
              ? 'Aucun support disponible pour le moment'
              : 'Aucun support trouvé'}
          </p>
        </div>
      )}
    </div>
  );
}
