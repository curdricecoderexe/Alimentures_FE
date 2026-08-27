import { Navigate, useLocation } from 'react-router-dom';

/**
 * Client-side route guard. This is a UX gate only — a user can edit
 * localStorage to render a privileged shell, but every privileged API call is
 * enforced server-side (verifyToken + isAdmin/isStaff) and `authenticatedFetch`
 * logs the session out on the resulting 401. Do not treat this as a security
 * boundary.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'customer';
  const location = useLocation();

  if (!token) {
    // Redirect to login if no token is found
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.some(r => r.toLowerCase() === role.toLowerCase())) {
    // Redirect to home if role is not allowed
    return <Navigate to="/" replace />;
  }

  return children;
}
