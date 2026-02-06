import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WorkLogForm from '../components/WorkLogForm';

function WorkLogs() {
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Work Logs</h1>
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
            <Link to="/work-logs" className="sidebarLink isActive">
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
            Add new work logs and review recent activity
          </p>

          <section className="card">
            <h2 className="cardTitle">Work Logs</h2>
            {!showAddLogForm && (
              <button
                className="btn btnPrimary dashAddLogBtn"
                onClick={() => setShowAddLogForm(true)}
                type="button"
              >
                Add Log
              </button>
            )}
            {!showLogs && (
              <button
                className="btn dashViewLogsBtn"
                onClick={() => setShowLogs(true)}
                type="button"
              >
                View my logs
              </button>
            )}
            {showAddLogForm && <WorkLogForm />}
            {showLogs && (
              <div className="emptyState">
                <p className="emptyTitle">No work logs yet</p>
                <p className="emptySubtitle">
                  When you start adding logs, they will appear here.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default WorkLogs;
