import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Shield, GraduationCap, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";

const roleMeta: Record<string, { icon: any; label: string; color: string }> = {
  ADMINISTRATEUR: { icon: Shield,        label: "Admin",      color: "bg-destructive/10 text-destructive" },
  ENSEIGNANT:     { icon: BookOpen,      label: "Enseignant", color: "bg-accent/10 text-accent"           },
  ETUDIANT:       { icon: GraduationCap, label: "Étudiant",   color: "bg-primary/10 text-primary"         },
};

export default function UsersPage() {
  const [users,      setUsers]      = useState<any[]>([]);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/admin/comptes?limit=100");
      setUsers(data.data?.utilisateurs ?? data.data?.comptes ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.typeUtilisateur === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Utilisateurs
        </h1>
        <p className="text-muted-foreground">{users.length} utilisateurs au total</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="ETUDIANT">Étudiants</TabsTrigger>
            <TabsTrigger value="ENSEIGNANT">Enseignants</TabsTrigger>
            <TabsTrigger value="ADMINISTRATEUR">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((u: any, i: number) => {
            const meta = roleMeta[u.typeUtilisateur] || roleMeta.ETUDIANT;
            const Icon = meta.icon;
            return (
              <motion.div key={u.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
              >
                <Card className="shadow-card border-0">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge className={`${meta.color} border-0 text-xs`}>
                      <Icon className="h-3 w-3 mr-1" /> {meta.label}
                    </Badge>
                    <Badge variant={u.statut === 'ACTIF' ? 'default' : 'secondary'} className="text-xs">
                      {u.statut}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
        </div>
      )}
    </div>
  );
}
