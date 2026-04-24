import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WorkLogForm from '../components/WorkLogForm';
import API from '../api/api';

function WorkLogs() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  // panel state: null | 'add' | 'logs'
  const [panel, setPanel] = useState(null);
  // add-log tab: 'timer' | 'manual'
  const [addTab, setAddTab] = useState('timer');

  const [logs, setLogs] = useState([]);
  const [logsRange, setLogsRange] = useState('this_week');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');

  // timer state
  const [timerTitle, setTimerTitle] = useState('');
  const [timerDate, setTimerDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerTaskId, setTimerTaskId] = useState('');
  const [timerTasks, setTimerTasks] = useState([]);
  const [timerTasksLoading, setTimerTasksLoading] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsedMs, setTimerElapsedMs] = useState(0);
  const [timerError, setTimerError] = useState('');
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerProjects, setTimerProjects] = useState([]);
  const [timerProjectsLoading, setTimerProjectsLoading] = useState(true);

  // fetch projects for timer
  useEffect(() => {
    API.get('projects/my/')
      .then((res) => setTimerProjects(res.data || []))
      .catch(() => setTimerError('Could not load projects.'))
      .finally(() => setTimerProjectsLoading(false));
  }, []);

  // fetch tasks when timer project changes
  useEffect(() => {
    if (!timerProjectId) {
      setTimerTasks([]);
      setTimerTaskId('');
      return;
    }
    setTimerTasksLoading(true);
    API.get(`projects/${timerProjectId}/tasks/`)
      .then((res) => setTimerTasks(res.data || []))
      .catch(() => setTimerError('Could not load tasks.'))
      .finally(() => setTimerTasksLoading(false));
  }, [timerProjectId]);

  // restore timer from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('workhub_timer');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.startTime) return;
      setTimerTitle(parsed.title || '');
      setTimerDate(parsed.date || new Date().toISOString().slice(0, 10));
      setTimerProjectId(parsed.projectId || '');
      setTimerTaskId(parsed.taskId || '');
      setTimerStart(parsed.startTime);
      setTimerRunning(true);
      setTimerElapsedMs(Date.now() - parsed.startTime);
    } catch {
      localStorage.removeItem('workhub_timer');
    }
  }, []);

  // tick
  useEffect(() => {
    if (!timerRunning || !timerStart) return undefined;
    const interval = setInterval(() => setTimerElapsedMs(Date.now() - timerStart), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerStart]);

  // fetch logs
  async function fetchLogs() {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const res = await API.get('logs/my/');
      setLogs(res.data || []);
    } catch {
      setLogsError('Could not load logs.');
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (panel !== 'logs') return undefined;
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [panel]);

  async function deleteLog(id) {
    try {
      await API.delete(`logs/${id}/delete/`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      window.dispatchEvent(new Event('worklogs:updated'));
    } catch {
      setLogsError('Could not delete log.');
    }
  }

  function getRangeBounds(range) {
    const today = new Date();
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    if (range === 'all') return { start: null, end: null };
    if (range === 'last_week') {
      const off = today.getDay() === 0 ? 6 : today.getDay() - 1;
      end.setDate(today.getDate() - off - 1); end.setHours(23, 59, 59, 999);
      start.setTime(end.getTime()); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (range === 'last_30_days') { start.setDate(today.getDate() - 30); return { start, end }; }
    if (range === 'last_6_months') { start.setDate(today.getDate() - 182); return { start, end }; }
    if (range === 'last_year') { start.setDate(today.getDate() - 365); return { start, end }; }
    const off = today.getDay() === 0 ? 6 : today.getDay() - 1;
    start.setDate(today.getDate() - off);
    return { start, end };
  }

  const filteredLogs = useMemo(() => {
    const { start, end } = getRangeBounds(logsRange);
    if (!start || !end) return logs;
    return logs.filter((log) => {
      if (!log?.date) return false;
      const d = new Date(`${log.date}T12:00:00`);
      return d >= start && d <= end;
    });
  }, [logs, logsRange]);

  const elapsedLabel = useMemo(() => {
    const s = Math.floor(timerElapsedMs / 1000);
    const pad = (v) => String(v).padStart(2, '0');
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  }, [timerElapsedMs]);

  function startTimer() {
    setTimerError('');
    if (!timerTitle.trim()) { setTimerError('Enter a title first.'); return; }
    const startTime = Date.now();
    setTimerStart(startTime); setTimerElapsedMs(0); setTimerRunning(true);
    localStorage.setItem('workhub_timer', JSON.stringify({
      title: timerTitle.trim(), date: timerDate, projectId: timerProjectId || '', taskId: timerTaskId || '', startTime,
    }));
  }

  async function stopTimer() {
    if (!timerRunning) return;
    setTimerSaving(true); setTimerError('');
    const hours = Math.max(0.01, Number((timerElapsedMs / 3600000).toFixed(2)));
    try {
      await API.post('logs/submit/', {
        title: timerTitle.trim(), hours, date: timerDate,
        project: timerProjectId || null,
        task: timerTaskId || null,
      });
      setTimerTitle(''); setTimerDate(new Date().toISOString().slice(0, 10));
      setTimerProjectId(''); setTimerTaskId(''); setTimerTasks([]);
      setTimerRunning(false); setTimerStart(null); setTimerElapsedMs(0);
      localStorage.removeItem('workhub_timer');
      window.dispatchEvent(new Event('worklogs:updated'));
      setPanel('logs'); fetchLogs();
    } catch {
      setTimerError('Could not save log.');
    } finally {
      setTimerSaving(false);
    }
  }

  function formatStatus(s) {
    const v = s || 'pending';
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Work Logs</h1>
          <p className="dashWelcome">Track your time and activity</p>
        </div>
        <Navbar />
      </header>

      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink">Overview</Link>
            <Link to="/work-logs" className="sidebarLink isActive">Work Logs</Link>
            <Link to="/projects" className="sidebarLink">Projects</Link>
            <Link to="/leaderboard" className="sidebarLink">Leaderboard</Link>
            <Link to="/reports" className="sidebarLink">Reports</Link>
            {isAdmin && <Link to="/admin/approvals" className="sidebarLink">Approvals</Link>}
            <Link to="/settings" className="sidebarLink">Settings</Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">Log your work manually or use the timer</p>

          {/* action buttons */}
          <div className="wlActions">
            <button
              type="button"
              className={`btn ${panel === 'add' ? 'btnPrimary' : 'btnSecondary'}`}
              onClick={() => setPanel(panel === 'add' ? null : 'add')}
            >
              {panel === 'add' ? 'Close' : '+ Add log'}
            </button>
            <button
              type="button"
              className={`btn ${panel === 'logs' ? 'btnPrimary' : 'btnSecondary'}`}
              onClick={() => setPanel(panel === 'logs' ? null : 'logs')}
            >
              View my logs
            </button>
          </div>

          {/* add log panel */}
          {panel === 'add' && (
            <div className="wlPanel">
              <div className="wlTabs">
                <button
                  type="button"
                  className={`wlTab ${addTab === 'timer' ? 'isActive' : ''}`}
                  onClick={() => setAddTab('timer')}
                >
                  Timer
                </button>
                <button
                  type="button"
                  className={`wlTab ${addTab === 'manual' ? 'isActive' : ''}`}
                  onClick={() => setAddTab('manual')}
                >
                  Manual
                </button>
              </div>

              {addTab === 'timer' && (
                <div className="wlTimerBody">
                  <div className="wlTimerDisplay">
                    <span className="wlTimerClock">{elapsedLabel}</span>
                    {timerRunning && <span className="wlTimerLive">live</span>}
                  </div>
                  {timerError && <p className="inlineError">{timerError}</p>}
                  <div className="wlFormGrid">
                    <input
                      className="wlInput wlInputFull"
                      type="text"
                      placeholder="What did you work on?"
                      value={timerTitle}
                      onChange={(e) => setTimerTitle(e.target.value)}
                      disabled={timerRunning || timerSaving}
                    />
                    <input
                      className="wlInput"
                      type="date"
                      value={timerDate}
                      onChange={(e) => setTimerDate(e.target.value)}
                      disabled={timerRunning || timerSaving}
                    />
                    {timerProjectsLoading ? (
                      <div className="wlInput wlInputPlaceholder">Loading projects…</div>
                    ) : (
                      <select
                        className="wlInput wlSelect"
                        value={timerProjectId}
                        onChange={(e) => setTimerProjectId(e.target.value)}
                        disabled={timerRunning || timerSaving}
                      >
                        <option value="">Select a project</option>
                        {timerProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    {timerProjectId && (
                      timerTasksLoading ? (
                        <div className="wlInput wlInputPlaceholder">Loading tasks…</div>
                      ) : (
                        <select
                          className="wlInput wlSelect"
                          value={timerTaskId}
                          onChange={(e) => setTimerTaskId(e.target.value)}
                          disabled={timerRunning || timerSaving}
                        >
                          <option value="">Link a task (optional)</option>
                          {timerTasks.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      )
                    )}
                  </div>
                  <div className="wlTimerBtns">
                    {!timerRunning ? (
                      <button className="btn btnPrimary" type="button" onClick={startTimer} disabled={timerSaving}>
                        Start timer
                      </button>
                    ) : (
                      <button className="btn btnSecondary" type="button" onClick={stopTimer} disabled={timerSaving}>
                        {timerSaving ? 'Saving…' : 'Stop & save'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {addTab === 'manual' && (
                <WorkLogForm
                  onSubmitted={() => {
                    setPanel('logs');
                    fetchLogs();
                  }}
                />
              )}
            </div>
          )}

          {/* logs panel */}
          {panel === 'logs' && (
            <div className="wlPanel">
              <div className="wlLogsHeader">
                <p className="wlLogsTitle">My logs</p>
                <select
                  className="wlRangeSelect"
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

              {loadingLogs && <p className="inlineStatus">Loading…</p>}
              {logsError && <p className="inlineError">{logsError}</p>}
              {!loadingLogs && filteredLogs.length === 0 && (
                <div className="emptyState">
                  <p className="emptyTitle">No logs yet</p>
                  <p className="emptySubtitle">Logs you add will show up here.</p>
                </div>
              )}
              {!loadingLogs && filteredLogs.length > 0 && (
                <div className="wlLogList">
                  {filteredLogs.map((log) => (
                    <div className="wlLogItem" key={log.id}>
                      <div className="wlLogLeft">
                        <p className="wlLogTitle">{log.title}</p>
                        <p className="wlLogMeta">
                          {log.project?.name || 'No project'}
                          {log.task?.title ? ` · ${log.task.title}` : ''}
                          {' · '}{log.date}{' · '}{log.hours}h
                        </p>
                        {log.status === 'rejected' && log.rejection_reason && (
                          <p className="wlLogReason">Rejected: {log.rejection_reason}</p>
                        )}
                      </div>
                      <div className="wlLogRight">
                        {!isAdmin && (
                          <span className={`logStatus ${log.status || 'pending'}`}>
                            {formatStatus(log.status)}
                          </span>
                        )}
                        <button
                          className="wlDeleteBtn"
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default WorkLogs;
