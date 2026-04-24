import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

const SPEC_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  full_stack: 'Full Stack',
  mobile_ios: 'iOS',
  mobile_android: 'Android',
  mobile_cross: 'Cross-platform',
  ui_ux: 'UI/UX',
  devops: 'DevOps',
  qa_manual: 'QA',
  qa_automation: 'QA Automation',
  data_analyst: 'Data Analyst',
  data_engineer: 'Data Engineer',
  data_scientist: 'Data Scientist',
  ml_engineer: 'ML Engineer',
  ai_engineer: 'AI Engineer',
};

function getSpecLabel(key) {
  return SPEC_LABELS[key] || (key ? key.replace(/_/g, ' ') : '');
}

function getMedal(rank) {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return null;
}

function StatusPill({ status }) {
  const map = {
    overworked: { label: 'Overworked', cls: 'lbPillOver' },
    underworked: { label: 'Underworked', cls: 'lbPillUnder' },
    on_track: { label: 'On track', cls: 'lbPillOk' },
  };
  const { label, cls } = map[status] || { label: 'On track', cls: 'lbPillOk' };
  return <span className={`lbPill ${cls}`}>{label}</span>;
}

export default function Leaderboard() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [range, setRange] = useState('this_week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`leaderboard/?range=${range}`);
        setData(res.data || []);
      } catch {
        setError('Could not load leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [range]);

  const top = data[0];
  const overworked = data.filter((e) => e.status === 'overworked');
  const underworked = data.filter((e) => e.status === 'underworked');

  function displayName(entry) {
    const full = `${entry.first_name || ''} ${entry.last_name || ''}`.trim();
    return full || entry.username;
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Leaderboard</h1>
          <p className="dashWelcome">Hours worked across the team</p>
        </div>
        <Navbar />
      </header>

      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink">Overview</Link>
            <Link to="/work-logs" className="sidebarLink">Work Logs</Link>
            <Link to="/projects" className="sidebarLink">Projects</Link>
            <Link to="/leaderboard" className="sidebarLink isActive">Leaderboard</Link>
            <Link to="/reports" className="sidebarLink">Reports</Link>
            {isAdmin && <Link to="/admin/approvals" className="sidebarLink">Approvals</Link>}
            <Link to="/settings" className="sidebarLink">Settings</Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          <div className="lbControls">
            <p className="dashSubtitle">See who's putting in the hours</p>
            <select
              className="reportSelect"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="this_week">This week</option>
              <option value="last_week">Last week</option>
              <option value="last_30_days">Last 30 days</option>
            </select>
          </div>

          {loading && <p className="inlineStatus">Loading...</p>}
          {error && <p className="inlineError">{error}</p>}

          {!loading && !error && data.length === 0 && (
            <div className="emptyState">
              <p className="emptyTitle">No data yet</p>
              <p className="emptySubtitle">No logs have been submitted for this period.</p>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              {/* summary pills */}
              <div className="lbSummary">
                <div className="lbSummaryCard">
                  <p className="lbSummaryLabel">Top performer</p>
                  <p className="lbSummaryValue">{displayName(top)}</p>
                  <p className="lbSummaryMeta">{top.total_hours}h logged</p>
                </div>
                <div className="lbSummaryCard">
                  <p className="lbSummaryLabel">Overworked</p>
                  <p className="lbSummaryValue">{overworked.length}</p>
                  <p className="lbSummaryMeta">≥45h this period</p>
                </div>
                <div className="lbSummaryCard">
                  <p className="lbSummaryLabel">Underworked</p>
                  <p className="lbSummaryValue">{underworked.length}</p>
                  <p className="lbSummaryMeta">&lt;25h this period</p>
                </div>
              </div>

              {/* main table */}
              <div className="lbTable">
                <div className="lbTableHeader">
                  <span>#</span>
                  <span>Employee</span>
                  <span>Hours</span>
                  <span>Logs</span>
                  <span>vs Goal</span>
                  <span>Status</span>
                </div>
                {data.map((entry, i) => {
                  const goal = entry.weekly_goal_hours;
                  const pct = goal > 0 ? Math.min(Math.round((entry.total_hours / goal) * 100), 200) : null;
                  const medal = getMedal(i);
                  const isMe = entry.id === user?.id;
                  return (
                    <div className={`lbRow ${isMe ? 'lbRowMe' : ''}`} key={entry.id}>
                      <span className="lbRank">
                        {medal ? <span>{medal}</span> : <span className="lbRankNum">{i + 1}</span>}
                      </span>
                      <span className="lbName">
                        <span className="lbNameText">{displayName(entry)}{isMe && <span className="lbYou"> you</span>}</span>
                        {entry.specialization && (
                          <span className="lbSpec">{getSpecLabel(entry.specialization)}</span>
                        )}
                      </span>
                      <span className="lbHours">{entry.total_hours}h</span>
                      <span className="lbLogs">{entry.log_count}</span>
                      <span className="lbGoalWrap">
                        {pct !== null ? (
                          <>
                            <div className="lbGoalBar">
                              <div
                                className={`lbGoalFill ${entry.status === 'overworked' ? 'lbGoalOver' : entry.status === 'underworked' ? 'lbGoalUnder' : 'lbGoalOk'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="lbGoalPct">{pct}%</span>
                          </>
                        ) : (
                          <span className="lbGoalNone">—</span>
                        )}
                      </span>
                      <span><StatusPill status={entry.status} /></span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
