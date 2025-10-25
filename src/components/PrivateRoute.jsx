// E:\Projects\Python\hr-kuber\src\components\PrivateRoute.jsx

import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Debug logs (optional, remove in production)
  console.log('PrivateRoute check → token:', token);
  console.log('PrivateRoute check → role:', role);
  console.log('Allowed roles:', allowedRoles);

  // 🔐 Toggle this block ON for production token enforcement
  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }

  // ✅ Role validation (case-insensitive)
  const normalizedRole = role?.toLowerCase();
  const isAllowed = allowedRoles.map(r => r.toLowerCase()).includes(normalizedRole);

  if (!normalizedRole || !isAllowed) {
    const fallback = normalizedRole ? `/${normalizedRole}/dashboard` : '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}