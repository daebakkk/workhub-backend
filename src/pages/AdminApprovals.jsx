import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

function AdminApprovals() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function fetchPending() {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('logs/pending/');
      setLogs(res.data || []);
    } catch (err) {
      setError('Could not load pending logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
  }, []);

  async function approveLog(id) {
    setBusyId(id);
    try {
      await API.post(`logs/${id}/approve/`);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err) {
      setError('Failed to approve log.');
    } finally {
      setBusyId(null);
    }
  }

  async function rejectLog(id) {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    setBusyId(id);
    try {
      await API.post(`logs/${id}/reject/`, { reason });
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err) {
      setError('Failed to reject log.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Approvals</h1>
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
            <Link to="/admin/approvals" className="sidebarLink isActive">
              Approvals
            </Link>
            <Link to="/admin/projects" className="sidebarLink">
              Assign Projects
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Pending logs</p>
            <p className="sidebarNoteValue">{logs.length}</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">Review and approve staff work logs</p>

          {loading && <p className="inlineStatus">Loading pending logs…</p>}
          {error && <p className="inlineError">{error}</p>}

          {!loading && !error && logs.length === 0 && (
            <div className="emptyState">
              <p className="emptyTitle">No pending logs</p>
              <p className="emptySubtitle">
                New submissions will appear here for approval.
              </p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="logList">
              {logs.map((log) => (
                <div className="logItem" key={log.id}>
                  <div>
                    <p className="logTitle">{log.title}</p>
                    <p className="logMeta">
                      {log.staff?.first_name || log.staff?.username} •{' '}
                      {log.project?.name || 'No project'} • {log.date} •{' '}
                      {log.hours} hrs
                    </p>
                  </div>
                  <div className="logActions">
                    <button
                      className="btn btnSecondary"
                      type="button"
                      disabled={busyId === log.id}
                      onClick={() => rejectLog(log.id)}
                    >
                      Reject
                    </button>
                    <button
                      className="btn btnPrimary"
                      type="button"
                      disabled={busyId === log.id}
                      onClick={() => approveLog(log.id)}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminApprovals;
