import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/api';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isHome = currentPath === '/';
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  function getInitial() {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return '?';
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common.Authorization;
    navigate('/login');
  }

  return (
    <nav className={`navbar ${isHome ? 'navbarHome' : ''}`}>
      <Link
        to="/profile"
        className={`profileIcon ${isHome ? 'profileIconLeft' : 'profileIconRight'}`}
        aria-label="Profile"
        title="Profile"
      >
        {getInitial()}
      </Link>
      {currentPath !== "/dashboard" && (
        <Link to="/dashboard" className="navItem">Dashboard</Link>)}
      {currentPath !== "/reports" && (
        <Link to="/reports" className="navItem">Reports</Link>)}
      {currentPath !== "/projects" && (
        <Link to="/projects" className="navItem">Projects</Link>)}
      {user?.role === 'admin' && currentPath !== "/admin/approvals" && (
        <Link to="/admin/approvals" className="navItem">Approvals</Link>)}
      {!isHome && (
        <button className="navBtn" type="button" onClick={handleLogout}>
          Logout
        </button>
      )}
    </nav>
  );
}
