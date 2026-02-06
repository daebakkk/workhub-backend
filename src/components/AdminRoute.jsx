import { Navigate, useLocation } from 'react-router-dom';

function isTokenExpired(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json);
    if (typeof data.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    return data.exp <= now;
  } catch {
    return true;
  }
}

function AdminRoute({ children }) {
  const location = useLocation();
  const token = (localStorage.getItem('token') || '').trim();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || token === 'null' || token === 'undefined' || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
