import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <nav className="navbar">
      {currentPath !== "/dashboard" && (
        <Link to="/dashboard" className="navItem">Dashboard</Link>)}
      {currentPath !== "/reports" && (
        <Link to="/reports" className="navItem">Reports</Link>)}
      <button className="navBtn" type="button" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}
