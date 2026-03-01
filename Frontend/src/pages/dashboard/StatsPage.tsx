import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(152, 32%, 36%)", "hsl(28, 80%, 56%)", "hsl(200, 50%, 50%)", "hsl(340, 60%, 55%)"];

// Mock stats data
const MOCK_STATS = {
  students: 42,
  teachers: 8,
  courses: 15,
  filieres: 5,
  pending: 3,
};

export default function StatsPage() {
  const [stats] = useState(MOCK_STATS);

  const roleData = [
    { name: "Étudiants", value: stats.students },
    { name: "Enseignants", value: stats.teachers },
  ];

  const barData = [
    { name: "Étudiants", count: stats.students },
    { name: "Enseignants", count: stats.teachers },
    { name: "Cours", count: stats.courses },
    { name: "Filières", count: stats.filieres },
  ];

  const statCards = [
    { label: "Étudiants", value: stats.students, icon: GraduationCap, color: "bg-primary/10 text-primary" },
    { label: "Enseignants", value: stats.teachers, icon: BookOpen, color: "bg-accent/10 text-accent" },
    { label: "Cours", value: stats.courses, icon: BookOpen, color: "bg-chart-4/10 text-chart-4" },
    { label: "En attente", value: stats.pending, icon: TrendingUp, color: "bg-chart-5/10 text-chart-5" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Statistiques
        </h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-card border-0">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Répartition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Utilisateurs par rôle</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={roleData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  dataKey="value" 
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}