import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

const SPECIALIZATIONS = [
  ['frontend', 'Frontend Developer'],
  ['backend', 'Backend Developer'],
  ['full_stack', 'Full Stack Developer'],
  ['mobile_ios', 'Mobile iOS Developer'],
  ['mobile_android', 'Mobile Android Developer'],
  ['mobile_cross', 'Cross-platform Mobile Developer'],
  ['web_accessibility', 'Web Accessibility'],
  ['ui_ux', 'UI/UX Designer'],
  ['product_design', 'Product Designer'],
  ['qa_manual', 'Manual QA'],
  ['qa_automation', 'QA Automation'],
  ['test_engineer', 'Test Engineer'],
  ['devops', 'DevOps Engineer'],
  ['sre', 'Site Reliability Engineer'],
  ['cloud_engineer', 'Cloud Engineer'],
  ['platform_engineer', 'Platform Engineer'],
  ['systems_engineer', 'Systems Engineer'],
  ['network_engineer', 'Network Engineer'],
  ['security_engineer', 'Security Engineer'],
  ['appsec', 'Application Security'],
  ['netsec', 'Network Security'],
  ['data_analyst', 'Data Analyst'],
  ['data_engineer', 'Data Engineer'],
  ['data_scientist', 'Data Scientist'],
  ['ml_engineer', 'ML Engineer'],
  ['ai_engineer', 'AI Engineer'],
  ['mlops', 'MLOps Engineer'],
  ['database_admin', 'Database Administrator'],
  ['api_engineer', 'API Engineer'],
  ['software_architect', 'Software Architect'],
  ['embedded', 'Embedded Systems'],
  ['iot', 'IoT Engineer'],
  ['robotics', 'Robotics Engineer'],
  ['game_dev', 'Game Developer'],
  ['ar_vr', 'AR/VR Developer'],
  ['blockchain', 'Blockchain Developer'],
  ['devrel', 'Developer Advocate'],
  ['tech_writer', 'Technical Writer'],
  ['support_engineer', 'Support Engineer'],
  ['build_release', 'Build/Release Engineer'],
  ['infra_ops', 'Infrastructure Operations'],
  ['sys_admin', 'System Administrator'],
  ['it_support', 'IT Support'],
  ['business_analyst', 'Business Analyst'],
  ['product_manager', 'Product Manager'],
  ['gis', 'GIS Specialist'],
];

function specLabel(val) {
  const found = SPECIALIZATIONS.find(([k]) => k === val);
  return found ? found[1] : (val || 'Not set');
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`stToggle ${checked ? 'isOn' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="stToggleThumb" />
    </button>
  );
}

function FieldRow({ label, value, children, open, onToggle, saving }) {
  return (
    <div className={`stFieldRow ${open ? 'isOpen' : ''}`}>
      <div className="stFieldTop">
        <div className="stFieldMeta">
          <span className="stFieldLabel">{label}</span>
          <span className="stFieldValue">{value}</span>
        </div>
        <button
          type="button"
          className="stEditBtn"
          onClick={onToggle}
          disabled={saving}
        >
          {open ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {open && <div className="stFieldBody">{children}</div>}
    </div>
  );
}

export default function Settings() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('frontend');

  // drafts
  const [nameDraft, setNameDraft] = useState({ first: '', last: '' });
  const [usernameDraft, setUsernameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [specDraft, setSpecDraft] = useState('frontend');

  // open editors
  const [openEditor, setOpenEditor] = useState(null); // 'name'|'username'|'email'|'spec'|'password'
  const [savingProfile, setSavingProfile] = useState(false);

  // preferences
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('dark_mode', String(isDark));
  }

  useEffect(() => {
    API.get('settings/')
      .then((res) => {
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setUsername(res.data.username || '');
        setEmail(res.data.email || '');
        setSpecialization(res.data.specialization || 'frontend');
        setNameDraft({ first: res.data.first_name || '', last: res.data.last_name || '' });
        setUsernameDraft(res.data.username || '');
        setEmailDraft(res.data.email || '');
        setSpecDraft(res.data.specialization || 'frontend');
        setNotifications(!!res.data.email_notifications);
        setDarkMode(!!res.data.dark_mode);
        applyTheme(!!res.data.dark_mode);
      })
      .catch(() => setError('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(payload, successMsg, onSuccess) {
    setSavingProfile(true);
    setError('');
    try {
      const res = await API.patch('settings/', payload);
      setFirstName(res.data.first_name || '');
      setLastName(res.data.last_name || '');
      setUsername(res.data.username || '');
      setEmail(res.data.email || '');
      setSpecialization(res.data.specialization || 'frontend');
      setNameDraft({ first: res.data.first_name || '', last: res.data.last_name || '' });
      setUsernameDraft(res.data.username || '');
      setEmailDraft(res.data.email || '');
      setSpecDraft(res.data.specialization || 'frontend');
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user:updated'));
      showToast(successMsg);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save changes.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePrefs(key, val) {
    setSavingPrefs(true);
    setError('');
    try {
      const payload = { [key]: val };
      const res = await API.patch('settings/', payload);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user:updated'));
      if (key === 'dark_mode') applyTheme(val);
      showToast('Preferences saved.');
    } catch {
      setError('Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setError('');
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await API.post('settings/password/', { current_password: currentPw, new_password: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setOpenEditor(null);
      showToast('Password updated.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not update password.');
    } finally {
      setSavingPw(false);
    }
  }

  function toggleEditor(key) {
    setOpenEditor((prev) => (prev === key ? null : key));
    setError('');
  }

  const fullName = `${firstName} ${lastName}`.trim() || 'Not set';

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Settings</h1>
          <p className="dashWelcome">Manage your account and preferences</p>
        </div>
        <Navbar />
      </header>

      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink">Overview</Link>
            <Link to="/work-logs" className="sidebarLink">Work Logs</Link>
            <Link to="/projects" className="sidebarLink">Projects</Link>
            <Link to="/leaderboard" className="sidebarLink">Leaderboard</Link>
            <Link to="/reports" className="sidebarLink">Reports</Link>
            {isAdmin && <Link to="/admin/approvals" className="sidebarLink">Approvals</Link>}
            <Link to="/settings" className="sidebarLink isActive">Settings</Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          {loading && <p className="inlineStatus">Loading…</p>}
          {error && <p className="inlineError">{error}</p>}

          {/* toast */}
          {toast && <div className="stToast">{toast}</div>}

          {!loading && (
            <div className="stLayout">

              {/* profile section */}
              <section className="stSection">
                <p className="stSectionTitle">Profile</p>

                <FieldRow
                  label="Name"
                  value={fullName}
                  open={openEditor === 'name'}
                  onToggle={() => toggleEditor('name')}
                  saving={savingProfile}
                >
                  <form
                    className="stForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile(
                        { first_name: nameDraft.first, last_name: nameDraft.last },
                        'Name updated.',
                        () => setOpenEditor(null)
                      );
                    }}
                  >
                    <div className="stFormRow">
                      <input className="stInput" placeholder="First name" value={nameDraft.first}
                        onChange={(e) => setNameDraft((p) => ({ ...p, first: e.target.value }))} />
                      <input className="stInput" placeholder="Last name" value={nameDraft.last}
                        onChange={(e) => setNameDraft((p) => ({ ...p, last: e.target.value }))} />
                    </div>
                    <button className="btn btnPrimary stSaveBtn" type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                </FieldRow>

                <FieldRow
                  label="Username"
                  value={username || 'Not set'}
                  open={openEditor === 'username'}
                  onToggle={() => toggleEditor('username')}
                  saving={savingProfile}
                >
                  <form
                    className="stForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile({ username: usernameDraft }, 'Username updated.', () => setOpenEditor(null));
                    }}
                  >
                    <input className="stInput" placeholder="Username" value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)} />
                    <button className="btn btnPrimary stSaveBtn" type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                </FieldRow>

                <FieldRow
                  label="Email"
                  value={email || 'Not set'}
                  open={openEditor === 'email'}
                  onToggle={() => toggleEditor('email')}
                  saving={savingProfile}
                >
                  <form
                    className="stForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile({ email: emailDraft }, 'Email updated.', () => setOpenEditor(null));
                    }}
                  >
                    <input className="stInput" type="email" placeholder="Email" value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)} />
                    <button className="btn btnPrimary stSaveBtn" type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                </FieldRow>

                <FieldRow
                  label="Specialization"
                  value={specLabel(specialization)}
                  open={openEditor === 'spec'}
                  onToggle={() => toggleEditor('spec')}
                  saving={savingProfile}
                >
                  <form
                    className="stForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveProfile({ specialization: specDraft }, 'Specialization updated.', () => setOpenEditor(null));
                    }}
                  >
                    <select className="stInput stSelect" value={specDraft} onChange={(e) => setSpecDraft(e.target.value)}>
                      {SPECIALIZATIONS.map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                    <button className="btn btnPrimary stSaveBtn" type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                </FieldRow>

                <FieldRow
                  label="Password"
                  value="••••••••"
                  open={openEditor === 'password'}
                  onToggle={() => toggleEditor('password')}
                  saving={savingPw}
                >
                  <form className="stForm" onSubmit={savePassword}>
                    <input className="stInput" type="password" placeholder="Current password"
                      value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required disabled={savingPw} />
                    <input className="stInput" type="password" placeholder="New password (min 6)"
                      value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={6} required disabled={savingPw} />
                    <input className="stInput" type="password" placeholder="Confirm new password"
                      value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} minLength={6} required disabled={savingPw} />
                    <button className="btn btnPrimary stSaveBtn" type="submit" disabled={savingPw}>
                      {savingPw ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                </FieldRow>
              </section>

              {/* preferences section */}
              <section className="stSection">
                <p className="stSectionTitle">Preferences</p>

                <div className="stPrefRow">
                  <div>
                    <p className="stPrefLabel">Notifications</p>
                    <p className="stPrefSub">Receive in-app alerts for approvals and updates</p>
                  </div>
                  <Toggle
                    checked={notifications}
                    onChange={(val) => {
                      setNotifications(val);
                      savePrefs('email_notifications', val);
                    }}
                  />
                </div>

                <div className="stPrefRow">
                  <div>
                    <p className="stPrefLabel">Dark mode</p>
                    <p className="stPrefSub">Switch between light and dark theme</p>
                  </div>
                  <Toggle
                    checked={darkMode}
                    onChange={(val) => {
                      setDarkMode(val);
                      savePrefs('dark_mode', val);
                    }}
                  />
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
