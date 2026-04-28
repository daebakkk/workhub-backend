import Navbar from '../components/Navbar';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

function memberName(row) {
  const full = `${row['staff__first_name'] || ''} ${row['staff__last_name'] || ''}`.trim();
  return full || row['staff__username'] || 'Staff';
}

export default function TeamReport() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [teams, setTeams] = useState([]);
  const [selectedRange, setSelectedRange] = useState('this_week');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('teams/').then((res) => setTeams(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    API.get(`reports/team/${teamId}/summary/`, { params: { range: selectedRange } })
      .then((res) => setReport(res.data || null))
      .catch(() => setError('Could not load team report.'))
      .finally(() => setLoading(false));
  }, [teamId, selectedRange]);

  async function downloadPdf() {
    if (!report) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const rangeLabel = TIME_RANGES.find((r) => r.value === selectedRange)?.label || 'This week';
    const teamName = report.team?.display_name || 'Team';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`${teamName} Report`, 40, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Timeframe: ${rangeLabel}`, 40, 70);

    autoTable(doc, {
      startY: 88,
      head: [['Metric', 'Value']],
      body: [
        ['Members', String(report.member_count ?? 0)],
        ['Total logs', String(report.total_logs ?? 0)],
        ['Total hours', String(report.total_hours ?? 0)],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Member', 'Hours', 'Logs']],
      body: (report.by_member || []).map((row) => [
        memberName(row),
        String(row.hours ?? 0),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Project', 'Hours', 'Logs']],
      body: (report.by_project || []).map((row) => [
        String(row.project__name || 'Unassigned'),
        String(row.hours ?? 0),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [[getPeriodTitle(report.period_unit).replace('Hours per ', ''), 'Hours']],
      body: (report.by_period || []).map((row) => [
        formatPeriodLabel(row.period, report.period_unit),
        String(row.hours ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    const datePart = new Date().toISOString().slice(0, 10);
    doc.save(`team-report-${teamName.toLowerCase().replace(/\s+/g, '-')}-${datePart}.pdf`);
  }

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
          <div className="reportTopControls">
            <select
              className="reportSelect"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Team picker — mirrors the staff picker pattern */}
            <select
              className="reportSelect"
              value={teamId || ''}
              onChange={(e) => {
                const next = e.target.value;
                if (!next) { navigate('/reports'); return; }
                navigate(`/reports/team/${next}`);
              }}
            >
              <option value="">General report</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.display_name}</option>
              ))}
            </select>
          </div>

          {loading && <p className="inlineStatus">Loading report...</p>}
          {error && <p className="inlineError">{error}</p>}

          {report && !loading && (
            <>
              <div className="reportGrid">
                <div className="reportCard">
                  <p className="reportLabel">Team</p>
                  <p className="reportValue reportValueSmall">{report.team?.display_name}</p>
                </div>
                <div className="reportCard">
                  <p className="reportLabel">Members</p>
                  <p className="reportValue">{report.member_count}</p>
                </div>
                <div className="reportCard">
                  <p className="reportLabel">Total logs</p>
                  <p className="reportValue">{report.total_logs}</p>
                </div>
                <div className="reportCard">
                  <p className="reportLabel">Total hours</p>
                  <p className="reportValue">{report.total_hours}</p>
                </div>
              </div>

              <div className="reportTables">
                <div className="reportTable">
                  <p className="reportTableTitle">Hours by member</p>
                  {(report.by_member || []).map((row) => (
                    <div className="reportRow" key={row['staff__id']}>
                      <span>{memberName(row)}</span>
                      <span>{row.hours} hrs</span>
                      <span>{row.count} logs</span>
                    </div>
                  ))}
                  {report.by_member?.length === 0 && (
                    <p className="taskEmpty">No logs for this period.</p>
                  )}
                </div>

                <div className="reportTable">
                  <p className="reportTableTitle">Hours by project</p>
                  {(report.by_project || []).map((row) => (
                    <div className="reportRow" key={row.project__name || 'none'}>
                      <span>{row.project__name || 'Unassigned'}</span>
                      <span>{row.hours} hrs</span>
                      <span>{row.count} logs</span>
                    </div>
                  ))}
                  {report.by_project?.length === 0 && (
                    <p className="taskEmpty">No project data.</p>
                  )}
                </div>

                <div className="reportTable">
                  <p className="reportTableTitle">{getPeriodTitle(report.period_unit)}</p>
                  {(report.by_period || []).map((row) => (
                    <div className="reportRow reportRowTwo" key={row.period}>
                      <span>{formatPeriodLabel(row.period, report.period_unit)}</span>
                      <span>{row.hours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reportActions">
                <button className="btn btnSecondary" type="button" onClick={downloadPdf}>
                  Download PDF
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
