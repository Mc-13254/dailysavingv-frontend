import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgencyManagement from './pages/AgencyManagement';
import UserManagement from './pages/UserManagement';
import CollectorManagement from './pages/CollectorManagement';
import ClientManagement from './pages/ClientManagement';
import AccountManagement from './pages/AccountManagement';
import ContractManagement from './pages/ContractManagement';
import CommissionManagement from './pages/CommissionManagement';
import IMFManagement from './pages/IMFManagement';
import ValidationQueue from './pages/ValidationQueue';
import TransactionManagement from './pages/TransactionManagement';
import ComingSoon from './pages/ComingSoon';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Administration */}
        <Route path="imf" element={<IMFManagement />} />
        <Route path="agencies" element={<AgencyManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<ComingSoon title="Rôles" description="Gestion fine des rôles (au-delà d'ADMIN/SUPERVISOR/COLLECTOR) — à venir." />} />
        <Route path="habilitations" element={<ComingSoon title="Habilitations / Permissions" description="Attribution de permissions granulaires par module et par rôle — à venir." />} />

        {/* Paramètres Métier */}
        <Route path="contract-types" element={<ComingSoon title="Types de contrat" description="Catalogue des types de contrats proposés (Épargne Journalière, Premium...) — à venir." />} />
        <Route path="commissions" element={<CommissionManagement />} />
        <Route path="commission-ranges" element={<CommissionManagement />} />
        <Route path="numbering" element={<ComingSoon title="Paramètres de numérotation" description="Préfixes/suffixes déjà configurables depuis IMF → Administration." />} />

        {/* Gestion des Collecteurs */}
        <Route path="collectors" element={<CollectorManagement />} />
        <Route path="collector-assignment" element={<ComingSoon title="Affectation des collecteurs" description="Réaffectation en masse de clients entre collecteurs — à venir." />} />
        <Route path="collector-performance" element={<ComingSoon title="Performance des collecteurs" description="Statistiques de collecte et de commission par collecteur — à venir." />} />

        {/* Gestion des Clients */}
        <Route path="prospects" element={<ComingSoon title="Prospects" description="Suivi des prospects avant conversion en client — à venir." />} />
        <Route path="clients" element={<ClientManagement />} />
        <Route path="accounts" element={<AccountManagement />} />
        <Route path="contracts" element={<ContractManagement />} />

        {/* Opérations */}
        <Route path="daily-collections" element={<TransactionManagement defaultType="DAILY_COLLECTION" title="Collectes journalières" />} />
        <Route path="deposits" element={<TransactionManagement defaultType="DEPOSIT" title="Dépôts" />} />
        <Route path="withdrawals" element={<TransactionManagement defaultType="WITHDRAWAL" title="Retraits" />} />
        <Route path="validations" element={<ValidationQueue />} />

        {/* Rapports */}
        <Route path="reports/collectors" element={<ComingSoon title="Rapport des collecteurs" />} />
        <Route path="reports/clients" element={<ComingSoon title="Rapport des clients" />} />
        <Route path="reports/agencies" element={<ComingSoon title="Rapport des agences" />} />
        <Route path="reports/commissions" element={<ComingSoon title="Rapport des commissions" />} />

        {/* Sécurité */}
        <Route path="security/logins" element={<ComingSoon title="Journal des connexions" description="Basé sur la table Activite déjà alimentée par chaque login — page à construire." />} />
        <Route path="security/history" element={<ComingSoon title="Historique" description="Basé sur HistTransactions / HistCalculComis déjà enregistrés — page à construire." />} />
        <Route path="security/audit" element={<ComingSoon title="Audit" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
