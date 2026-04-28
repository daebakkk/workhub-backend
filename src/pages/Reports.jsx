import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Reports() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  // 'general' | 'staff:<id>' | 'team:<id>'
  const [reportMode, setReportMode] = useState('general');
  const [teamRange, setTeamRange] = useState('this_week');

  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamReport, setTeamReport] = useState(null);
  const [teamReportLoading, setTeamReportLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      const aName = `${a.first_name || ''} ${a.last_name || ''} ${a.username || ''}`.trim().toLowerCase();
      const bName = `${b.first_name || ''} ${b.last_name || ''} ${b.username || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [staff]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await API.get('reports/');
        const list = res.data || [];
        setReports(list);
        if (list.length > 0) setReport(list[0]);
      } catch {
        setError('Could not load reports.');
      }
    }
    async function fetchStaff() {
      if (!isAdmin) return;
      try {
        const res = await API.get('users/staff/');
        setStaff(res.data || []);
      } catch {
        setError('Could not load staff list.');
      }
    }
    async function fetchTeams() {
      try {
        const res = await API.get('teams/');
        setTeams(res.data || []);
      } catch { /* silent */ }
    }
    fetchReports();
    fetchStaff();
    fetchTeams();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Fetch team report whenever mode or range changes
  useEffect(() => {
    if (!reportMode.startsWith('team:')) return;
    const teamId = reportMode.split(':')[1];
    async function fetchTeamReport() {
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
    fetchTeamReport();
  }, [reportMode, teamRange]);

  async function generateReport() {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('reports/create/');
      const created = res.data;
      setReports((prev) => [created, ...prev]);
      setReport(created);
    } catch {
      setError('Could not generate report.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    if (!report) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const approvedCount = report.status_counts?.find((s) => s.status === 'approved')?.count ?? 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('WorkHub General Report', 40, 50);
    autoTable(doc, {
      startY: 70,
      head: [['Metric', 'Value']],
      body: [
        ['Total logs', String(report.total_logs ?? 0)],
        ['Total hours', String(report.total_hours ?? 0)],
        ['Approved', String(approvedCount)],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Status', 'Count']],
      body: (report.status_counts || []).map((row) => [String(row.status ?? ''), String(row.count ?? 0)]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Project', 'Hours', 'Logs']],
      body: (report.by_project || []).map((row) => [String(row.project__name || 'Unassigned'), String(row.hours ?? 0), String(row.count ?? 0)]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Date', 'Hours']],
      body: (report.by_date || []).map((row) => [String(row.date ?? ''), String(row.hours ?? 0)]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    doc.save(`workhub-general-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function downloadTeamPdf() {
    if (!teamReport) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const rangeLabel = TIME_RANGES.find((r) => r.value === teamRange)?.label || teamRange;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`${teamReport.team.display_name} Report`, 40, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Timeframe: ${rangeLabel}`, 40, 70);
    autoTable(doc, {
      startY: 88,
      head: [['Metric', 'Value']],
      body: [
        ['Members', String(teamReport.member_count ?? 0)],
        ['Total logs', String(teamReport.total_logs ?? 0)],
        ['Total hours', String(teamReport.total_hours ?? 0)],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Member', 'Hours', 'Logs']],
      body: (teamReport.by_member || []).map((row) => {
        const name = `${row.staff__first_name || ''} ${row.staff__last_name || ''}`.trim() || row.staff__username || '—';
        return [name, String(row.hours ?? 0), String(row.count ?? 0)];
      }),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Project', 'Hours', 'Logs']],
      body: (teamReport.by_project || []).map((row) => [String(row.project__name || 'Unassigned'), String(row.hours ?? 0), String(row.count ?? 0)]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [[getPeriodTitle(teamReport.period_unit).replace('Hours per ', ''), 'Hours']],
      body: (teamReport.by_period || []).map((row) => [formatPeriodLabel(row.period, teamReport.period_unit), String(row.hours ?? 0)]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });
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
          <p className="dashSubtitle">Overview of staff work activity</p>
          {loading && <p className="inlineStatus">Generating report...</p>}
          {error && <p className="inlineError">{error}</p>}

          <div className="reportTopControls">
            <select
              className="reportSelect"
              value={reportMode}
              onChange={(e) => {
                const val = e.target.value;
                setReportMode(val);
                if (val.startsWith('staff:')) {
                  navigate(`/reports/staff/${val.split(':')[1]}`);
                }
              }}
            >
              <option value="general">General report</option>
              {isAdmin && user?.id && (
                <option value={`staff:${user.id}`}>My report</option>
              )}
              {sortedStaff.map((person) => (
                <option key={person.id} value={`staff:${person.id}`}>
                  {`${person.first_name || ''} ${person.last_name || ''}`.trim() || person.username}
                </option>
              ))}
              {teams.length > 0 && (
                <optgroup label="Teams">
                  {teams.map((t) => (
                    <option key={t.id} value={`team:${t.id}`}>{t.display_name}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {isTeamMode && (
              <select
                className="reportSelect"
                value={teamRange}
                onChange={(e) => setTeamRange(e.target.value)}
              >
                {TIME_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── General report ── */}
          {!isTeamMode && !isStaffMode && (
            <>
              {!report && !loading && !error && (
                <div className="emptyState">
                  <p className="emptyTitle">No reports generated</p>
                  <p className="emptySubtitle">Reports will appear here once an admin generates them.</p>
                </div>
              )}

              {reports.length > 0 && (
                <div className="reportHistory">
                  <p className="reportTableTitle">Saved reports</p>
                  <div className="reportHistoryList">
                    {reports.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`reportHistoryItem ${report?.id === item.id ? 'isActive' : ''}`}
                        onClick={() => setReport(item)}
                      >
                        {new Date(item.created_at).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {report && (
                <div className="reportGrid">
                  <div className="reportCard"><p className="reportLabel">Total logs</p><p className="reportValue">{report.total_logs}</p></div>
                  <div className="reportCard"><p className="reportLabel">Total hours</p><p className="reportValue">{report.total_hours}</p></div>
                  <div className="reportCard">
                    <p className="reportLabel">Approved</p>
                    <p className="reportValue">{report.status_counts.find((s) => s.status === 'approved')?.count || 0}</p>
                  </div>
                </div>
              )}

              {report && (
                <div className="reportTables">
                  <div className="reportTable">
                    <p className="reportTableTitle">Hours by project</p>
                    {report.by_project.map((row) => (
                      <div className="reportRow" key={row.project__name || 'none'}>
                        <span>{row.project__name || 'Unassigned'}</span>
                        <span>{row.hours || 0} hrs</span>
                        <span>{row.count} logs</span>
                      </div>
                    ))}
                  </div>
                  <div className="reportTable">
                    <p className="reportTableTitle">Hours per day</p>
                    {report.by_date.map((row) => (
                      <div className="reportRow reportRowTwo" key={row.date}>
                        <span>{row.date}</span>
                        <span>{row.hours || 0} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="reportActions">
                {isAdmin && (
                  <button className="btn btnPrimary reportsGenerateBtn" type="button" onClick={generateReport} disabled={loading}>
                    Generate Reports
                  </button>
                )}
                {report && (
                  <button className="btn btnSecondary" type="button" onClick={downloadPdf}>
                    Download PDF
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Team report ── */}
          {isTeamMode && (
            <>
              {teamReportLoading && <p className="inlineStatus">Loading team report...</p>}

              {!teamReportLoading && teamReport && (
                <>
                  <div className="reportGrid">
                    <div className="reportCard"><p className="reportLabel">Team</p><p className="reportValue reportValueSmall">{teamReport.team.display_name}</p></div>
                    <div className="reportCard"><p className="reportLabel">Members</p><p className="reportValue">{teamReport.member_count}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total hours</p><p className="reportValue">{teamReport.total_hours}</p></div>
                    <div className="reportCard"><p className="reportLabel">Total logs</p><p className="reportValue">{teamReport.total_logs}</p></div>
                  </div>

                  <div className="reportTables">
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by member</p>
                      {(teamReport.by_member || []).map((row) => {
                        const name = `${row.staff__first_name || ''} ${row.staff__last_name || ''}`.trim() || row.staff__username || '—';
                        return (
                          <div className="reportRow" key={row.staff__id}>
                            <span>{name}</span>
                            <span>{row.hours} hrs</span>
                            <span>{row.count} logs</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="reportTable">
                      <p className="reportTableTitle">Hours by project</p>
                      {(teamReport.by_project || []).map((row) => (
                        <div className="reportRow" key={row.project__name || 'none'}>
                          <span>{row.project__name || 'Unassigned'}</span>
                          <span>{row.hours} hrs</span>
                          <span>{row.count} logs</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="reportTable" style={{ marginTop: '16px' }}>
                    <p className="reportTableTitle">{getPeriodTitle(teamReport.period_unit)}</p>
                    {(teamReport.by_period || []).map((row) => (
                      <div className="reportRow reportRowTwo" key={row.period}>
                        <span>{formatPeriodLabel(row.period, teamReport.period_unit)}</span>
                        <span>{row.hours} hrs</span>
                      </div>
                    ))}
                  </div>

                  <div className="reportActions">
                    <button className="btn btnSecondary" type="button" onClick={downloadTeamPdf}>
                      Download PDF
                    </button>
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
