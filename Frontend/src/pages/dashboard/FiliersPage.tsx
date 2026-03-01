import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Filiere = {
  id: string;
  name: string;
  description: string | null;
};

// Initial mock data
const INITIAL_FILIERES: Filiere[] = [
  { id: "1", name: "Informatique", description: "Filière informatique générale" },
  { id: "2", name: "Mathématiques", description: "Filière mathématiques appliquées" },
  { id: "3", name: "Physique", description: "Filière physique fondamentale" },
  { id: "4", name: "Chimie", description: "Filière chimie industrielle" },
];

export default function FilieresPage() {
  const [filieres, setFilieres] = useState<Filiere[]>(INITIAL_FILIERES);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (editId) {
      // Update existing filiere
      setFilieres(prev =>
        prev.map(f => f.id === editId ? { ...f, name, description: desc || null } : f)
      );
      toast.success("Filière mise à jour");
    } else {
      // Create new filiere
      const newFiliere: Filiere = {
        id: Date.now().toString(),
        name,
        description: desc || null,
      };
      setFilieres(prev => [...prev, newFiliere]);
      toast.success("Filière créée");
    }

    // Reset form
    setName("");
    setDesc("");
    setEditId(null);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setFilieres(prev => prev.filter(f => f.id !== id));
    toast.success("Filière supprimée");
  };

  const startEdit = (f: Filiere) => {
    setEditId(f.id);
    setName(f.name);
    setDesc(f.description || "");
    setOpen(true);
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
            <Building2 className="h-6 w-6 text-primary" /> Filières
          </h1>
          <p className="text-muted-foreground">{filieres.length} filière(s)</p>
        </div>
        
        <Dialog 
          open={open} 
          onOpenChange={(v) => { 
            setOpen(v); 
            if (!v) { 
              setEditId(null); 
              setName(""); 
              setDesc(""); 
            } 
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier" : "Nouvelle"} filière</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Informatique" 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  placeholder="Description optionnelle" 
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleSave}>
                {editId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filieres.map((f, i) => (
            <motion.div 
              key={f.id} 
              layout 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-chart-3" />
                      </div>
                      <div>
                        <p className="font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {f.description || "Pas de description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={() => startEdit(f)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filieres.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-12"
        >
          <div className="text-4xl mb-3">🏛️</div>
          <p className="text-muted-foreground">Aucune filière — créez-en une !</p>
        </motion.div>
      )}
    </div>
  );
}