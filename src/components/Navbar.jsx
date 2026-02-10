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
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
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

  function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
  }

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        document.body.classList.remove('sidebar-open');
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedMenu = menuRef.current && menuRef.current.contains(event.target);
      const clickedNotif = notifRef.current && notifRef.current.contains(event.target);
      if (!clickedMenu && !clickedNotif) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }
    if (menuOpen || notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, notifOpen]);

  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      try {
        const res = await API.get('notifications/');
        if (!isMounted) return;
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter((item) => !item.is_read).length);
      } catch (err) {
        // ignore
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  async function markAllRead() {
    try {
      await API.post('notifications/mark-all-read/');
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  }

  return (
    <nav className={`navbar ${isHome ? 'navbarHome' : ''}`}>
      {!isHome && (
        <button
          type="button"
          className="navHamburger"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      <div className="navActions">
        <div className="notifMenu" ref={notifRef}>
          <button
            type="button"
            className="notifButton"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((prev) => {
                const next = !prev;
                if (!prev && next) {
                  markAllRead();
                }
                return next;
              });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                fill="currentColor"
              />
            </svg>
            {unreadCount > 0 && <span className="notifDot" />}
          </button>
          {notifOpen && (
            <div className="notifDropdown">
              <div className="notifHeader">
                <p>Notifications</p>
              </div>
              {notifications.length === 0 && (
                <p className="notifEmpty">No notifications yet.</p>
              )}
              {notifications.map((item) => (
                <div
                  className={`notifItem ${item.is_read ? '' : 'isUnread'}`}
                  key={item.id}
                >
                  <p className="notifTitle">{item.title}</p>
                  <p className="notifMessage">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className="profileMenu profileMenuRight"
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
      </div>
    </nav>
  );
}
