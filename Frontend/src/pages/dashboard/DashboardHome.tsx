import { Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import { getUtilisateur } from '@/lib/api';

export default function DashboardHome() {
  const utilisateur = getUtilisateur();
  
  // Sécurité : Si pas de session, retour au login
  if (!utilisateur) return <Navigate to="/auth" replace />;

  const role = utilisateur.typeUtilisateur;

  if (role === 'ENSEIGNANT') return <TeacherDashboard />;
  if (role === 'ADMINISTRATEUR') return <AdminDashboard />;
  if (role === 'ETUDIANT') return <StudentDashboard />;

  // Fallback en cas de rôle inconnu
  return <div className="p-10 text-center">Rôle inconnu : {role}</div>;
}