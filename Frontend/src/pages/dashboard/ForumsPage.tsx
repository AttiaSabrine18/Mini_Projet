import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, MessageCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Forum = {
  id: string;
  title: string;
  description: string | null;
  forum_type: string;
  created_at: string;
  course: { title: string } | null;
};

// Mock forums data
const MOCK_FORUMS: Forum[] = [
  {
    id: "1",
    title: "Questions sur le projet Python",
    description: "Posez vos questions sur le projet à rendre",
    forum_type: "discussion",
    created_at: "2024-03-15T10:00:00Z",
    course: { title: "Introduction à la programmation" }
  },
  {
    id: "2",
    title: "Compte rendu TD3 - Algèbre",
    description: "Discussion sur les exercices du TD3",
    forum_type: "compte_rendu",
    created_at: "2024-03-14T14:30:00Z",
    course: { title: "Mathématiques pour l'informatique" }
  },
  {
    id: "3",
    title: "Annonces importantes",
    description: "Informations sur le déroulement du cours",
    forum_type: "discussion",
    created_at: "2024-03-13T09:15:00Z",
    course: { title: "Bases de données" }
  },
  {
    id: "4",
    title: "Partage de ressources React",
    description: "Liens utiles et ressources complémentaires",
    forum_type: "discussion",
    created_at: "2024-03-12T16:45:00Z",
    course: { title: "Développement web" }
  },
  {
    id: "5",
    title: "Compte rendu - Révision examen",
    description: "Synthèse des points importants pour l'examen",
    forum_type: "compte_rendu",
    created_at: "2024-03-11T11:20:00Z",
    course: { title: "Algorithmes et structures de données" }
  },
];

export default function ForumsPage() {
  const [forums] = useState<Forum[]>(MOCK_FORUMS);
  const [search, setSearch] = useState("");

  const filtered = forums.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (type: string) => {
    switch (type) {
      case "compte_rendu": return "Compte rendu";
      case "discussion": return "Discussion";
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "compte_rendu": return "bg-accent/10 text-accent";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Forums
          </h1>
          <p className="text-muted-foreground">Participez aux discussions</p>
        </div>
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
                      {forum.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {forum.course?.title || "Cours"}
                      </Badge>
                      <Badge className={`text-xs ${typeColor(forum.forum_type)} border-0`}>
                        {typeLabel(forum.forum_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(forum.created_at), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    {forum.description && (
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
          <p className="text-muted-foreground">Aucun forum trouvé</p>
        </div>
      )}
    </div>
  );
}