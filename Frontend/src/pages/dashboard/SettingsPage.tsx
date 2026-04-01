import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Lock, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

export default function SettingsPage() {
  const [prenom,      setPrenom]      = useState('');
  const [nom,         setNom]         = useState('');
  const [email,       setEmail]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [ancienPw,    setAncienPw]    = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [changingPw,  setChangingPw]  = useState(false);

  useEffect(() => { loadProfil(); }, []);

  const loadProfil = async () => {
    setLoadingProfile(true);
    try {
      // GET /auth/me
      const res = await apiCall('/auth/me');
      const u = res.data;
      setPrenom(u.prenom ?? '');
      setNom(u.nom ?? '');
      setEmail(u.email ?? '');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // PUT /auth/profil  (ou PATCH selon ton backend — adapte si besoin)
      await apiCall('/auth/profil', {
        method: 'PUT',
        body: JSON.stringify({ prenom, nom }),
      });
      // Mettre à jour le localStorage aussi
      const stored = JSON.parse(localStorage.getItem('utilisateur') || '{}');
      localStorage.setItem('utilisateur', JSON.stringify({ ...stored, prenom, nom }));
      toast.success('Profil mis à jour ✅');
    } catch (err: any) {
      // Si l'endpoint n'existe pas encore, on informe sans casser
      toast.error(err.message || 'Endpoint non disponible');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw) { toast.error('Veuillez entrer un nouveau mot de passe'); return; }
    setChangingPw(true);
    try {
      // POST /auth/reinitialiser-mot-de-passe ou changer-mot-de-passe
      await apiCall('/auth/changer-mot-de-passe', {
        method: 'POST',
        body: JSON.stringify({ ancienMotDePasse: ancienPw, nouveauMotDePasse: newPw }),
      });
      toast.success('Mot de passe changé ✅');
      setAncienPw('');
      setNewPw('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement');
    } finally {
      setChangingPw(false);
    }
  };

  if (loadingProfile) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Paramètres
        </h1>
        <p className="text-muted-foreground">Gérez votre profil et sécurité</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-1">
              <Save className="h-4 w-4" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" /> Changer le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <Input
                type="password"
                value={ancienPw}
                onChange={(e) => setAncienPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min. 6 caractères"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPw || !newPw}
              variant="outline"
              className="gap-1"
            >
              <Lock className="h-4 w-4" /> {changingPw ? 'Changement...' : 'Changer'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
