import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = (localStorage.getItem('token') || '').trim();
  const now = Math.floor(Date.now() / 1000);

  function getTokenExpiry(jwt) {
    try {
      const payload = jwt.split('.')[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      return typeof data.exp === 'number' ? data.exp : null;
    } catch {
      return null;
    }
  }

  const exp = token ? getTokenExpiry(token) : null;
  const isMissing = !token || token === 'null' || token === 'undefined';
  const isExpired = exp !== null && exp <= now;

  if (isMissing || isExpired) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
