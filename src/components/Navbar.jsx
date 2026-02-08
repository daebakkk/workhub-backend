import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import API from '../api/api';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isHome = currentPath === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
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
    localStorage.removeItem('refresh');
    delete API.defaults.headers.common.Authorization;
    navigate('/login');
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <nav className={`navbar ${isHome ? 'navbarHome' : ''}`}>
      {currentPath !== "/dashboard" && (
        <Link to="/dashboard" className="navItem">Dashboard</Link>)}
      {currentPath !== "/" && (
        <Link to="/" className="navItem">Home</Link>)}
      {currentPath !== "/reports" && (
        <Link to="/reports" className="navItem">Reports</Link>)}
      {currentPath !== "/projects" && (
        <Link to="/projects" className="navItem">Projects</Link>)}
      {user?.role === 'admin' && currentPath !== "/admin/approvals" && (
        <Link to="/admin/approvals" className="navItem">Approvals</Link>)}
      <div
        className={`profileMenu ${isHome ? 'profileMenuLeft' : 'profileMenuRight'}`}
        ref={menuRef}
      >
        <button
          type="button"
          className="profileIcon"
          aria-label="Profile"
          title="Profile"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {getInitial()}
        </button>
        {!isHome && menuOpen && (
          <div className="profileDropdown">
            <Link to="/profile" className="profileDropdownItem" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            <button
              className="profileDropdownItem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
