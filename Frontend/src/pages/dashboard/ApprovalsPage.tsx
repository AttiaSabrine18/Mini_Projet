import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const pending = [
  { id: "1", initials: "AB", name: "Ahmed Benali",  email: "ahmed@email.com",  role: "student" },
  { id: "2", initials: "SM", name: "Sara Mansouri", email: "sara@email.com",   role: "teacher" },
  { id: "3", initials: "KL", name: "Karim Ladjali", email: "karim@email.com",  role: "student" },
];

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Demandes d'inscription
        </h1>
        <p className="text-muted-foreground">{pending.length} demande(s) en attente</p>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pending.map((user, i) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -100 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card border-0">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Approuver
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Refuser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}