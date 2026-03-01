import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FolderOpen, Search, FileText, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Material = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  created_at: string;
  course: { title: string } | null;
};

// Mock materials data
const MOCK_MATERIALS: Material[] = [
  {
    id: "1",
    title: "Cours 1: Introduction à Python",
    description: "Slides et exercices",
    file_url: "#",
    created_at: "2024-03-15T10:00:00Z",
    course: { title: "Introduction à la programmation" }
  },
  {
    id: "2",
    title: "Exercices - Algèbre linéaire",
    description: "Série d'exercices corrigés",
    file_url: "#",
    created_at: "2024-03-14T14:30:00Z",
    course: { title: "Mathématiques pour l'informatique" }
  },
  {
    id: "3",
    title: "TD SQL",
    description: "Requêtes SQL avancées",
    file_url: "#",
    created_at: "2024-03-13T09:15:00Z",
    course: { title: "Bases de données" }
  },
  {
    id: "4",
    title: "Projet React",
    description: "Consignes et ressources",
    file_url: "#",
    created_at: "2024-03-12T16:45:00Z",
    course: { title: "Développement web" }
  },
  {
    id: "5",
    title: "Algorithmes de tri",
    description: "Implémentations en Python",
    file_url: "#",
    created_at: "2024-03-11T11:20:00Z",
    course: { title: "Algorithmes et structures de données" }
  },
];

export default function MaterialsPage() {
  const [materials] = useState<Material[]>(MOCK_MATERIALS);
  const [search, setSearch] = useState("");

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
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
                    <p className="font-medium text-sm truncate">{mat.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {mat.course?.title || "Cours"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(mat.created_at), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  {mat.file_url && (
                    <a 
                      href={mat.file_url} 
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
          <p className="text-muted-foreground">Aucun support trouvé</p>
        </div>
      )}
    </div>
  );
}