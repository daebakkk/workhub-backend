import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

function Profile() {
  const storedUser = localStorage.getItem('user');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  const roleLabels = {
    admin: 'Admin',
    staff: 'Staff',
  };

  const formatLabel = (value, labels) => {
    if (!value) return '—';
    if (labels[value]) return labels[value];
    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    async function refreshUser() {
      try {
        const res = await API.get('settings/');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        // keep last known user
      } finally {
        setLoading(false);
      }
    }

    refreshUser();
    function handleUserUpdated() {
      refreshUser();
    }
    window.addEventListener('user:updated', handleUserUpdated);
    return () => window.removeEventListener('user:updated', handleUserUpdated);
  }, []);

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not set';

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Profile</h1>
          <p className="dashWelcome">Your account information</p>
        </div>
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
            <Link to="/profile" className="sidebarLink isActive">
              Profile
            </Link>
            <Link to="/settings" className="sidebarLink">
              Settings
            </Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          {loading && <p className="inlineStatus">Loading…</p>}

          {!loading && user && (
            <div className="profileLayout">
              {/* Hero card */}
              <div className="profileHero">
                <div className="profileHeroContent">
                  <div className="profileAvatar">{(user?.first_name?.[0] || 'U').toUpperCase()}</div>
                  <div>
                    <h2 className="profileName">{fullName}</h2>
                    <p className="profileRole">{formatLabel(user?.role, roleLabels)}</p>
                    <p className="profileSpec">{specLabel(user?.specialization)}</p>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="profileGrid">
                <div className="profileInfoCard">
                  <p className="profileInfoLabel">Username</p>
                  <p className="profileInfoValue">{user?.username || '—'}</p>
                </div>
                <div className="profileInfoCard">
                  <p className="profileInfoLabel">Email</p>
                  <p className="profileInfoValue">{user?.email || '—'}</p>
                </div>
                <div className="profileInfoCard">
                  <p className="profileInfoLabel">Team</p>
                  <p className="profileInfoValue">{user?.team?.display_name || '—'}</p>
                </div>
                <div className="profileInfoCard">
                  <p className="profileInfoLabel">Weekly goal</p>
                  <p className="profileInfoValue">{user?.weekly_goal_hours || 0}h</p>
                </div>
                <div className="profileInfoCard">
                  <p className="profileInfoLabel">Notifications</p>
                  <p className="profileInfoValue">{user?.email_notifications ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              {/* Edit link */}
              <div className="profileFooter">
                <Link to="/settings" className="btn btnPrimary">
                  Edit profile
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;
