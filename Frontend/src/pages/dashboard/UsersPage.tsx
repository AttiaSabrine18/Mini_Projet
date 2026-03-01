import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Shield, GraduationCap, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
};

const roleMeta: Record<string, { icon: any; label: string; color: string }> = {
  admin: { icon: Shield, label: "Admin", color: "bg-destructive/10 text-destructive" },
  teacher: { icon: BookOpen, label: "Enseignant", color: "bg-accent/10 text-accent" },
  student: { icon: GraduationCap, label: "Étudiant", color: "bg-primary/10 text-primary" },
};

// Mock users data
const MOCK_USERS: UserProfile[] = [
  { id: "1", first_name: "Jean", last_name: "Dupont", email: "jean.dupont@example.com", role: "student", status: "approved" },
  { id: "2", first_name: "Marie", last_name: "Martin", email: "marie.martin@example.com", role: "teacher", status: "approved" },
  { id: "3", first_name: "Pierre", last_name: "Bernard", email: "pierre.bernard@example.com", role: "admin", status: "approved" },
  { id: "4", first_name: "Sophie", last_name: "Petit", email: "sophie.petit@example.com", role: "student", status: "approved" },
  { id: "5", first_name: "Lucas", last_name: "Moreau", email: "lucas.moreau@example.com", role: "student", status: "approved" },
  { id: "6", first_name: "Claire", last_name: "Dubois", email: "claire.dubois@example.com", role: "teacher", status: "approved" },
  { id: "7", first_name: "Thomas", last_name: "Laurent", email: "thomas.laurent@example.com", role: "student", status: "approved" },
  { id: "8", first_name: "Julie", last_name: "Simon", email: "julie.simon@example.com", role: "student", status: "approved" },
  { id: "9", first_name: "Nicolas", last_name: "Michel", email: "nicolas.michel@example.com", role: "teacher", status: "approved" },
  { id: "10", first_name: "Emma", last_name: "Leroy", email: "emma.leroy@example.com", role: "student", status: "approved" },
];

export default function UsersPage() {
  const [users] = useState<UserProfile[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter((u) => {
    const matchesSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
          <Input 
            placeholder="Rechercher..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="student">Étudiants</TabsTrigger>
            <TabsTrigger value="teacher">Enseignants</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((user, i) => {
            const meta = roleMeta[user.role] || roleMeta.student;
            const Icon = meta.icon;
            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="shadow-card border-0">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={`${meta.color} border-0 text-xs`}>
                      <Icon className="h-3 w-3 mr-1" /> {meta.label}
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