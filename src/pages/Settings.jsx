import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
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

  async function updatePassword(e) {
    e.preventDefault();
    setPasswordSaving(true);
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordSaving(false);
      setError('Passwords do not match.');
      return;
    }
    try {
      await API.post('settings/password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError('Could not update password.');
    } finally {
      setPasswordSaving(false);
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
                <button
                  className="btn btnPrimary"
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </section>

              <section className="card settingsCard">
                <h2 className="cardTitle">Change password</h2>
                <form className="settingsForm" onSubmit={updatePassword}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button className="btn btnSecondary" type="submit" disabled={passwordSaving}>
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Settings;
