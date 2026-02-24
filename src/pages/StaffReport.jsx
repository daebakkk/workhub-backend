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

function formatStaffName(person) {
  if (!person) return 'Staff';
  const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim();
  return fullName || person.username || 'Staff';
}

function getPeriodTitle(periodUnit) {
  if (periodUnit === 'week') return 'Hours per week';
  if (periodUnit === 'month') return 'Hours per month';
  return 'Hours per day';
}

function formatPeriodLabel(period, periodUnit) {
  if (!period) return '';
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return String(period);
  if (periodUnit === 'month') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  if (periodUnit === 'week') {
    return `Week of ${date.toLocaleDateString()}`;
  }
  return date.toLocaleDateString();
}

export default function StaffReport() {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [staff, setStaff] = useState([]);
  const [selectedRange, setSelectedRange] = useState('this_week');
  const [report, setReport] = useState(null);
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
    async function fetchStaff() {
      if (!isAdmin) return;
      try {
        const res = await API.get('users/staff/');
        setStaff(res.data || []);
      } catch (err) {
        setError('Could not load staff list.');
      }
    }

    fetchStaff();
  }, [isAdmin]);

  useEffect(() => {
    async function fetchReport() {
      if (!staffId) return;
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`reports/staff/${staffId}/summary/`, {
          params: { range: selectedRange },
        });
        setReport(res.data || null);
      } catch (err) {
        setError('Could not load staff report.');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [staffId, selectedRange]);

  async function downloadPdf() {
    if (!report) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const rangeLabel = TIME_RANGES.find((item) => item.value === selectedRange)?.label || 'This week';
    const staffName = formatStaffName(report.staff);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`${staffName} Report`, 40, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Timeframe: ${rangeLabel}`, 40, 70);

    autoTable(doc, {
      startY: 88,
      head: [['Metric', 'Value']],
      body: [
        ['Total logs', String(report.total_logs ?? 0)],
        ['Total hours', String(report.total_hours ?? 0)],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Status', 'Count']],
      body: (report.status_counts || []).map((row) => [
        String(row.status ?? ''),
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
    doc.save(`staff-report-${staffName.toLowerCase().replace(/\s+/g, '-')}-${datePart}.pdf`);
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
            <Link to="/dashboard" className="sidebarLink">
              Overview
            </Link>
            <Link to="/work-logs" className="sidebarLink">
              Work Logs
            </Link>
            <Link to="/projects" className="sidebarLink">
              Projects
            </Link>
            <Link to="/reports" className="sidebarLink isActive">
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
          <div className="reportTopControls">
            <select
              className="reportSelect"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              {TIME_RANGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              className="reportSelect"
              value={staffId || ''}
              onChange={(e) => {
                const next = e.target.value;
                if (!next) {
                  navigate('/reports');
                  return;
                }
                navigate(`/reports/staff/${next}`);
              }}
            >
              <option value="">General report</option>
              {isAdmin && user?.id && (
                <option value={String(user.id)}>My report</option>
              )}
              {sortedStaff.map((person) => (
                <option key={person.id} value={person.id}>
                  {formatStaffName(person)}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="inlineStatus">Loading report...</p>}
          {error && <p className="inlineError">{error}</p>}

          {report && !loading && (
            <>
              <div className="reportGrid">
                <div className="reportCard">
                  <p className="reportLabel">User</p>
                  <p className="reportValue reportValueSmall">{formatStaffName(report.staff)}</p>
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
                  <p className="reportTableTitle">Hours by project</p>
                  {(report.by_project || []).map((row) => (
                    <div className="reportRow" key={row.project__name || 'none'}>
                      <span>{row.project__name || 'Unassigned'}</span>
                      <span>{row.hours || 0} hrs</span>
                      <span>{row.count} logs</span>
                    </div>
                  ))}
                </div>
                <div className="reportTable">
                  <p className="reportTableTitle">{getPeriodTitle(report.period_unit)}</p>
                  {(report.by_period || []).map((row) => (
                    <div className="reportRow reportRowTwo" key={row.period}>
                      <span>{formatPeriodLabel(row.period, report.period_unit)}</span>
                      <span>{row.hours || 0} hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reportActions">
                <button
                  className="btn btnSecondary"
                  type="button"
                  onClick={downloadPdf}
                >
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
