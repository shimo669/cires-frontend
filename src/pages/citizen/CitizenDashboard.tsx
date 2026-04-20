import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Report as ReportDTO } from '../../types/report';
import { confirmReport, denyReport, getMyReports } from '../../api/reportApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

const getCategory = (report: ReportDTO) => {
  return report.category_name || 'N/A';
};

const getLocation = (report: ReportDTO) => {
  return report.incident_village || 'N/A';
};

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyReports();
      setReports(data);
    } catch {
      setError('Failed to load your reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const totalReports = reports.length;
  const resolvedReports = useMemo(() => reports.filter((report) => report.status === 'RESOLVED').length, [reports]);
  const pendingConfirmationCount = useMemo(
    () => reports.filter((report) => report.status === 'PENDING_CONFIRMATION').length,
    [reports],
  );

  const handleCitizenDecision = async (reportId: number, decision: 'confirm' | 'deny') => {
    setActionLoadingId(reportId);
    setError('');
    setSuccess('');

    try {
      if (decision === 'confirm') {
        await confirmReport(reportId);
        setSuccess('Thank you. The issue has been confirmed as resolved.');
      } else {
        await denyReport(reportId);
        setSuccess('Issue has been reopened and sent back for action.');
      }

      await loadReports();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Welcome back</p>
            <h2 className="text-2xl font-bold text-slate-900">{user?.username ?? 'Citizen'}</h2>
            <p className="mt-1 text-sm text-slate-500">Track your submitted issues and follow their resolution progress.</p>
          </section>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
              <p className="text-slate-500">Track all submitted reports and their current resolution status.</p>
            </div>

            <Button onClick={() => navigate('/report/new')} className="flex items-center gap-2">
              <PlusCircle size={18} />
              New Report
            </Button>
          </div>

          {pendingConfirmationCount > 0 && (
            <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
              You have {pendingConfirmationCount} issue(s) waiting for your confirmation.
            </div>
          )}

          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Total Reports</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalReports}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Resolved Reports</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{resolvedReports}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading reports...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No reports found yet. Submit your first issue.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Deadline</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => {
                    const isPendingConfirmation = report.status === 'PENDING_CONFIRMATION';
                    const rowLoading = actionLoadingId === report.report_id;

                    return (
                      <tr key={report.report_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-800">{report.title}</td>
                        <td className="px-5 py-4 text-slate-600">{getCategory(report)}</td>
                        <td className="px-5 py-4 text-slate-600">{getLocation(report)}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(report.sla_deadline)}</td>
                        <td className="px-5 py-4">
                          <Badge status={report.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {isPendingConfirmation && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleCitizenDecision(report.report_id, 'confirm');
                                  }}
                                  disabled={rowLoading}
                                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  Confirm Resolved
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleCitizenDecision(report.report_id, 'deny');
                                  }}
                                  disabled={rowLoading}
                                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  Deny / Reopen
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/reports/${report.report_id}`, {
                                  state: { reportStatus: report.status, deadlineDate: report.sla_deadline },
                                })
                              }
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboard;

