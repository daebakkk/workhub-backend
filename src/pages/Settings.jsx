import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Settings() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [specialization, setSpecialization] = useState('frontend');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('settings/');
        setEmailNotifications(!!res.data.email_notifications);
        setDarkMode(!!res.data.dark_mode);
        setSpecialization(res.data.specialization || 'frontend');
        applyTheme(!!res.data.dark_mode);
      } catch (err) {
        setError('Could not load settings.');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('dark_mode', String(isDark));
  }

  async function saveSettings() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await API.patch('settings/', {
        email_notifications: emailNotifications,
        dark_mode: darkMode,
        specialization,
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      applyTheme(!!res.data.dark_mode);
      setMessage('Settings saved.');
    } catch (err) {
      setError('Could not save settings.');
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Settings</h1>
        <Navbar />
      </header>
      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink">
              Overview
            </Link>
            <Link to="/work-logs" className="sidebarLink">
              Work Logs
            </Link>
            <Link to="/projects" className="sidebarLink">
              Projects
            </Link>
            <Link to="/reports" className="sidebarLink">
              Reports
            </Link>
            {isAdmin && (
              <Link to="/admin/approvals" className="sidebarLink">
                Approvals
              </Link>
            )}
            <Link to="/settings" className="sidebarLink isActive">
              Settings
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Theme</p>
            <p className="sidebarNoteValue">{darkMode ? 'Dark' : 'Light'}</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          {loading && <p className="inlineStatus">Loading settings...</p>}
          {error && <p className="inlineError">{error}</p>}
          {message && <p className="inlineStatus">{message}</p>}

          {!loading && (
            <>
              <section className="card settingsCard">
                <h2 className="cardTitle">Preferences</h2>
                <label className="settingsRow">
                  <span>Email notifications</span>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </label>
                <label className="settingsRow">
                  <span>Dark mode</span>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                </label>
                <label className="settingsRow">
                  <span>Specialization</span>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="frontend">Frontend Developer</option>
                    <option value="backend">Backend Developer</option>
                    <option value="full_stack">Full Stack Developer</option>
                    <option value="data_science">Data Science</option>
                    <option value="analyst">Analyst</option>
                  </select>
                </label>
                <button
                  className="btn btnPrimary"
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </section>

            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Settings;
