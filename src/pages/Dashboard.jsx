import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Dashboard</h1>
        <Navbar />
      </header>
      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink isActive">
              Overview
            </Link>
            <Link to="/work-logs" className="sidebarLink">
              Work Logs
            </Link>
            <button type="button" className="sidebarLink" disabled>
              Projects
            </button>
            <Link to="/reports" className="sidebarLink">
              Reports
            </Link>
            <button type="button" className="sidebarLink" disabled>
              Settings
            </button>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Next review</p>
            <p className="sidebarNoteValue">Fri, 10:00 AM</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">
            Log your work and track your progress
          </p>

          <section className="statGrid">
            <div className="statCard">
              <p className="statLabel">Hours logged</p>
              <p className="statValue">12.5</p>
              <p className="statMeta">This week</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Active projects</p>
              <p className="statValue">3</p>
              <p className="statMeta">In progress</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Approval rate</p>
              <p className="statValue">96%</p>
              <p className="statMeta">Last 30 days</p>
            </div>
          </section>

          <section className="card projectCard">
            <div className="cardHeader">
              <h2 className="cardTitle">Recent Projects</h2>
              <button type="button" className="btn btnSecondary">
                View all
              </button>
            </div>
            <div className="projectList">
              <div className="projectItem">
                <div>
                  <p className="projectTitle">Client Intake Portal</p>
                  <p className="projectMeta">Updated onboarding flow</p>
                </div>
                <span className="projectStatus">On track</span>
              </div>
              <div className="projectItem">
                <div>
                  <p className="projectTitle">Ops Analytics</p>
                  <p className="projectMeta">Q2 KPI dashboard</p>
                </div>
                <span className="projectStatus warn">Needs review</span>
              </div>
              <div className="projectItem">
                <div>
                  <p className="projectTitle">Mobile Timesheets</p>
                  <p className="projectMeta">Release candidate build</p>
                </div>
                <span className="projectStatus success">Ready</span>
              </div>
            </div>
          </section>
        </main>
      </div>

    </div>
  );
}

export default Dashboard;
