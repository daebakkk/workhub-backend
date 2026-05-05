import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';

function Dashboard() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const displayName = user?.first_name || user?.username || 'there';
  const [summary, setSummary] = useState({
    hours_this_week: 0,
    active_projects: 0,
    approval_rate: 0,
    pending_logs: 0,
    weekly_goal_hours: 0,
    recent_projects: [],
  });
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [goalDraft, setGoalDraft] = useState('');
  const [editingGoal, setEditingGoal] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // team dashboard
  const [dashView, setDashView] = useState('personal'); // 'personal' | 'teams'
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamStats, setTeamStats] = useState([]);
  const [teamStatsLoading, setTeamStatsLoading] = useState(false);
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('dashboard/summary/');
        const payload = res.data || {};
        setSummary({
          hours_this_week: Number(payload.hours_this_week || 0),
          active_projects: Number(payload.active_projects || 0),
          approval_rate: Number(payload.approval_rate || 0),
          pending_logs: Number(payload.pending_logs || 0),
          weekly_goal_hours: Number(payload.weekly_goal_hours || 0),
          recent_projects: payload.recent_projects || [],
        });
        const goalValue = Number(payload.weekly_goal_hours || 0);
        setWeeklyGoal(goalValue);
        setGoalDraft(goalValue ? String(goalValue) : '');
        setEditingGoal(goalValue === 0);
      } catch (err) {
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    window.addEventListener('worklogs:updated', fetchData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('worklogs:updated', fetchData);
    };
  }, [isAdmin]);

  useEffect(() => {
    // Load teams list for the selector
    API.get('teams/').then((res) => {
      const list = res.data || [];
      setTeams(list);
      // Pre-select user's own team if they have one
      const myTeam = list.find((t) => t.id === user?.team?.id || t.name === user?.team?.name);
      if (myTeam) setSelectedTeamId(String(myTeam.id));
      else if (list.length) setSelectedTeamId(String(list[0].id));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all-teams leaderboard when switching to teams view
  useEffect(() => {
    if (dashView !== 'teams') return;
    setTeamStatsLoading(true);
    API.get('leaderboard/teams/?range=this_week')
      .then((res) => setTeamStats(res.data || []))
      .catch(() => {})
      .finally(() => setTeamStatsLoading(false));
  }, [dashView]);

  // Load selected team detail report
  useEffect(() => {
    if (dashView !== 'teams' || !selectedTeamId) return;
    setTeamDetailLoading(true);
    API.get(`reports/team/${selectedTeamId}/summary/?range=this_week`)
      .then((res) => setTeamDetail(res.data || null))
      .catch(() => {})
      .finally(() => setTeamDetailLoading(false));
  }, [dashView, selectedTeamId]);
  const stats = useMemo(
    () => ({
      hoursThisWeek: Number(summary.hours_this_week || 0).toFixed(1),
      activeProjects: Number(summary.active_projects || 0),
      approvalRate: Number(summary.approval_rate || 0),
    }),
    [summary]
  );

  const goalProgress = useMemo(() => {
    const goal = Number(weeklyGoal || 0);
    const hours = Number(stats.hoursThisWeek || 0);
    if (!goal) return 0;
    return Math.min(100, Math.round((hours / goal) * 100));
  }, [weeklyGoal, stats.hoursThisWeek]);

  async function saveWeeklyGoal() {
    setSavingGoal(true);
    setGoalMessage('');
    try {
      const res = await API.patch('settings/', {
        weekly_goal_hours: goalDraft,
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user:updated'));
      const savedGoal = Number(res.data.weekly_goal_hours || 0);
      setWeeklyGoal(savedGoal);
      setSummary((prev) => ({ ...prev, weekly_goal_hours: savedGoal }));
      setGoalDraft(savedGoal ? String(savedGoal) : '');
      setEditingGoal(false);
      setGoalMessage('Goal saved.');
    } catch (err) {
      setGoalMessage('Could not save goal.');
    } finally {
      setSavingGoal(false);
    }
  }

  function getStatus(percent, totalTasks) {
    if (totalTasks === 0) return 'No tasks';
    if (percent === 100) return 'Completed';
    if (percent >= 75) return 'Review';
    if (percent >= 30) return 'In progress';
    return 'Starting';
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Dashboard</h1>
          <p className="dashWelcome">Welcome, {displayName}</p>
        </div>
        <div className="dashViewTabs">
          <button
            type="button"
            className={`dashViewTab ${dashView === 'personal' ? 'isActive' : ''}`}
            onClick={() => setDashView('personal')}
          >
            Personal
          </button>
          <button
            type="button"
            className={`dashViewTab ${dashView === 'teams' ? 'isActive' : ''}`}
            onClick={() => setDashView('teams')}
          >
            Teams
          </button>
        </div>
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
            <Link to="/projects" className="sidebarLink">
              Projects
            </Link>
            <Link to="/leaderboard" className="sidebarLink">
              Leaderboard
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
          {isAdmin && (
            <div className="sidebarNote">
              <p className="sidebarNoteTitle">Logs to review</p>
              <p className="sidebarNoteValue">{summary.pending_logs}</p>
            </div>
          )}
        </aside>

        <main className="dashMain dashContent">
          {dashView === 'personal' && (
            <>
              <p className="dashSubtitle">Log your work and track your progress</p>

              <section className="statGrid">
                <div className="statCard">
                  <p className="statLabel">Hours logged</p>
                  <p className="statValue">{stats.hoursThisWeek}</p>
                  <p className="statMeta">This week</p>
                </div>
                <div className="statCard">
                  <p className="statLabel">Active projects</p>
                  <p className="statValue">{stats.activeProjects}</p>
                  <p className="statMeta">In progress</p>
                </div>
                {isAdmin ? (
                  <div className="statCard">
                    <p className="statLabel">Logs to review</p>
                    <p className="statValue">{summary.pending_logs}</p>
                    <p className="statMeta">Awaiting review</p>
                  </div>
                ) : (
                  <div className="statCard">
                    <p className="statLabel">Approval rate</p>
                    <p className="statValue">{stats.approvalRate}%</p>
                    <p className="statMeta">Last 30 days</p>
                  </div>
                )}
              </section>

              <section className="card">
                <div className="cardHeader">
                  <div>
                    <h2 className="cardTitle">Weekly goal</h2>
                    <p className="cardSubtitle">{stats.hoursThisWeek} of {weeklyGoal || '—'} hours</p>
                  </div>
                  {!editingGoal && (
                    <button className="btn btnSecondary" type="button" onClick={() => setEditingGoal(true)}>
                      Change
                    </button>
                  )}
                </div>
                {editingGoal && (
                  <div className="dashGoalEdit">
                    <input
                      type="number" min="0" step="0.5"
                      className="dashGoalInput"
                      placeholder="Target hours"
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveWeeklyGoal(); } }}
                    />
                    <button className="btn btnPrimary" type="button" onClick={saveWeeklyGoal} disabled={savingGoal}>
                      {savingGoal ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
                <div className="dashGoalProgress">
                  <div className="progressBar">
                    <div className="progressFill" style={{ width: `${goalProgress}%` }} />
                  </div>
                  <p className="dashGoalPercent">{goalProgress}% complete</p>
                </div>
                {goalMessage && <p className="inlineStatus">{goalMessage}</p>}
              </section>

              <section className="card">
                <div className="cardHeader">
                  <h2 className="cardTitle">Recent Projects</h2>
                  <Link to="/projects" className="btn btnSecondary">View all</Link>
                </div>
                {loading && <p className="inlineStatus">Loading projects…</p>}
                {error && <p className="inlineError">{error}</p>}
                {!loading && !error && summary.recent_projects.length === 0 && (
                  <div className="emptyState">
                    <p className="emptyTitle">No projects yet</p>
                    <p className="emptySubtitle">Projects assigned to you will appear here.</p>
                  </div>
                )}
                {!loading && !error && summary.recent_projects.length > 0 && (
                  <div className="projectList">
                    {summary.recent_projects.map((project) => {
                      const percent = project.completion_percent || 0;
                      const totalTasks = project.total_tasks || 0;
                      const status = getStatus(percent, totalTasks);
                      const badgeClass = status.toLowerCase().replace(' ', '-');
                      return (
                        <Link to="/projects" className="projectItem" key={project.id}>
                          <div className="projectItemContent">
                            <p className="projectTitle">{project.name}</p>
                            <p className="projectMeta">{project.description || 'No description yet'}</p>
                          </div>
                          <div className="projectItemRight">
                            <div className="projectItemProgress">
                              <div className="projectItemProgressBar">
                                <div className="projectItemProgressFill" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="projectItemProgressText">{percent}%</span>
                            </div>
                            <span className={`projectStatus ${badgeClass}`}>{status}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {dashView === 'teams' && (
            <>
              <div className="teamDashHeader">
                <p className="dashSubtitle">Team performance this week</p>
                <select
                  className="teamDashSelect"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.display_name}</option>
                  ))}
                </select>
              </div>

              {/* All-teams ranking strip */}
              {teamStatsLoading && <p className="inlineStatus">Loading…</p>}
              {!teamStatsLoading && teamStats.length > 0 && (
                <div className="teamKpiGrid">
                  {teamStats.map((team, i) => {
                    const isSelected = String(team.id) === selectedTeamId;
                    const topHours = teamStats[0]?.total_hours || 1;
                    const barPct = Math.round((team.total_hours / topHours) * 100);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        className={`teamKpiCard teamKpiCardBtn ${isSelected ? 'teamKpiCardMe' : ''}`}
                        onClick={() => setSelectedTeamId(String(team.id))}
                      >
                        <div className="teamKpiTop">
                          <div className="teamKpiRank">{i + 1}</div>
                          <div className="teamKpiName">{team.display_name}</div>
                        </div>
                        <div className="teamKpiStats">
                          <div className="teamKpiStat">
                            <span className="teamKpiStatVal">{team.total_hours}h</span>
                            <span className="teamKpiStatLabel">total</span>
                          </div>
                          <div className="teamKpiStat">
                            <span className="teamKpiStatVal">{team.avg_hours}h</span>
                            <span className="teamKpiStatLabel">avg</span>
                          </div>
                          <div className="teamKpiStat">
                            <span className="teamKpiStatVal">{team.member_count}</span>
                            <span className="teamKpiStatLabel">members</span>
                          </div>
                          <div className="teamKpiStat">
                            <span className="teamKpiStatVal">{team.log_count}</span>
                            <span className="teamKpiStatLabel">logs</span>
                          </div>
                        </div>
                        <div className="teamKpiBar">
                          <div className="teamKpiBarFill" style={{ width: `${barPct}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected team detail */}
              {teamDetailLoading && <p className="inlineStatus">Loading team details…</p>}
              {!teamDetailLoading && teamDetail && (
                <>
                  <div className="teamDashDetail">
                    <section className="card">
                      <p className="cardTitle">Hours by member</p>
                      {(teamDetail.by_member || []).length === 0 && (
                        <p className="inlineStatus">No logs this week.</p>
                      )}
                      {(teamDetail.by_member || []).map((row) => {
                        const name = `${row.staff__first_name || ''} ${row.staff__last_name || ''}`.trim() || row.staff__username || '—';
                        const topMemberHours = Math.max(...(teamDetail.by_member || []).map((r) => r.hours), 1);
                        const pct = Math.round((row.hours / topMemberHours) * 100);
                        return (
                          <div className="teamMemberRow" key={row.staff__id}>
                            <span className="teamMemberName">{name}</span>
                            <div className="teamMemberBar">
                              <div className="teamMemberBarFill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="teamMemberHours">{row.hours}h</span>
                          </div>
                        );
                      })}
                    </section>

                    <section className="card">
                      <p className="cardTitle">Hours by project</p>
                      {(teamDetail.by_project || []).length === 0 && (
                        <p className="inlineStatus">No project logs this week.</p>
                      )}
                      {(teamDetail.by_project || []).map((row) => (
                        <div className="teamMemberRow" key={row.project__name || 'none'}>
                          <span className="teamMemberName">{row.project__name || 'Unassigned'}</span>
                          <span className="teamMemberHours">{row.hours}h · {row.count} logs</span>
                        </div>
                      ))}
                    </section>
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

export default Dashboard;
