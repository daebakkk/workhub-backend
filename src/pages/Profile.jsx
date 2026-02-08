import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function Profile() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Profile</h1>
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
            <Link to="/profile" className="sidebarLink isActive">
              Profile
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Role</p>
            <p className="sidebarNoteValue">{user?.role || 'staff'}</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <div className="card profileCard">
            <h2 className="cardTitle">Account</h2>
            <div className="profileGrid">
              <div>
                <p className="profileLabel">Name</p>
                <p className="profileValue">
                  {user?.first_name || ''} {user?.last_name || ''}
                </p>
              </div>
              <div>
                <p className="profileLabel">Username</p>
                <p className="profileValue">{user?.username || '—'}</p>
              </div>
              <div>
                <p className="profileLabel">Email</p>
                <p className="profileValue">{user?.email || '—'}</p>
              </div>
              <div>
                <p className="profileLabel">Role</p>
                <p className="profileValue">{user?.role || 'staff'}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
