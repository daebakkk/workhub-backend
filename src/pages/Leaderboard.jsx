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

  const [tab, setTab] = useState('individual'); // 'individual' | 'teams'
  const [range, setRange] = useState('this_week');
  const [data, setData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [indRes, teamRes] = await Promise.all([
          API.get(`leaderboard/?range=${range}`),
          API.get(`leaderboard/teams/?range=${range}`),
        ]);
        setData(indRes.data || []);
        setTeamData(teamRes.data || []);
      } catch {
        setError('Could not load leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const userTeam = user?.team;

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

          <div className="lbTabs">
            <button
              className={`lbTab ${tab === 'individual' ? 'lbTabActive' : ''}`}
              onClick={() => setTab('individual')}
            >
              Individual
            </button>
            <button
              className={`lbTab ${tab === 'teams' ? 'lbTabActive' : ''}`}
              onClick={() => setTab('teams')}
            >
              Teams
            </button>
          </div>

          {loading && <p className="inlineStatus">Loading...</p>}
          {error && <p className="inlineError">{error}</p>}

          {/* Individual tab */}
          {!loading && !error && tab === 'individual' && (
            <>
              {data.length === 0 ? (
                <div className="emptyState">
                  <p className="emptyTitle">No data yet</p>
                  <p className="emptySubtitle">No logs have been submitted for this period.</p>
                </div>
              ) : (
                <>
                  <div className="lbSummary">
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Top performer</p>
                      <p className="lbSummaryValue">{displayName(data[0])}</p>
                      <p className="lbSummaryMeta">{data[0].total_hours}h logged</p>
                    </div>
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Overworked</p>
                      <p className="lbSummaryValue">{data.filter((e) => e.status === 'overworked').length}</p>
                      <p className="lbSummaryMeta">≥45h this period</p>
                    </div>
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Underworked</p>
                      <p className="lbSummaryValue">{data.filter((e) => e.status === 'underworked').length}</p>
                      <p className="lbSummaryMeta">&lt;25h this period</p>
                    </div>
                  </div>

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
            </>
          )}

          {/* Teams tab */}
          {!loading && !error && tab === 'teams' && (
            <>
              {teamData.length === 0 ? (
                <div className="emptyState">
                  <p className="emptyTitle">No team data yet</p>
                  <p className="emptySubtitle">No logs have been submitted for this period.</p>
                </div>
              ) : (
                <>
                  <div className="lbSummary">
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Top team</p>
                      <p className="lbSummaryValue">{teamData[0]?.display_name}</p>
                      <p className="lbSummaryMeta">{teamData[0]?.total_hours}h logged</p>
                    </div>
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Total teams</p>
                      <p className="lbSummaryValue">{teamData.length}</p>
                      <p className="lbSummaryMeta">active this period</p>
                    </div>
                    <div className="lbSummaryCard">
                      <p className="lbSummaryLabel">Most members</p>
                      <p className="lbSummaryValue">
                        {[...teamData].sort((a, b) => b.member_count - a.member_count)[0]?.display_name}
                      </p>
                      <p className="lbSummaryMeta">
                        {[...teamData].sort((a, b) => b.member_count - a.member_count)[0]?.member_count} members
                      </p>
                    </div>
                  </div>

                  <div className="lbTable">
                    <div className="lbTableHeader">
                      <span>#</span>
                      <span>Team</span>
                      <span>Members</span>
                      <span>Total Hours</span>
                      <span>Avg / Member</span>
                      <span>Logs</span>
                    </div>
                    {teamData.map((team, i) => {
                      const isMyTeam = userTeam?.id === team.id;
                      const medal = getMedal(i);
                      return (
                        <div className={`lbRow ${isMyTeam ? 'lbRowMe' : ''}`} key={team.id}>
                          <span className="lbRank">
                            {medal ? <span>{medal}</span> : <span className="lbRankNum">{i + 1}</span>}
                          </span>
                          <span className="lbName">
                            <span className="lbNameText">
                              {team.display_name}
                              {isMyTeam && <span className="lbYou"> your team</span>}
                            </span>
                          </span>
                          <span className="lbLogs">{team.member_count}</span>
                          <span className="lbHours">{team.total_hours}h</span>
                          <span className="lbHours">{team.avg_hours}h</span>
                          <span className="lbLogs">{team.log_count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
