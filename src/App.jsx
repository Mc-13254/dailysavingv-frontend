import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgencyManagement from './pages/AgencyManagement';
import UserManagement from './pages/UserManagement';
import CollectorManagement from './pages/CollectorManagement';
import CollectorAssignmentManagement from './pages/CollectorAssignmentManagement';
import CollectorPerformanceManagement from './pages/CollectorPerformanceManagement';
import ClientManagement from './pages/ClientManagement';
import AccountManagement from './pages/AccountManagement';
import ContractManagement from './pages/ContractManagement';
import CommissionTypeManagement from './pages/CommissionTypeManagement';
import CommissionRangeManagement from './pages/CommissionRangeManagement';
import IMFManagement from './pages/IMFManagement';
import RoleManagement from './pages/RoleManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import PermissionManagement from './pages/PermissionManagement';
import ContractTypeManagement from './pages/ContractTypeManagement';
import NumberingParameterManagement from './pages/NumberingParameterManagement';
import ValidationQueue from './pages/ValidationQueue';
import TransactionManagement from './pages/TransactionManagement';
import CashSessionManagement from './pages/CashSessionManagement';
import ReportCenter from './pages/ReportCenter';
import TransactionHistory from './pages/TransactionHistory';
import CashSessionReports from './pages/CashSessionReports';
import ClientReports from './pages/ClientReports';
import AccountReports from './pages/AccountReports';
import ContractReports from './pages/ContractReports';
import CommissionReports from './pages/CommissionReports';
import AgencyReports from './pages/AgencyReports';
import FinancialReports from './pages/FinancialReports';
import AuditReports from './pages/AuditReports';
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
        <Route path="roles" element={<RoleManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="habilitations" element={<PermissionManagement />} />

        {/* Paramètres Métier */}
        <Route path="contract-types" element={<ContractTypeManagement />} />
        <Route path="commissions" element={<CommissionTypeManagement />} />
        <Route path="commission-ranges" element={<CommissionRangeManagement />} />
        <Route path="numbering" element={<NumberingParameterManagement />} />

        {/* Gestion des Collecteurs */}
        <Route path="collectors" element={<CollectorManagement />} />
        <Route path="collector-assignment" element={<CollectorAssignmentManagement />} />
        <Route path="collector-performance" element={<CollectorPerformanceManagement />} />

        {/* Gestion des Clients */}
        {/* Prospects module removed — not used */}
        <Route path="clients" element={<ClientManagement />} />
        <Route path="accounts" element={<AccountManagement />} />
        <Route path="contracts" element={<ContractManagement />} />

        {/* Opérations */}
        <Route path="cash-session" element={<CashSessionManagement />} />
        <Route path="daily-collections" element={<TransactionManagement defaultType="DAILY_COLLECTION" title="Collectes journalières" />} />
        <Route path="deposits" element={<TransactionManagement defaultType="DEPOSIT" title="Dépôts" />} />
        <Route path="withdrawals" element={<TransactionManagement defaultType="WITHDRAWAL" title="Retraits" />} />
        <Route path="transfers" element={<TransactionManagement defaultType="TRANSFER" title="Transferts" />} />
        <Route path="validations" element={<ValidationQueue />} />

        {/* Rapports */}
        <Route path="reports/center" element={<ReportCenter />} />
        <Route path="reports/transaction-history" element={<TransactionHistory />} />
        {/* Collector Reports -> reuses /collector-performance, see Layout.jsx nav */}
        <Route path="reports/clients" element={<ClientReports />} />
        <Route path="reports/agencies" element={<AgencyReports />} />
        <Route path="reports/commissions" element={<CommissionReports />} />
        <Route path="reports/receipts" element={<ComingSoon title="Receipts" />} />
        <Route path="reports/daily-collections" element={<ComingSoon title="Daily Collection Reports" />} />
        <Route path="reports/accounts" element={<AccountReports />} />
        <Route path="reports/contracts" element={<ContractReports />} />
        <Route path="reports/cash-sessions" element={<CashSessionReports />} />
        <Route path="reports/financial" element={<FinancialReports />} />
        <Route path="reports/audit" element={<AuditReports />} />

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
