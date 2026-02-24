import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WorkLogForm from '../components/WorkLogForm';
import API from '../api/api';

function WorkLogs() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsRange, setLogsRange] = useState('this_week');
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

  async function deleteLog(id) {
    try {
      await API.delete(`logs/${id}/delete/`);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err) {
      setLogsError('Could not delete log. Please try again.');
    }
  }

  useEffect(() => {
    if (!showLogs) return undefined;
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [showLogs]);

  function formatStatus(status) {
    const value = status || 'pending';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function getRangeBounds(range) {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    if (range === 'all') return { start: null, end: null };
    if (range === 'last_week') {
      const weekday = today.getDay();
      const mondayOffset = weekday === 0 ? 6 : weekday - 1;
      end.setDate(today.getDate() - mondayOffset - 1);
      end.setHours(23, 59, 59, 999);
      start.setTime(end.getTime());
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (range === 'last_30_days') {
      start.setDate(today.getDate() - 30);
      return { start, end };
    }
    if (range === 'last_6_months') {
      start.setDate(today.getDate() - 182);
      return { start, end };
    }
    if (range === 'last_year') {
      start.setDate(today.getDate() - 365);
      return { start, end };
    }
    const weekday = today.getDay();
    const mondayOffset = weekday === 0 ? 6 : weekday - 1;
    start.setDate(today.getDate() - mondayOffset);
    return { start, end };
  }

  const filteredLogs = useMemo(() => {
    const { start, end } = getRangeBounds(logsRange);
    if (!start || !end) return logs;
    return logs.filter((log) => {
      if (!log?.date) return false;
      const logDate = new Date(`${log.date}T12:00:00`);
      return logDate >= start && logDate <= end;
    });
  }, [logs, logsRange]);

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
            {isAdmin && (
              <Link to="/admin/approvals" className="sidebarLink">
                Approvals
              </Link>
            )}
            <Link to="/settings" className="sidebarLink">
              Settings
            </Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">
            Add new work logs and review recent activity
          </p>

          <section className="card workLogCard">
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
                <div className="logFilters">
                  <select
                    value={logsRange}
                    onChange={(e) => setLogsRange(e.target.value)}
                  >
                    <option value="this_week">This week</option>
                    <option value="last_week">Last week</option>
                    <option value="last_30_days">Last 30 days</option>
                    <option value="last_6_months">Last 6 months</option>
                    <option value="last_year">Last year</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                {loadingLogs && <p className="inlineStatus">Loading logs…</p>}
                {logsError && <p className="inlineError">{logsError}</p>}
                {!loadingLogs && !logsError && filteredLogs.length === 0 && (
                  <div className="emptyState">
                    <p className="emptyTitle">No work logs yet</p>
                    <p className="emptySubtitle">
                      When you start adding logs, they will appear here.
                    </p>
                  </div>
                )}
                {!loadingLogs && filteredLogs.length > 0 && (
                  <div className="logList">
                    {filteredLogs.map((log) => (
                      <div className="logItem" key={log.id}>
                        <div>
                          <p className="logTitle">{log.title}</p>
                          <p className="logMeta">
                            {log.project?.name ? log.project.name : 'No project'} •{' '}
                            {log.date} • {log.hours} hrs
                          </p>
                          {log.status === 'rejected' && log.rejection_reason && (
                            <p className="logMeta logReason">
                              Rejection: {log.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="logActions">
                          {user?.role !== 'admin' && (
                            <span className={`logStatus ${log.status || 'pending'}`}>
                              {formatStatus(log.status)}
                            </span>
                          )}
                          <button
                            className="btn btnSecondary"
                            type="button"
                            onClick={() => deleteLog(log.id)}
                          >
                            Delete
                          </button>
                        </div>
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
