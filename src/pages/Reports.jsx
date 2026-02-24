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

export default function Reports() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedRange, setSelectedRange] = useState('this_week');
  const [staffReport, setStaffReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState('');
  const [staffError, setStaffError] = useState('');

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
        if (list.length > 0) {
          setReport(list[0]);
        }
      } catch (err) {
        setError('Could not load reports.');
      }
    }

    async function fetchStaff() {
      if (!isAdmin) return;
      try {
        const res = await API.get('users/staff/');
        const users = res.data || [];
        setStaff(users);
      } catch (err) {
        setStaffError('Could not load staff list.');
      }
    }

    fetchReports();
    fetchStaff();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    async function fetchStaffReport() {
      if (!selectedStaffId) {
        setStaffReport(null);
        return;
      }
      setStaffLoading(true);
      setStaffError('');
      try {
        const res = await API.get(`reports/staff/${selectedStaffId}/summary/`, {
          params: { range: selectedRange },
        });
        setStaffReport(res.data);
      } catch (err) {
        setStaffError('Could not load staff report.');
      } finally {
        setStaffLoading(false);
      }
    }

    fetchStaffReport();
  }, [selectedStaffId, selectedRange]);

  function formatStaffName(person) {
    if (!person) return 'Staff';
    const full = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    return full || person.username || 'Staff';
  }

  async function generateReport() {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('reports/create/');
      const created = res.data;
      setReports((prev) => [created, ...prev]);
      setReport(created);
    } catch (err) {
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
    const approvedCount =
      report.status_counts?.find((s) => s.status === 'approved')?.count ?? 0;
    const summaryBody = [
      ['Total logs', String(report.total_logs ?? 0)],
      ['Total hours', String(report.total_hours ?? 0)],
      ['Approved', String(approvedCount)],
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('WorkHub Report', 40, 50);

    autoTable(doc, {
      startY: 70,
      head: [['Metric', 'Value']],
      body: summaryBody,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Status', 'Count']],
      body: (report.status_counts || []).map((row) => [
        String(row.status ?? ''),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Project', 'Hours', 'Logs']],
      body: (report.by_project || []).map((row) => [
        String(row.project__name || 'Unassigned'),
        String(row.hours ?? 0),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    const datePart = new Date().toISOString().slice(0, 10);
    doc.save(`workhub-report-${datePart}.pdf`);
  }

  async function downloadStaffPdf() {
    if (!staffReport) return;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const staffName = formatStaffName(staffReport.staff);
    const rangeLabel = TIME_RANGES.find((item) => item.value === selectedRange)?.label || 'This week';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`${staffName} - Work Report`, 40, 45);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Timeframe: ${rangeLabel}`, 40, 65);

    autoTable(doc, {
      startY: 82,
      head: [['Metric', 'Value']],
      body: [
        ['Total logs', String(staffReport.total_logs ?? 0)],
        ['Total hours', String(staffReport.total_hours ?? 0)],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Status', 'Count']],
      body: (staffReport.status_counts || []).map((row) => [
        String(row.status ?? ''),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Project', 'Hours', 'Logs']],
      body: (staffReport.by_project || []).map((row) => [
        String(row.project__name || 'Unassigned'),
        String(row.hours ?? 0),
        String(row.count ?? 0),
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Date', 'Hours', 'Logs']],
      body: (staffReport.by_date || []).map((row) => [
        String(row.date ?? ''),
        String(row.hours ?? 0),
        String(row.count ?? 0),
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
          <p className="dashSubtitle">Overview of staff work activity</p>
          {loading && <p className="inlineStatus">Generating report...</p>}
          {error && <p className="inlineError">{error}</p>}
          {staffError && <p className="inlineError">{staffError}</p>}

          {isAdmin && (
            <section className="reportHistory">
              <p className="reportTableTitle">Employee report</p>
              <div className="reportFilters">
                <select
                  className="reportSelect"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  <option value="">General report</option>
                  {sortedStaff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {formatStaffName(person)}
                    </option>
                  ))}
                </select>
                {selectedStaffId && (
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
                )}
              </div>
              {!selectedStaffId && (
                <p className="inlineStatus">Viewing general report.</p>
              )}
              {selectedStaffId && staffLoading && <p className="inlineStatus">Loading employee report...</p>}
            </section>
          )}

          {isAdmin && selectedStaffId && staffReport && !staffLoading && (
            <>
              <div className="reportGrid">
                <div className="reportCard">
                  <p className="reportLabel">Employee</p>
                  <p className="reportValue">{formatStaffName(staffReport.staff)}</p>
                </div>
                <div className="reportCard">
                  <p className="reportLabel">Total logs</p>
                  <p className="reportValue">{staffReport.total_logs}</p>
                </div>
                <div className="reportCard">
                  <p className="reportLabel">Total hours</p>
                  <p className="reportValue">{staffReport.total_hours}</p>
                </div>
              </div>

              <div className="reportTables">
                <div className="reportTable">
                  <p className="reportTableTitle">Hours by project</p>
                  {(staffReport.by_project || []).map((row) => (
                    <div className="reportRow" key={row.project__name || 'none'}>
                      <span>{row.project__name || 'Unassigned'}</span>
                      <span>{row.hours || 0} hrs</span>
                      <span>{row.count} logs</span>
                    </div>
                  ))}
                </div>
                <div className="reportTable">
                  <p className="reportTableTitle">Logs by date</p>
                  {(staffReport.by_date || []).map((row) => (
                    <div className="reportRow" key={row.date}>
                      <span>{row.date}</span>
                      <span>{row.hours || 0} hrs</span>
                      <span>{row.count} logs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reportActions">
                <button
                  className="btn btnSecondary"
                  type="button"
                  onClick={downloadStaffPdf}
                >
                  Download Staff PDF
                </button>
              </div>
            </>
          )}

          {!report && !loading && !error && (
            <div className="emptyState">
              <p className="emptyTitle">No reports generated</p>
              <p className="emptySubtitle">
                Reports will appear here once an admin generates them.
              </p>
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
              <div className="reportCard">
                <p className="reportLabel">Total logs</p>
                <p className="reportValue">{report.total_logs}</p>
              </div>
              <div className="reportCard">
                <p className="reportLabel">Total hours</p>
                <p className="reportValue">{report.total_hours}</p>
              </div>
              <div className="reportCard">
                <p className="reportLabel">Approved</p>
                <p className="reportValue">
                  {report.status_counts.find((s) => s.status === 'approved')?.count || 0}
                </p>
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
                <p className="reportTableTitle">Logs by date</p>
                {report.by_date.map((row) => (
                  <div className="reportRow" key={row.date}>
                    <span>{row.date}</span>
                    <span>{row.hours || 0} hrs</span>
                    <span>{row.count} logs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="reportActions">
            {isAdmin && (
              <button
                className="btn btnPrimary reportsGenerateBtn"
                type="button"
                onClick={generateReport}
                disabled={loading}
              >
                Generate Reports
              </button>
            )}
            {report && (
              <button
                className="btn btnSecondary"
                type="button"
                onClick={downloadPdf}
              >
                Download PDF
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
