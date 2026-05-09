import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Route guard component that checks for authentication and role-based access.
 * 
 * - If no token exists → redirect to Landing Page
 * - If token exists but role doesn't match → redirect to appropriate dashboard
 * - Otherwise → render children
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Not authenticated → redirect to home/login
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role-based access control
  if (allowedRoles && role) {
    const normalizedRole = role.replace('ROLE_', '');
    if (!allowedRoles.includes(normalizedRole)) {
      // Redirect to appropriate dashboard based on actual role
      const redirectMap: Record<string, string> = {
        'ADMIN': '/admin',
        'CLINIC_MANAGER': '/clinic',
        'DOCTOR': '/doctor',
        'PATIENT': '/patient',
      };
      const redirectTo = redirectMap[normalizedRole] || '/';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
