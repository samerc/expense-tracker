import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * SuperAdminRoute Component
 * 
 * Protected route that only allows super_admin users
 * Redirects to dashboard if user is not a super admin
 */
export default function SuperAdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
