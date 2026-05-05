import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';

const TIME_RANGES = [
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'last_year', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

function getPeriodTitle(periodUnit) {
  if (periodUnit === 'week') return 'Hours per week';
  if (periodUnit === 'month') return 'Hours per month';
  return 'Hours per day';
}

function formatPeriodLabel(period, periodUnit) {
  if (!period) return '';
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return String(period);
  if (periodUnit === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  if (periodUnit === 'week') return `Week of ${date.toLocaleDateString()}`;
  return date.toLocaleDateString();
}

function formatStaffName(person) {
  if (!person) return 'Staff';
  const full = `${person.first_name || ''} ${person.last_name || ''}`.trim();
  return full || person.username || 'Staff';
}

export default function Reports() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  // 'general' | 'staff:<id>' | 'team:<id>'
  const [reportMode, setReportMode] = useState('general');
  const [teamRange, setTeamRange] = useState('this_week');
  const [staffRange, setStaffRange] = useState('this_week');

  // general report
  const [generalReport, setGeneralReport] = useState(null);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);

  // staff report
  const [staffReport, setStaffReport] = useState(null);
  const [staffReportLoading, setStaffReportLoading] = useState(false);

  // team report
  const [teamReport, setTeamReport] = useState(null);
  const [teamReportLoading, setTeamReportLoading] = useState(false);

  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => {
    const aName = `${a.first_name || ''} ${a.last_name || ''} ${a.username || ''}`.trim().toLowerCase();
    const bName = `${b.first_name || ''} ${b.last_name || ''} ${b.username || ''}`.trim().toLowerCase();
    return aName.localeCompare(bName);
  }), [staff]);

  // Load staff + teams once
  useEffect(() => {
    if (isAdmin) {
      API.get('users/staff/').then((r) => setStaff(r.data || [])).catch(() => {});
    }
    API.get('teams/').then((r) => setTeams(r.data || [])).catch(() => {});
  }, [isAdmin]);

  // General report — auto-load on mount or when switching to general
  useEffect(() => {
    if (reportMode !== 'general') return;
    async function load() {
      setGeneralLoading(true);
      setError('');
      try {
        const savedRes = await API.get('reports/');
        const list = savedRes.data || [];
        setSavedReports(list);
        if (list.length > 0) {
          setGeneralReport(list[0]);
        } else {
          const res = await API.post('reports/create/');
          setSavedReports([res.data]);
          setGeneralReport(res.data);
        }
      } catch {
        setError('Could not load report.');
      } finally {
        setGeneralLoading(false);
      }
    }
    load();
  }, [reportMode]);

  // Staff report — load when mode or range changes
  useEffect(() => {
    if (!reportMode.startsWith('staff:')) return;
    const staffId = reportMode.split(':')[1];
    async function load() {
      setStaffReportLoading(true);
      setError('');
      try {
        const res = await API.get(`reports/staff/${staffId}/summary/`, {
          params: { range: staffRange },
        });
        setStaffReport(res.data || null);
      } catch {
        setError('Could not load staff report.');
      } finally {
        setStaffReportLoading(false);
      }
    }
    load();
  }, [reportMode, staffRange]);

  // Team report — load when mode or range changes
  useEffect(() => {
    if (!reportMode.startsWith('team:')) return;
    const teamId = reportMode.split(':')[1];
    async function load() {
      setTeamReportLoading(true);
      setError('');
      try {
        const res = await API.get(`reports/team/${teamId}/summary/?range=${teamRange}`);
        setTeamReport(res.data || null);
      } catch {
        setError('Could not load team report.');
      } finally {
        setTeamReportLoading(false);
      }
    }
    load();
  }, [reportMode, teamRange]);

  async function refreshGeneralReport() {
    setGeneralLoading(true);
    setError('');
    try {
      const res = await API.post('reports/create/');
      setSavedReports((prev) => [res.data, ...prev]);
      setGeneralReport(res.data);
    } catch {
      setError('Could not generate report.');
    } finally {
      setGeneralLoading(false);
    }
  }

  async function downloadGeneralPdf() {
    if (!generalReport) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const approvedCount = generalReport.status_counts?.find((s) => s.status === 'approved')?.count ?? 0;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text('WorkHub General Report', 40, 50);
    autoTable(doc, { startY: 70, head: [['Metric', 'Value']], body: [['Total logs', String(generalReport.total_logs ?? 0)], ['Total hours', String(generalReport.total_hours ?? 0)], ['Approved', String(approvedCount)]], styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 18, head: [['Project', 'Hours', 'Logs']], body: (generalReport.by_project || []).map((r) => [String(r.project__name || 'Unassigned'), String(r.hours ?? 0), String(r.count ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 18, head: [['Date', 'Hours']], body: (generalReport.by_date || []).map((r) => [String(r.date ?? ''), String(r.hours ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`workhub-general-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function downloadStaffPdf() {
    if (!staffReport) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const rangeLabel = TIME_RANGES.find((r) => r.value === staffRange)?.label || staffRange;
    const name = formatStaffName(staffReport.staff);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text(`${name} Report`, 40, 50);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(`Timeframe: ${rangeLabel}`, 40, 70);
    autoTable(doc, { startY: 88, head: [['Metric', 'Value']], body: [['Total logs', String(staffReport.total_logs ?? 0)], ['Total hours', String(staffReport.total_hours ?? 0)]], styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 16, head: [['Project', 'Hours', 'Logs']], body: (staffReport.by_project || []).map((r) => [String(r.project__name || 'Unassigned'), String(r.hours ?? 0), String(r.count ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 16, head: [[getPeriodTitle(staffReport.period_unit).replace('Hours per ', ''), 'Hours']], body: (staffReport.by_period || []).map((r) => [formatPeriodLabel(r.period, staffReport.period_unit), String(r.hours ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`staff-report-${name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function downloadTeamPdf() {
    if (!teamReport) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const rangeLabel = TIME_RANGES.find((r) => r.value === teamRange)?.label || teamRange;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text(`${teamReport.team.display_name} Report`, 40, 50);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(`Timeframe: ${rangeLabel}`, 40, 70);
    autoTable(doc, { startY: 88, head: [['Metric', 'Value']], body: [['Members', String(teamReport.member_count ?? 0)], ['Total logs', String(teamReport.total_logs ?? 0)], ['Total hours', String(teamReport.total_hours ?? 0)]], styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 16, head: [['Member', 'Hours', 'Logs']], body: (teamReport.by_member || []).map((r) => { const n = `${r.staff__first_name || ''} ${r.staff__last_name || ''}`.trim() || r.staff__username || '—'; return [n, String(r.hours ?? 0), String(r.count ?? 0)]; }), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 16, head: [['Project', 'Hours', 'Logs']], body: (teamReport.by_project || []).map((r) => [String(r.project__name || 'Unassigned'), String(r.hours ?? 0), String(r.count ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 16, head: [[getPeriodTitle(teamReport.period_unit).replace('Hours per ', ''), 'Hours']], body: (teamReport.by_period || []).map((r) => [formatPeriodLabel(r.period, teamReport.period_unit), String(r.hours ?? 0)]), styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`team-report-${teamReport.team.name}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const isTeamMode = reportMode.startsWith('team:');
  const isStaffMode = reportMode.startsWith('staff:');

  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Reports</h1>
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
            <Link to="/leaderboard" className="sidebarLink">Leaderboard</Link>
            <Link to="/reports" className="sidebarLink isActive">Reports</Link>
            {isAdmin && <Link to="/admin/approvals" className="sidebarLink">Approvals</Link>}
            <Link to="/settings" className="sidebarLink">Settings</Link>
          </nav>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">Overview of work activity</p>
          {error && <p className="inlineError">{error}</p>}

          {/* ── Dropdown row ── */}
          <div className="reportTopControls">
            <select
              className="reportSelect"
              value={reportMode}
              onChange={(e) => setReportMode(e.target.value)}
            >
              <option value="general">General report</option>
              {user?.id && (
                <option value={`staff:${user.id}`}>My report</option>
              )}
              {isAdmin && sortedStaff.length > 0 && (
                <optgroup label="Staff">
                  {sortedStaff.map((person) => (
                    <option key={person.id} value={`staff:${person.id}`}>
                      {`${person.first_name || ''} ${person.last_name || ''}`.trim() || person.username}
                    </option>
                  ))}
                </optgroup>
              )}
              {teams.length > 0 && (
                <optgroup label="Teams">
                  {teams.map((t) => (
                    <option key={t.id} value={`team:${t.id}`}>{t.display_name}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {isStaffMode && (
              <select className="reportSelect" value={staffRange} onChange={(e) => setStaffRange(e.target.value)}>
                {TIME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            )}

            {isTeamMode && (
              <select className="reportSelect" value={teamRange} onChange={(e) => setTeamRange(e.target.value)}>
                {TIME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            )}
          </div>

          {/* ── General report ── */}
          {!isTeamMode && !isStaffMode && (
            <>
              {generalLoading && <p className="inlineStatus">Loading report...</p>}
              {!generalLoading && generalReport && (
                <>
                  {savedReports.length > 1 && (
                    <div className="reportHistory">
                      <p className="reportTableTitle">Saved reports</p>
                      <div className="reportHistoryList">
                        {savedReports.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`reportHistoryItem ${generalReport?.id === item.id ? 'isActive' : ''}`}
                            onClick={() => setGeneralReport(item)}
                          >
                            {new Date(item.created_at).toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="reportGrid">
                    <div className="reportCard"><p className="reportLabel">Total logs</p><p className="reportValue">{generalReport.total_logs}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total hours</p><p className="reportValue">{generalReport.total_hours}</p></div>
                    <div className="reportCard"><p className="reportLabel">Approved</p><p className="reportValue">{generalReport.status_counts?.find((s) => s.status === 'approved')?.count || 0}</p></div>
                  </div>
                  <div className="reportTables">
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by project</p>
                      {generalReport.by_project.map((row) => (
                        <div className="reportRow" key={row.project__name || 'none'}>
                          <span>{row.project__name || 'Unassigned'}</span>
                          <span>{row.hours || 0} hrs</span>
                          <span>{row.count} logs</span>
                        </div>
                      ))}
                    </div>
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours per day</p>
                      {generalReport.by_date.map((row) => (
                        <div className="reportRow reportRowTwo" key={row.date}>
                          <span>{row.date}</span>
                          <span>{row.hours || 0} hrs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="reportActions">
                    <button className="btn btnSecondary" type="button" onClick={downloadGeneralPdf}>Download PDF</button>
                    <button className="btn btnPrimary" type="button" onClick={refreshGeneralReport} disabled={generalLoading}>
                      {generalLoading ? 'Refreshing…' : 'Refresh report'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Staff / My report ── */}
          {isStaffMode && (
            <>
              {staffReportLoading && <p className="inlineStatus">Loading report...</p>}
              {!staffReportLoading && staffReport && (
                <>
                  <div className="reportGrid">
                    <div className="reportCard"><p className="reportLabel">Name</p><p className="reportValue reportValueSmall">{formatStaffName(staffReport.staff)}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total logs</p><p className="reportValue">{staffReport.total_logs}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total hours</p><p className="reportValue">{staffReport.total_hours}</p></div>
                  </div>
                  <div className="reportTables">
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by project</p>
                      {(staffReport.by_project || []).length === 0 && <p className="reportRowEmpty">No data</p>}
                      {(staffReport.by_project || []).map((row) => (
                        <div className="reportRow" key={row.project__name || 'none'}>
                          <span>{row.project__name || 'Unassigned'}</span>
                          <span>{row.hours || 0} hrs</span>
                          <span>{row.count} logs</span>
                        </div>
                      ))}
                    </div>
                    <div className="reportTable">
                      <p className="reportTableTitle">{getPeriodTitle(staffReport.period_unit)}</p>
                      {(staffReport.by_period || []).length === 0 && <p className="reportRowEmpty">No data</p>}
                      {(staffReport.by_period || []).map((row) => (
                        <div className="reportRow reportRowTwo" key={row.period}>
                          <span>{formatPeriodLabel(row.period, staffReport.period_unit)}</span>
                          <span>{row.hours || 0} hrs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="reportActions">
                    <button className="btn btnSecondary" type="button" onClick={downloadStaffPdf}>Download PDF</button>
                  </div>
                </>
              )}
              {!staffReportLoading && !staffReport && !error && (
                <div className="emptyState">
                  <p className="emptyTitle">No data</p>
                  <p className="emptySubtitle">No logs found for this period.</p>
                </div>
              )}
            </>
          )}

          {/* ── Team report ── */}
          {isTeamMode && (
            <>
              {teamReportLoading && <p className="inlineStatus">Loading team report...</p>}
              {!teamReportLoading && teamReport && (
                <>
                  <div className="teamReportHeader">
                    <h2 className="teamReportName">{teamReport.team.display_name}</h2>
                    <span className="teamReportMeta">{teamReport.member_count} member{teamReport.member_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="teamReportStats">
                    <div className="reportCard"><p className="reportLabel">Total hours</p><p className="reportValue">{teamReport.total_hours}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total logs</p><p className="reportValue">{teamReport.total_logs}</p></div>
                    <div className="reportCard"><p className="reportLabel">Avg hrs / member</p><p className="reportValue">{teamReport.member_count > 0 ? (teamReport.total_hours / teamReport.member_count).toFixed(1) : 0}</p></div>
                  </div>
                  <div className="teamReportTables">
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by member</p>
                      {(teamReport.by_member || []).length === 0 && <p className="reportRowEmpty">No data</p>}
                      {(teamReport.by_member || []).map((row) => {
                        const name = `${row.staff__first_name || ''} ${row.staff__last_name || ''}`.trim() || row.staff__username || '—';
                        return (
                          <div className="reportRow" key={row.staff__id}>
                            <span>{name}</span><span>{row.hours} hrs</span><span>{row.count} logs</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by project</p>
                      {(teamReport.by_project || []).length === 0 && <p className="reportRowEmpty">No data</p>}
                      {(teamReport.by_project || []).map((row) => (
                        <div className="reportRow" key={row.project__name || 'none'}>
                          <span>{row.project__name || 'Unassigned'}</span><span>{row.hours} hrs</span><span>{row.count} logs</span>
                        </div>
                      ))}
                    </div>
                    <div className="reportTable teamReportPeriod">
                      <p className="reportTableTitle">{getPeriodTitle(teamReport.period_unit)}</p>
                      {(teamReport.by_period || []).length === 0 && <p className="reportRowEmpty">No data</p>}
                      {(teamReport.by_period || []).map((row) => (
                        <div className="reportRow reportRowTwo" key={row.period}>
                          <span>{formatPeriodLabel(row.period, teamReport.period_unit)}</span><span>{row.hours} hrs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="reportActions">
                    <button className="btn btnSecondary" type="button" onClick={downloadTeamPdf}>Download PDF</button>
                  </div>
                </>
              )}
              {!teamReportLoading && !teamReport && !error && (
                <div className="emptyState">
                  <p className="emptyTitle">No data</p>
                  <p className="emptySubtitle">No logs found for this team in the selected period.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
