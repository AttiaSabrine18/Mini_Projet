import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDemandes(); }, []);

  const loadDemandes = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/admin/demandes");
      setPending(data.data?.demandes ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approuver = async (id: number) => {
    try {
      await apiCall(`/admin/demandes/${id}/valider`, { method: "PUT" });
      toast.success("Compte validé ✅");
      loadDemandes();
    } catch (err: any) { toast.error(err.message); }
  };

  const refuser = async (id: number) => {
    try {
      await apiCall(`/admin/demandes/${id}/refuser`, {
        method: "PUT",
        body: JSON.stringify({ raison: "Demande refusée par l'administrateur" }),
      });
      toast.success("Demande refusée");
      loadDemandes();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Demandes d'inscription
        </h1>
        <p className="text-muted-foreground">{pending.length} demande(s) en attente</p>
      </motion.div>

      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          ✅ Aucune demande en attente
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {pending.map((u: any, i: number) => (
              <motion.div key={u.id} layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card border-0">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{u.prenom} {u.nom}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge variant="secondary">{u.typeUtilisateur}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approuver(u.id)} className="gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Approuver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => refuser(u.id)} className="gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
