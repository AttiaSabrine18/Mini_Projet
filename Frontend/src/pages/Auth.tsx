import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Shield } from "lucide-react";
import { motion } from "framer-motion";

type Role = "student" | "teacher" | "admin";

const roleConfig = {
  student: { icon: GraduationCap, label: "Étudiant", color: "bg-primary" },
  teacher: { icon: BookOpen, label: "Enseignant", color: "bg-accent" },
  admin: { icon: Shield, label: "Administrateur", color: "bg-chart-4" },
};

// Mock users for demo authentication
const MOCK_USERS = [
  { email: "student@example.com", password: "password", role: "student", firstName: "Jean", lastName: "Dupont" },
  { email: "teacher@example.com", password: "password", role: "teacher", firstName: "Marie", lastName: "Martin" },
  { email: "admin@example.com", password: "password", role: "admin", firstName: "Pierre", lastName: "Bernard" },
];

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupData, setSignupData] = useState({
    email: "", password: "", firstName: "", lastName: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === loginEmail && u.password === loginPassword);
      
      if (user) {
        // Store user info in localStorage for demo
        localStorage.setItem("user", JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }));
        
        toast.success("Connexion réussie!");
        navigate("/dashboard");
      } else {
        toast.error("Email ou mot de passe incorrect");
      }
      
      setLoading(false);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Check if email already exists
      const existingUser = MOCK_USERS.find(u => u.email === signupData.email);
      
      if (existingUser) {
        toast.error("Cet email est déjà utilisé");
      } else {
        // In a real app, this would create a user
        toast.success("Compte créé! (Démo - Pas de vérification d'email)");
        
        // Auto fill login for demo
        setLoginEmail(signupData.email);
        setLoginPassword(signupData.password);
      }
      
      setLoading(false);
    }, 1000);
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
          <p className="text-xs text-muted-foreground mt-1">Démo: student@example.com / password</p>
        </div>

        <Card className="shadow-elevated border-0">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      required 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      placeholder="votre@email.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      required 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      placeholder="••••••••" 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Rôle</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(roleConfig) as [Role, typeof roleConfig.student][]).map(([role, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={role}
                            type="button"
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input 
                        required 
                        value={signupData.firstName}
                        onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input 
                        required 
                        value={signupData.lastName}
                        onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      required 
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} 
                      placeholder="votre@email.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe</Label>
                    <Input 
                      type="password" 
                      required 
                      minLength={6} 
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} 
                      placeholder="Min. 6 caractères" 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Création..." : "Créer un compte"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}