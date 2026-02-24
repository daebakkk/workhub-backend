import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

function AdminApprovals() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState('this_week');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  async function fetchHistory(range = historyRange) {
    setHistoryLoading(true);
    try {
      const res = await API.get(`logs/history/?range=${range}`);
      setHistory(res.data || []);
    } catch (err) {
      
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
    fetchHistory('this_week');
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
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

  async function approveAll() {
    setApprovingAll(true);
    setError('');
    try {
      await API.post('logs/approve-all/');
      setLogs([]);
    } catch (err) {
      setError('Failed to approve all logs.');
    } finally {
      setApprovingAll(false);
    }
  }

  useEffect(() => {
    fetchHistory(historyRange);
  }, [historyRange]);

  useEffect(() => {
    if (!showHistory) return undefined;
    const interval = setInterval(() => fetchHistory(historyRange), 30000);
    return () => clearInterval(interval);
  }, [showHistory, historyRange]);

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
            <Link to="/settings" className="sidebarLink">
              Settings
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Logs to review</p>
            <p className="sidebarNoteValue">{logs.length}</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">Review and approve staff work logs</p>
          <div className="approvalsActions approvalsHistoryToggle">
            <button
              className="btn btnSecondary"
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? 'Hide approval history' : 'Show approval history'}
            </button>
            {logs.length > 0 && (
              <button
                className="btn btnPrimary"
                type="button"
                disabled={approvingAll}
                onClick={approveAll}
              >
                {approvingAll ? 'Approving...' : 'Approve all'}
              </button>
            )}
          </div>

          {showHistory && (
            <div className="card approvalsHistoryCard">
              <div className="cardHeader">
                <h2 className="cardTitle">Approval history</h2>
                <div className="historyControls">
                  <select
                    value={historyRange}
                    onChange={(e) => setHistoryRange(e.target.value)}
                  >
                    <option value="all">All time</option>
                    <option value="this_week">This week</option>
                    <option value="last_week">Last week</option>
                    <option value="last_30_days">Last 30 days</option>
                    <option value="last_6_months">Last 6 months</option>
                    <option value="last_year">Last 1 year</option>
                  </select>
                </div>
              </div>
              {historyLoading && <p className="inlineStatus">Loading history...</p>}
              {!historyLoading && history.length === 0 && (
                <p className="emptySubtitle">No approvals or rejections in this period.</p>
              )}
              {!historyLoading && history.length > 0 && (
                <div className="logList">
                  {history.map((log) => (
                    <div className="logItem" key={`history-${log.id}`}>
                      <div>
                        <p className="logTitle">{log.title}</p>
                        <p className="logMeta">
                          {log.staff?.first_name || log.staff?.username} •{' '}
                          {log.project?.name || 'Unassigned'} • {log.date} • {log.hours} hrs
                        </p>
                      </div>
                      <span className={`logStatus ${log.status || 'pending'}`}>
                        {log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
