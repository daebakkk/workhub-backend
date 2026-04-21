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
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [nameDraft, setNameDraft] = useState({ first: '', last: '' });
  const [usernameDraft, setUsernameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [specializationDraft, setSpecializationDraft] = useState('frontend');
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showSpecializationEditor, setShowSpecializationEditor] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileAction, setProfileAction] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('settings/');
        setUsername(res.data.username || '');
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setEmail(res.data.email || '');
        setNameDraft({
          first: res.data.first_name || '',
          last: res.data.last_name || '',
        });
        setUsernameDraft(res.data.username || '');
        setEmailDraft(res.data.email || '');
        setEmailNotifications(!!res.data.email_notifications);
        setDarkMode(!!res.data.dark_mode);
        setSpecialization(res.data.specialization || 'frontend');
        setSpecializationDraft(res.data.specialization || 'frontend');
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

  async function saveProfile(payload, successText, actionKey, onSuccess) {
    setSavingProfile(true);
    setProfileAction(actionKey || '');
    setError('');
    setMessage('');
    try {
      const res = await API.patch('settings/', payload);
      setUsername(res.data.username || '');
      setFirstName(res.data.first_name || '');
      setLastName(res.data.last_name || '');
      setEmail(res.data.email || '');
      setNameDraft({
        first: res.data.first_name || '',
        last: res.data.last_name || '',
      });
      setUsernameDraft(res.data.username || '');
      setEmailDraft(res.data.email || '');
      setSpecialization(res.data.specialization || 'frontend');
      setSpecializationDraft(res.data.specialization || 'frontend');
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user:updated'));
      setMessage(successText);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save profile changes.');
    } finally {
      setSavingProfile(false);
      setProfileAction('');
    }
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
      window.dispatchEvent(new Event('user:updated'));
      applyTheme(!!res.data.dark_mode);
      setMessage('Settings saved.');
    } catch (err) {
      setError('Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setError('');
    setMessage('');
    if (!currentPassword || !newPassword) {
      setError('Please fill current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await API.post('settings/password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordEditor(false);
      setMessage('Password updated.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function formatSpecializationLabel(value) {
    if (!value) return 'Not set';
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
            <Link to="/leaderboard" className="sidebarLink">
              Leaderboard
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
                <h2 className="cardTitle">Account settings</h2>
                <label className="settingsRow">
                  <span>Name</span>
                  <span className="settingsValue">
                    {`${firstName || ''} ${lastName || ''}`.trim() || 'Not set'}
                  </span>
                  <button
                    className="btn btnSecondary settingsMiniBtn"
                    type="button"
                    onClick={() => setShowNameEditor((prev) => !prev)}
                    disabled={savingProfile}
                  >
                    {savingProfile && profileAction === 'name' ? 'Saving...' : showNameEditor ? 'Close' : 'Change name'}
                  </button>
                </label>
                {showNameEditor && (
                  <form
                    className="settingsInlineBlock"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile(
                        {
                          first_name: nameDraft.first,
                          last_name: nameDraft.last,
                        },
                        'Name updated.',
                        'name',
                        () => setShowNameEditor(false)
                      );
                    }}
                  >
                    <label className="settingsRow">
                      <span>First name</span>
                      <input
                        className="settingsInput"
                        type="text"
                        value={nameDraft.first}
                        onChange={(e) =>
                          setNameDraft((prev) => ({ ...prev, first: e.target.value }))
                        }
                      />
                    </label>
                    <label className="settingsRow">
                      <span>Last name</span>
                      <input
                        className="settingsInput"
                        type="text"
                        value={nameDraft.last}
                        onChange={(e) =>
                          setNameDraft((prev) => ({ ...prev, last: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      className="btn btnPrimary"
                      type="submit"
                      disabled={savingProfile}
                    >
                      {savingProfile && profileAction === 'name' ? 'Saving...' : 'Save name'}
                    </button>
                  </form>
                )}
                <label className="settingsRow">
                  <span>Username</span>
                  <span className="settingsValue">{username || 'Not set'}</span>
                  <button
                    className="btn btnSecondary settingsMiniBtn"
                    type="button"
                    onClick={() => setShowUsernameEditor((prev) => !prev)}
                    disabled={savingProfile}
                  >
                    {savingProfile && profileAction === 'username' ? 'Saving...' : showUsernameEditor ? 'Close' : 'Change username'}
                  </button>
                </label>
                {showUsernameEditor && (
                  <form
                    className="settingsInlineBlock"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile(
                        { username: usernameDraft },
                        'Username updated.',
                        'username',
                        () => setShowUsernameEditor(false)
                      );
                    }}
                  >
                    <label className="settingsRow">
                      <span>New username</span>
                      <input
                        className="settingsInput"
                        type="text"
                        value={usernameDraft}
                        onChange={(e) => setUsernameDraft(e.target.value)}
                      />
                    </label>
                    <button
                      className="btn btnPrimary"
                      type="submit"
                      disabled={savingProfile}
                    >
                      {savingProfile && profileAction === 'username' ? 'Saving...' : 'Save username'}
                    </button>
                  </form>
                )}
                <label className="settingsRow">
                  <span>Email</span>
                  <span className="settingsValue">{email || 'Not set'}</span>
                  <button
                    className="btn btnSecondary settingsMiniBtn"
                    type="button"
                    onClick={() => setShowEmailEditor((prev) => !prev)}
                    disabled={savingProfile}
                  >
                    {savingProfile && profileAction === 'email' ? 'Saving...' : showEmailEditor ? 'Close' : 'Change email'}
                  </button>
                </label>
                {showEmailEditor && (
                  <form
                    className="settingsInlineBlock"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile(
                        { email: emailDraft },
                        'Email updated.',
                        'email',
                        () => setShowEmailEditor(false)
                      );
                    }}
                  >
                    <label className="settingsRow">
                      <span>New email</span>
                      <input
                        className="settingsInput"
                        type="email"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                      />
                    </label>
                    <button
                      className="btn btnPrimary"
                      type="submit"
                      disabled={savingProfile}
                    >
                      {savingProfile && profileAction === 'email' ? 'Saving...' : 'Save email'}
                    </button>
                  </form>
                )}
                <label className="settingsRow">
                  <span>Specialization</span>
                  <span className="settingsValue">{formatSpecializationLabel(specialization)}</span>
                  <button
                    className="btn btnSecondary settingsMiniBtn"
                    type="button"
                    onClick={() => setShowSpecializationEditor((prev) => !prev)}
                    disabled={savingProfile}
                  >
                    {savingProfile && profileAction === 'specialization'
                      ? 'Saving...'
                      : showSpecializationEditor
                        ? 'Close'
                        : 'Change specialization'}
                  </button>
                </label>
                {showSpecializationEditor && (
                  <form
                    className="settingsInlineBlock"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile(
                        { specialization: specializationDraft },
                        'Specialization updated.',
                        'specialization',
                        () => setShowSpecializationEditor(false)
                      );
                    }}
                  >
                    <label className="settingsRow">
                      <span>Specialization</span>
                      <select
                        value={specializationDraft}
                        onChange={(e) => setSpecializationDraft(e.target.value)}
                      >
                        <option value="frontend">Frontend Developer</option>
                        <option value="backend">Backend Developer</option>
                        <option value="full_stack">Full Stack Developer</option>
                        <option value="mobile_ios">Mobile iOS Developer</option>
                        <option value="mobile_android">Mobile Android Developer</option>
                        <option value="mobile_cross">Cross-platform Mobile Developer</option>
                        <option value="web_accessibility">Web Accessibility</option>
                        <option value="ui_ux">UI/UX Designer</option>
                        <option value="product_design">Product Designer</option>
                        <option value="qa_manual">Manual QA</option>
                        <option value="qa_automation">QA Automation</option>
                        <option value="test_engineer">Test Engineer</option>
                        <option value="devops">DevOps Engineer</option>
                        <option value="sre">Site Reliability Engineer</option>
                        <option value="cloud_engineer">Cloud Engineer</option>
                        <option value="platform_engineer">Platform Engineer</option>
                        <option value="systems_engineer">Systems Engineer</option>
                        <option value="network_engineer">Network Engineer</option>
                        <option value="security_engineer">Security Engineer</option>
                        <option value="appsec">Application Security</option>
                        <option value="netsec">Network Security</option>
                        <option value="data_analyst">Data Analyst</option>
                        <option value="data_engineer">Data Engineer</option>
                        <option value="data_scientist">Data Scientist</option>
                        <option value="ml_engineer">ML Engineer</option>
                        <option value="ai_engineer">AI Engineer</option>
                        <option value="mlops">MLOps Engineer</option>
                        <option value="database_admin">Database Administrator</option>
                        <option value="api_engineer">API Engineer</option>
                        <option value="software_architect">Software Architect</option>
                        <option value="embedded">Embedded Systems</option>
                        <option value="iot">IoT Engineer</option>
                        <option value="robotics">Robotics Engineer</option>
                        <option value="game_dev">Game Developer</option>
                        <option value="ar_vr">AR/VR Developer</option>
                        <option value="blockchain">Blockchain Developer</option>
                        <option value="devrel">Developer Advocate</option>
                        <option value="tech_writer">Technical Writer</option>
                        <option value="support_engineer">Support Engineer</option>
                        <option value="build_release">Build/Release Engineer</option>
                        <option value="infra_ops">Infrastructure Operations</option>
                        <option value="sys_admin">System Administrator</option>
                        <option value="it_support">IT Support</option>
                        <option value="business_analyst">Business Analyst</option>
                        <option value="product_manager">Product Manager</option>
                        <option value="gis">GIS Specialist</option>
                      </select>
                    </label>
                    <button
                      className="btn btnPrimary"
                      type="submit"
                      disabled={savingProfile}
                    >
                      {savingProfile && profileAction === 'specialization'
                        ? 'Saving...'
                        : 'Save specialization'}
                    </button>
                  </form>
                )}
                <label className="settingsRow">
                  <span>Password</span>
                  <span className="settingsValue">********</span>
                  <button
                    className="btn btnSecondary settingsMiniBtn"
                    type="button"
                    onClick={() => setShowPasswordEditor((prev) => !prev)}
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating...' : showPasswordEditor ? 'Close' : 'Change password'}
                  </button>
                </label>
                {showPasswordEditor && (
                  <form
                    className="settingsInlineBlock"
                    onSubmit={(e) => {
                      e.preventDefault();
                      savePassword();
                    }}
                  >
                    <label className="settingsRow">
                      <span>Current password</span>
                      <input
                        className="settingsInput"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={savingPassword}
                        required
                      />
                    </label>
                    <label className="settingsRow">
                      <span>New password</span>
                      <input
                        className="settingsInput"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={savingPassword}
                        minLength={6}
                        required
                      />
                    </label>
                    <label className="settingsRow">
                      <span>Confirm new password</span>
                      <input
                        className="settingsInput"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={savingPassword}
                        minLength={6}
                        required
                      />
                    </label>
                    <button
                      className="btn btnSecondary"
                      type="submit"
                      disabled={savingPassword}
                    >
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </section>
              <section className="card settingsCard">
                <h2 className="cardTitle">Preferences</h2>
                <label className="settingsRow">
                  <span>In-app notifications</span>
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
                  {saving ? 'Saving...' : 'Save Preferences'}
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
