import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Search, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ActualitesPage() {
  const [actualites,  setActualites]  = useState<any[]>([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [expanded,    setExpanded]    = useState<number | null>(null);

  useEffect(() => { loadActualites(); }, []);

  const loadActualites = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/actualites');
      setActualites(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (actu: any) => {
    setDownloading(actu.id);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/actualites/telecharger/${actu.id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) throw new Error('Erreur téléchargement');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${actu.titre}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Document téléchargé !');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const filtered = actualites.filter((a) =>
    (a.titre ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" /> Actualités
        </h1>
        <p className="text-muted-foreground">Restez informé des dernières nouvelles</p>
      </motion.div>

      {/* ── Recherche ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher une actualité..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((actu, i) => (
              <motion.div key={actu.id} layout
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ delay: i * 0.05 }}>
                <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow cursor-pointer"
                  onClick={() => setExpanded(expanded === actu.id ? null : actu.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Newspaper className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{actu.titre}</p>
                          {actu.fichierPDF && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <FileText className="h-3 w-3" /> PDF
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {actu.admin?.utilisateur?.prenom} {actu.admin?.utilisateur?.nom}
                          </span>
                          {actu.datePublication && (
                            <span className="text-xs text-muted-foreground">
                              · {format(new Date(actu.datePublication), 'd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>

                        {/* Contenu expandable */}
                        <AnimatePresence>
                          {expanded === actu.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden">
                              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                {actu.contenu}
                              </p>
                              {actu.fichierPDF && (
                                <Button size="sm" className="gap-2 mt-3"
                                  onClick={(e) => { e.stopPropagation(); handleDownload(actu); }}
                                  disabled={downloading === actu.id}>
                                  {downloading === actu.id
                                    ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                    : <Download className="h-4 w-4" />
                                  }
                                  {downloading === actu.id ? 'En cours...' : 'Télécharger le PDF'}
                                </Button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Aperçu contenu si non expanded */}
                        {expanded !== actu.id && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {actu.contenu}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📰</div>
              <p className="text-muted-foreground">
                {actualites.length === 0 ? 'Aucune actualité pour le moment' : 'Aucun résultat'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}