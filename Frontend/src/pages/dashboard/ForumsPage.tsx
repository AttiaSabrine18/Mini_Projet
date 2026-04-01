import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, MessageCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ForumsPage() {
  const [forums,  setForums]  = useState<any[]>([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadForums(); }, []);

  const loadForums = async () => {
    setLoading(true);
    try {
      // Essai /forums ou /cours/forums
      let list: any[] = [];
      try {
        const res = await apiCall('/forums?limit=100');
        list = res.data?.forums ?? res.data ?? [];
      } catch {
        try {
          const res = await apiCall('/cours/forums?limit=100');
          list = res.data?.forums ?? res.data ?? [];
        } catch { /* endpoint pas encore créé */ }
      }
      setForums(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = forums.filter((f) =>
    (f.titre ?? f.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (type: string) => {
    switch (type) {
      case 'compte_rendu': return 'Compte rendu';
      case 'discussion':   return 'Discussion';
      default:             return type ?? 'Forum';
    }
  };

  const typeColor = (type: string) =>
    type === 'compte_rendu' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Forums
        </h1>
        <p className="text-muted-foreground">Participez aux discussions</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un forum..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((forum, i) => (
            <motion.div
              key={forum.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card border-0 hover:shadow-elevated transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-chart-4/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-chart-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {forum.titre ?? forum.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(forum.cours?.nom ?? forum.course?.title) && (
                        <Badge variant="secondary" className="text-xs">
                          {forum.cours?.nom ?? forum.course?.title}
                        </Badge>
                      )}
                      {(forum.type ?? forum.forum_type) && (
                        <Badge className={`text-xs border-0 ${typeColor(forum.type ?? forum.forum_type)}`}>
                          {typeLabel(forum.type ?? forum.forum_type)}
                        </Badge>
                      )}
                      {(forum.createdAt ?? forum.created_at) && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(forum.createdAt ?? forum.created_at), 'd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                    {(forum.description) && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {forum.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-muted-foreground">
            {forums.length === 0
              ? 'Aucun forum disponible pour le moment'
              : 'Aucun forum trouvé'}
          </p>
        </div>
      )}
    </div>
  );
}
