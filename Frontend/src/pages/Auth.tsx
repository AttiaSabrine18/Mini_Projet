import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

type Role = "student" | "teacher" | "admin";

const roleConfig = {
  student: { icon: GraduationCap, label: "Étudiant",       color: "bg-primary" },
  teacher: { icon: BookOpen,       label: "Enseignant",     color: "bg-accent"  },
  admin:   { icon: Shield,         label: "Administrateur", color: "bg-chart-4" },
};

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      const msgs = data.errors.map((e: any) => e.msg).join(" · ");
      throw new Error(msgs);
    }
    throw new Error(data.message || "Erreur serveur");
  }
  return data;
}

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading]               = useState(false);
  const [showPass, setShowPass]             = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [selectedRole, setSelectedRole]     = useState<Role>("student");

  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupData, setSignupData] = useState({
    email:           "",
    motDePasse:      "",
    prenom:          "",
    nom:             "",
    numeroEtudiant:  "",
    numeroINE:       "",
    anneeAcademique: "2024-2025",
    niveau:          "L1",
    semestreActuel:  "S1",
    filiereId:       1,
  });

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8)     return "Mot de passe : 8 caractères minimum.";
    if (!/[A-Z]/.test(pwd)) return "Mot de passe : au moins une majuscule.";
    if (!/[0-9]/.test(pwd)) return "Mot de passe : au moins un chiffre.";
    return null;
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, motDePasse: loginPassword }),
      });

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("utilisateur", JSON.stringify(data.data.utilisateur));

      toast.success(`Bienvenue ${data.data.utilisateur.prenom} !`);

      const role = data.data.utilisateur.typeUtilisateur;
      if (role === "ADMINISTRATEUR")  navigate("/dashboard/admin");
      else if (role === "ENSEIGNANT") navigate("/dashboard/teacher");
      else                            navigate("/dashboard");

    } catch (err: any) {
      toast.error(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwdError = validatePassword(signupData.motDePasse);
    if (pwdError)                  { toast.error(pwdError);              return; }
    if (!signupData.nom.trim())    { toast.error("Nom requis.");          return; }
    if (!signupData.prenom.trim()) { toast.error("Prénom requis.");       return; }

    setLoading(true);
    try {
      if (selectedRole === "student") {
        if (!signupData.numeroEtudiant) { toast.error("Numéro étudiant requis."); setLoading(false); return; }
        if (!signupData.numeroINE)      { toast.error("Numéro INE requis.");       setLoading(false); return; }

        await apiCall("/auth/inscription/etudiant", {
          method: "POST",
          body: JSON.stringify({
            email:           signupData.email,
            motDePasse:      signupData.motDePasse,
            nom:             signupData.nom,
            prenom:          signupData.prenom,
            numeroEtudiant:  signupData.numeroEtudiant,
            numeroINE:       signupData.numeroINE,
            anneeAcademique: signupData.anneeAcademique,
            niveau:          signupData.niveau,
            semestreActuel:  signupData.semestreActuel,
            filiereId:       signupData.filiereId,
          }),
        });

      } else if (selectedRole === "teacher") {
        await apiCall("/auth/inscription/enseignant", {
          method: "POST",
          body: JSON.stringify({
            email:      signupData.email,
            motDePasse: signupData.motDePasse,
            nom:        signupData.nom,
            prenom:     signupData.prenom,
            matricule:  `ENS-${Date.now()}`,
            grade:      "Enseignant",
            specialite: "Non défini",
          }),
        });

      } else {
        toast.error("Les comptes administrateur sont créés par l'administration.");
        return;
      }

      toast.success("Inscription réussie ! Vérifiez votre email.");
      setLoginEmail(signupData.email);
      setLoginPassword(signupData.motDePasse);

    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">UniPortal</h1>
          <p className="text-muted-foreground mt-2">Plateforme Universitaire</p>
        </div>

        <Card className="shadow-elevated border-0">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* ── CONNEXION ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email" type="email" required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPass ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* ── INSCRIPTION ── */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {/* Sélection rôle */}
                  <div>
                    <Label className="mb-3 block">Rôle</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(roleConfig) as [Role, typeof roleConfig.student][]).map(([role, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={role} type="button"
                            onClick={() => setSelectedRole(role)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                              selectedRole === role
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRole === "admin" && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Les comptes administrateur sont créés par l'administration.
                      </p>
                    )}
                  </div>

                  {selectedRole !== "admin" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Prénom *</Label>
                          <Input required value={signupData.prenom}
                            onChange={(e) => setSignupData({ ...signupData, prenom: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom *</Label>
                          <Input required value={signupData.nom}
                            onChange={(e) => setSignupData({ ...signupData, nom: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" required value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          placeholder="votre@email.com" />
                      </div>

                      <div className="space-y-2">
                        <Label>Mot de passe *</Label>
                        <div className="relative">
                          <Input
                            type={showSignupPass ? "text" : "password"}
                            required minLength={8}
                            value={signupData.motDePasse}
                            onChange={(e) => setSignupData({ ...signupData, motDePasse: e.target.value })}
                            placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPass(!showSignupPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {signupData.motDePasse && validatePassword(signupData.motDePasse) && (
                          <p className="text-xs text-destructive">
                            {validatePassword(signupData.motDePasse)}
                          </p>
                        )}
                      </div>

                      {selectedRole === "student" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>N° Étudiant *</Label>
                              <Input required value={signupData.numeroEtudiant}
                                onChange={(e) => setSignupData({ ...signupData, numeroEtudiant: e.target.value })}
                                placeholder="ETU-2024-XXX" />
                            </div>
                            <div className="space-y-2">
                              <Label>N° INE *</Label>
                              <Input required value={signupData.numeroINE}
                                onChange={(e) => setSignupData({ ...signupData, numeroINE: e.target.value })}
                                placeholder="11 caractères" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Niveau</Label>
                              <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={signupData.niveau}
                                onChange={(e) => setSignupData({ ...signupData, niveau: e.target.value })}
                              >
                                {["L1","L2","L3","M1","M2"].map(n => <option key={n}>{n}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Semestre</Label>
                              <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={signupData.semestreActuel}
                                onChange={(e) => setSignupData({ ...signupData, semestreActuel: e.target.value })}
                              >
                                {["S1","S2","S3","S4","S5","S6"].map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Création..." : "Créer un compte"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}