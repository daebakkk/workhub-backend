import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WorkLogForm from '../components/WorkLogForm';
import API from '../api/api';

function WorkLogs() {
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');

  async function fetchLogs() {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const res = await API.get('logs/my/');
      setLogs(res.data || []);
    } catch (err) {
      setLogsError('Could not load logs. Please try again.');
    } finally {
      setLoadingLogs(false);
    }
  }

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
            <Link to="/projects" className="sidebarLink">
              Projects
            </Link>
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
                onClick={() => {
                  setShowLogs(true);
                  fetchLogs();
                }}
                type="button"
              >
                View my logs
              </button>
            )}
            {showAddLogForm && (
              <WorkLogForm
                onSubmitted={() => {
                  setShowLogs(true);
                  fetchLogs();
                }}
              />
            )}
            {showLogs && (
              <>
                {loadingLogs && <p className="inlineStatus">Loading logs…</p>}
                {logsError && <p className="inlineError">{logsError}</p>}
                {!loadingLogs && !logsError && logs.length === 0 && (
                  <div className="emptyState">
                    <p className="emptyTitle">No work logs yet</p>
                    <p className="emptySubtitle">
                      When you start adding logs, they will appear here.
                    </p>
                  </div>
                )}
                {!loadingLogs && logs.length > 0 && (
                  <div className="logList">
                    {logs.map((log) => (
                      <div className="logItem" key={log.id}>
                        <div>
                          <p className="logTitle">{log.title}</p>
                          <p className="logMeta">
                            {log.project?.name ? log.project.name : 'No project'} •{' '}
                            {log.date} • {log.hours} hrs
                          </p>
                        </div>
                        <span className={`logStatus ${log.status}`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default WorkLogs;
