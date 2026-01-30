import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav className="navbar">
      {currentPath !== "/dashboard" && (
        <Link to="/dashboard" className="navItem">Dashboard</Link>)}
      {currentPath !== "/reports" && (
        <Link to="/reports" className="navItem">Reports</Link>)}
      <button className="navBtn">Logout</button>
    </nav>
  );
}
