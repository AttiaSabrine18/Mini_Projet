import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, Calendar, MessageSquare, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-university.jpg";

const features = [
  { icon: GraduationCap, title: "Espace Étudiant", desc: "Consultez vos cours, emploi du temps et soumettez vos travaux." },
  { icon: BookOpen, title: "Gestion des Cours", desc: "Les enseignants déposent supports, créent des forums et suivent la présence." },
  { icon: Calendar, title: "Emploi du Temps", desc: "Planification hebdomadaire pour étudiants et enseignants." },
  { icon: MessageSquare, title: "Forums & Échanges", desc: "Espaces de discussion, comptes rendus et questions/réponses." },
  { icon: Shield, title: "Administration", desc: "Validation des comptes, gestion des filières et statistiques." },
  { icon: Users, title: "Collaboration", desc: "Travaillez ensemble dans un environnement numérique moderne." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-display text-xl font-bold text-foreground">UniPortal</Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Campus universitaire" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-32 lg:py-44">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm">
              Plateforme Universitaire
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
              Votre espace <br />académique <span className="text-accent">numérique</span>
            </h1>
            <p className="mt-6 text-primary-foreground/80 text-lg max-w-md">
              Gérez vos cours, collaborez avec vos enseignants et accédez à vos ressources pédagogiques en un seul endroit.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Commencer <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                En savoir plus
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl font-bold">Tout ce dont vous avez besoin</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Une plateforme complète pour connecter étudiants, enseignants et administration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-hero p-12 lg:p-16 text-center text-primary-foreground"
          >
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Prêt à rejoindre la plateforme?
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
              Créez votre compte en quelques secondes et accédez à votre espace académique.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                Créer mon compte <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 UniPortal — Plateforme Universitaire
        </div>
      </footer>
    </div>
  );
}
