import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common';

import AppLayout from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminRoute from './components/common/AdminRoute';
import TransactionsPage from './pages/transactions/TransactionsPage';
import AccountsPage from './pages/accounts/AccountsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminPanelPage from './pages/admin/AdminPanelPage';
import AllocationsPage from './pages/allocations/AllocationsPage';
import PlansPage from './pages/plans/PlansPage';
//Super Admin Routes
import SuperAdminRoute from './components/routing/SuperAdminRoute';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SuperAdminPlansPage from './pages/super-admin/PlansPage';
import HouseholdsPage from './pages/super-admin/HouseholdsPage';
import UsersPage from './pages/super-admin/UsersPage';

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." fullPage={false} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Conditional Dashboard based on role
function ConditionalDashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  
  return <DashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Regular user pages */}
        {/* Conditional Dashboard - Super Admin vs Regular User */}
        <Route 
          index 
          element={
            <ConditionalDashboard />
          } 
        />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="allocations" element={<AllocationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        <Route 
          path="admin"
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />

        {/* Admin-only pages */}
        <Route 
          path="admin/plans" 
          element={
            <AdminRoute>
              <div className="card">Plan Management (Admin Only)</div>
            </AdminRoute>
          } 
        />

        {/* Super Admin Route */}
        <Route
          path="super-admin"
          element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          }
        />
        {/* Super Admin Plans */}
        <Route
          path="super-admin/plans"
          element={
            <SuperAdminRoute>
              <SuperAdminPlansPage />
            </SuperAdminRoute>
          }
        />
        {/* Super Admin Households */}
        <Route
          path="super-admin/households"
          element={
            <SuperAdminRoute>
              <HouseholdsPage />
            </SuperAdminRoute>
          }
        />
        {/* Super Admin Plans */}
        <Route
          path="super-admin/users"
          element={
            <SuperAdminRoute>
              <UsersPage />
            </SuperAdminRoute>
          }
        />
      </Route>
     
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;