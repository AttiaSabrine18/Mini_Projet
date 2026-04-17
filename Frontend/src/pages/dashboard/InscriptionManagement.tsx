import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ClipboardList, CheckCircle, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

export default function InscriptionManagement() {
  const [enAttente,   setEnAttente]   = useState<any[]>([]);
  const [inscrits,    setInscrits]    = useState<any[]>([]);
  const [filieres,    setFilieres]    = useState<any[]>([]);
  const [promotions,  setPromotions]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  // Formulaire affectation
  const [selected,    setSelected]    = useState<any>(null);
  const [affForm,     setAffForm]     = useState({
    filiereId:    '',
    promotionId:  '',
    groupe:       '',
    sousGroupe:   '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [attenteRes, inscritsRes, refRes] = await Promise.all([
        apiCall('/inscriptions/admin/fiches-en-attente'),
        apiCall('/inscriptions/admin/inscrits'),
        apiCall('/inscriptions/admin/filieres-promotions'),
      ]);
      setEnAttente(attenteRes.data?.etudiants  ?? []);
      setInscrits(inscritsRes.data?.inscriptions ?? []);
      setFilieres(refRes.data?.filieres   ?? []);
      setPromotions(refRes.data?.promotions ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Groupes disponibles selon la promotion sélectionnée
  const groupesDisponibles = () => {
    if (!affForm.promotionId) return [];
    const promo = promotions.find((p: any) => String(p.id) === String(affForm.promotionId));
    if (!promo?.groupes) return [];
    try {
      return JSON.parse(promo.groupes);
    } catch {
      return [];
    }
  };

  const handleAffecter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!affForm.filiereId || !affForm.promotionId || !affForm.groupe) {
      toast.error('Filière, promotion et groupe sont requis.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiCall('/inscriptions/admin/affecter', {
        method: 'POST',
        body: JSON.stringify({
          etudiantId:  selected.id,
          filiereId:   parseInt(affForm.filiereId),
          promotionId: parseInt(affForm.promotionId),
          groupe:      affForm.groupe,
          sousGroupe:  affForm.sousGroupe || null,
        }),
      });
      toast.success(res.message || 'Étudiant affecté ✅');
      setSelected(null);
      setAffForm({ filiereId: '', promotionId: '', groupe: '', sousGroupe: '' });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
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
          <ClipboardList className="h-6 w-6 text-primary" /> Gestion des inscriptions
        </h1>
        <p className="text-muted-foreground">
          {enAttente.length} en attente · {inscrits.length} inscrits
        </p>
      </motion.div>

      <Tabs defaultValue="attente">
        <TabsList>
          <TabsTrigger value="attente" className="gap-2">
            En attente
            {enAttente.length > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5">{enAttente.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inscrits">Inscrits ({inscrits.length})</TabsTrigger>
        </TabsList>

        {/* ── TAB : EN ATTENTE ── */}
        <TabsContent value="attente" className="space-y-4 mt-4">
          {enAttente.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              ✅ Aucune fiche en attente d'affectation
            </CardContent></Card>
          ) : (
            <AnimatePresence>
              {enAttente.map((etu: any, i: number) => (
                <motion.div key={etu.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`shadow-card border-0 transition-all ${selected?.id === etu.id ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                            {etu.utilisateur?.prenom?.[0]}{etu.utilisateur?.nom?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{etu.utilisateur?.prenom} {etu.utilisateur?.nom}</p>
                            <p className="text-sm text-muted-foreground">{etu.utilisateur?.email}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {etu.niveau && <Badge variant="secondary" className="text-xs">{etu.niveau}</Badge>}
                              {etu.semestreActuel && <Badge variant="secondary" className="text-xs">{etu.semestreActuel}</Badge>}
                              {etu.filiere && <Badge variant="outline" className="text-xs">{etu.filiere.nom}</Badge>}
                              {etu.utilisateur?.telephone && (
                                <span className="text-xs text-muted-foreground">📞 {etu.utilisateur.telephone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => {
                          setSelected(etu);
                          setAffForm({
                            filiereId:   etu.filiereId ? String(etu.filiereId) : '',
                            promotionId: '',
                            groupe:      etu.groupe || '',
                            sousGroupe:  etu.sousGroupe || '',
                          });
                        }}>
                          <UserCheck size={14} className="mr-1" /> Affecter
                        </Button>
                      </div>

                      {/* Formulaire d'affectation inline */}
                      {selected?.id === etu.id && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          onSubmit={handleAffecter}
                          className="mt-4 pt-4 border-t space-y-3"
                        >
                          <p className="text-sm font-medium text-primary">
                            Affecter {etu.utilisateur?.prenom} à :
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Filière */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Filière *</label>
                              <select
                                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                value={affForm.filiereId}
                                onChange={(e) => setAffForm({ ...affForm, filiereId: e.target.value })}
                                required
                              >
                                <option value="">-- Filière --</option>
                                {filieres.map((f: any) => (
                                  <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                                ))}
                              </select>
                            </div>

                            {/* Promotion */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Promotion *</label>
                              <select
                                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                value={affForm.promotionId}
                                onChange={(e) => setAffForm({ ...affForm, promotionId: e.target.value, groupe: '' })}
                                required
                              >
                                <option value="">-- Promotion --</option>
                                {promotions.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code} · {p.niveau} · {p.anneeUniversitaire}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Groupe */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Groupe *</label>
                              {groupesDisponibles().length > 0 ? (
                                <select
                                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                  value={affForm.groupe}
                                  onChange={(e) => setAffForm({ ...affForm, groupe: e.target.value })}
                                  required
                                >
                                  <option value="">-- Groupe --</option>
                                  {groupesDisponibles().map((g: string) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                  placeholder="G1, G2..."
                                  value={affForm.groupe}
                                  onChange={(e) => setAffForm({ ...affForm, groupe: e.target.value })}
                                  required
                                />
                              )}
                            </div>

                            {/* Sous-groupe */}
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Sous-groupe</label>
                              <input
                                className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                placeholder="SG1 (optionnel)"
                                value={affForm.sousGroupe}
                                onChange={(e) => setAffForm({ ...affForm, sousGroupe: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={saving} className="gap-1">
                              <CheckCircle size={14} />
                              {saving ? 'Affectation...' : 'Confirmer l\'affectation'}
                            </Button>
                            <Button type="button" size="sm" variant="outline"
                              onClick={() => setSelected(null)}>
                              Annuler
                            </Button>
                          </div>
                        </motion.form>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* ── TAB : INSCRITS ── */}
        <TabsContent value="inscrits" className="space-y-3 mt-4">
          {inscrits.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              Aucun étudiant inscrit pour le moment.
            </CardContent></Card>
          ) : (
            inscrits.map((insc: any, i: number) => (
              <motion.div key={insc.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="shadow-card border-0">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm shrink-0">
                      {insc.etudiant?.utilisateur?.prenom?.[0]}{insc.etudiant?.utilisateur?.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {insc.etudiant?.utilisateur?.prenom} {insc.etudiant?.utilisateur?.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">{insc.etudiant?.utilisateur?.email}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {insc.etudiant?.filiere && (
                        <Badge variant="outline" className="text-xs">{insc.etudiant.filiere.nom}</Badge>
                      )}
                      {insc.promotion && (
                        <Badge variant="secondary" className="text-xs">{insc.promotion.code}</Badge>
                      )}
                      {insc.etudiant?.groupe && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-0">
                          Groupe {insc.etudiant.groupe}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="default" className="text-xs bg-green-500">✅ Inscrit</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
