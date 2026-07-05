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
        <Route path="agencies" element={<AgencyManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="collectors" element={<CollectorManagement />} />
        <Route path="clients" element={<ClientManagement />} />
        <Route path="accounts" element={<AccountManagement />} />
        <Route path="contracts" element={<ContractManagement />} />
        <Route path="commissions" element={<CommissionManagement />} />
        <Route path="imf" element={<IMFManagement />} />
        <Route path="validations" element={<ValidationQueue />} />
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
