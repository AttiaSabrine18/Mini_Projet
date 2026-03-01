import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Lock, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Mock user profile
const MOCK_PROFILE = {
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean.dupont@example.com",
};

export default function SettingsPage() {
  const [firstName, setFirstName] = useState(MOCK_PROFILE.first_name);
  const [lastName, setLastName] = useState(MOCK_PROFILE.last_name);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Profil mis à jour ✅");
      setSaving(false);
    }, 500);
  };

  const handleChangePassword = () => {
    if (!newPw) {
      toast.error("Veuillez entrer un nouveau mot de passe");
      return;
    }
    
    setChangingPw(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Mot de passe changé ✅");
      setNewPw("");
      setChangingPw(false);
    }, 500);
  };

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
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={MOCK_PROFILE.email} disabled className="bg-muted" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-1">
              <Save className="h-4 w-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
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
              <Label>Nouveau mot de passe</Label>
              <Input 
                type="password" 
                value={newPw} 
                onChange={(e) => setNewPw(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPw || !newPw} 
              variant="outline" 
              className="gap-1"
            >
              <Lock className="h-4 w-4" /> {changingPw ? "Changement..." : "Changer"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}