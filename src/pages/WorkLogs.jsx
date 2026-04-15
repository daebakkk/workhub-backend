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
  const [timerTitle, setTimerTitle] = useState('');
  const [timerDate, setTimerDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsedMs, setTimerElapsedMs] = useState(0);
  const [timerError, setTimerError] = useState('');
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerProjects, setTimerProjects] = useState([]);
  const [timerProjectsLoading, setTimerProjectsLoading] = useState(true);

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

  useEffect(() => {
    async function fetchTimerProjects() {
      try {
        const res = await API.get('projects/my/');
        setTimerProjects(res.data || []);
      } catch (err) {
        setTimerError('Could not load projects for timer.');
      } finally {
        setTimerProjectsLoading(false);
      }
    }

    fetchTimerProjects();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('workhub_timer');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.startTime) return;
      setTimerTitle(parsed.title || '');
      setTimerDate(parsed.date || new Date().toISOString().slice(0, 10));
      setTimerProjectId(parsed.projectId || '');
      setTimerStart(parsed.startTime);
      setTimerRunning(true);
      setTimerElapsedMs(Date.now() - parsed.startTime);
    } catch (err) {
      localStorage.removeItem('workhub_timer');
    }
  }, []);

  useEffect(() => {
    if (!timerRunning || !timerStart) return undefined;
    const interval = setInterval(() => {
      setTimerElapsedMs(Date.now() - timerStart);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

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

  const elapsedLabel = useMemo(() => {
    const totalSeconds = Math.floor(timerElapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [timerElapsedMs]);

  async function startTimer() {
    setTimerError('');
    if (!timerTitle.trim()) {
      setTimerError('Please enter a title before starting the timer.');
      return;
    }
    if (!timerDate) {
      setTimerError('Please select a date.');
      return;
    }
    const startTime = Date.now();
    setTimerStart(startTime);
    setTimerElapsedMs(0);
    setTimerRunning(true);
    localStorage.setItem(
      'workhub_timer',
      JSON.stringify({
        title: timerTitle.trim(),
        date: timerDate,
        projectId: timerProjectId || '',
        startTime,
      })
    );
  }

  async function stopTimer() {
    if (!timerRunning) return;
    setTimerSaving(true);
    setTimerError('');
    const hoursRaw = timerElapsedMs / 3600000;
    const hours = Math.max(0.01, Number(hoursRaw.toFixed(2)));
    try {
      await API.post('logs/submit/', {
        title: timerTitle.trim(),
        hours,
        date: timerDate,
        project: timerProjectId || null,
      });
      setTimerTitle('');
      setTimerDate(new Date().toISOString().slice(0, 10));
      setTimerProjectId('');
      setTimerRunning(false);
      setTimerStart(null);
      setTimerElapsedMs(0);
      localStorage.removeItem('workhub_timer');
      if (showLogs) fetchLogs();
    } catch (err) {
      setTimerError('Could not save timed log. Please try again.');
    } finally {
      setTimerSaving(false);
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
            <div className="timerCard">
              <div className="timerHeader">
                <p className="timerTitle">Timer</p>
                <p className="timerValue">{elapsedLabel}</p>
              </div>
              {timerError && <p className="inlineError">{timerError}</p>}
              <div className="timerFields">
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  disabled={timerRunning || timerSaving}
                />
                <div className="timerRow">
                  <input
                    type="date"
                    value={timerDate}
                    onChange={(e) => setTimerDate(e.target.value)}
                    disabled={timerRunning || timerSaving}
                  />
                  {timerProjectsLoading ? (
                    <div className="timerSelectPlaceholder">Loading projects...</div>
                  ) : (
                    <select
                      value={timerProjectId}
                      onChange={(e) => setTimerProjectId(e.target.value)}
                      disabled={timerRunning || timerSaving}
                    >
                      <option value="">Select a project</option>
                      {timerProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="timerActions">
                {!timerRunning ? (
                  <button
                    className="btn btnPrimary"
                    type="button"
                    onClick={startTimer}
                    disabled={timerSaving}
                  >
                    Start timer
                  </button>
                ) : (
                  <button
                    className="btn btnSecondary"
                    type="button"
                    onClick={stopTimer}
                    disabled={timerSaving}
                  >
                    {timerSaving ? 'Saving...' : 'Stop & save log'}
                  </button>
                )}
              </div>
            </div>
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
