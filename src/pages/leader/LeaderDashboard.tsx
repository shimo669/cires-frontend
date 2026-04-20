import { useEffect, useMemo, useState } from 'react';
import type { Report as ReportDTO } from '../../types/report';
import { escalateReport, getMyJurisdictionReports, resolveReport } from '../../api/reportApi';
import Badge from '../../components/common/Badge';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { extractAxiosErrorMessage } from '../../api/responseUtils';

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

const getTimeRemaining = (deadline: string) => {
  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) {
    return { text: 'N/A', isOverdue: false };
  }

  const diff = target - Date.now();
  const isOverdue = diff < 0;
  const absMs = Math.abs(diff);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  if (isOverdue) {
    return { text: `OVERDUE by ${hours}h ${minutes}m`, isOverdue: true };
  }

  return { text: `${hours}h ${minutes}m left`, isOverdue: false };
};

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [infoMessage, setInfoMessage] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyJurisdictionReports(user?.levelType);
      setReports(data);
    } catch (caughtError) {
      setError(extractAxiosErrorMessage(caughtError, 'Failed to load reports in your jurisdiction. Please try again.'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
    const timer = window.setInterval(() => {
      void fetchReports();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [user?.levelType]);

  const stats = useMemo(() => {
    const pendingConfirmation = reports.filter((item) => item.status === 'PENDING_CONFIRMATION').length;
    const open = reports.filter((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS').length;
    const overdue = reports.filter((item) => getTimeRemaining(item.sla_deadline).isOverdue && item.status !== 'RESOLVED').length;

    return {
      total: reports.length,
      open,
      pendingConfirmation,
      overdue,
    };
  }, [reports]);

  const handleResolve = async (id: number) => {
    setActionLoadingId(id);
    setError('');
    setInfoMessage('');

    try {
      await resolveReport(id);
      setInfoMessage('Issue marked as resolved and sent to citizen for confirmation.');
      await fetchReports();
    } catch (caughtError) {
      setError(extractAxiosErrorMessage(caughtError, 'Failed to resolve report. Please try again.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalate = async (id: number) => {
    setActionLoadingId(id);
    setError('');
    setInfoMessage('');

    try {
      await escalateReport(id);
      setInfoMessage('Issue escalated to the next level.');
      await fetchReports();
    } catch (caughtError) {
      setError(extractAxiosErrorMessage(caughtError, 'Failed to escalate report. Please try again.'));
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
            <h2 className="text-2xl font-bold text-slate-900">{user?.username ?? 'Leader'}</h2>
            <p className="mt-1 text-sm text-slate-500">My Jurisdiction queue with SLA visibility and citizen confirmation flow.</p>
          </section>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Leader Dashboard</h1>
              <p className="text-slate-500">Monitor and process reports assigned to your jurisdiction level. List refreshes every 30 seconds.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                void fetchReports();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-yellow-700">Open</p>
              <p className="mt-2 text-2xl font-bold text-yellow-800">{stats.open}</p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-purple-700">Awaiting Citizen</p>
              <p className="mt-2 text-2xl font-bold text-purple-800">{stats.pendingConfirmation}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-red-700">Overdue</p>
              <p className="mt-2 text-2xl font-bold text-red-700">{stats.overdue}</p>
            </div>
          </div>

          {infoMessage && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{infoMessage}</div>}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading queue...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No reports in this queue.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Deadline</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Timer</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => {
                    const isResolved = report.status === 'RESOLVED';
                    const awaitingCitizen = report.status === 'PENDING_CONFIRMATION';
                    const isRowLoading = actionLoadingId === report.report_id;
                    const timer = getTimeRemaining(report.sla_deadline);

                    return (
                      <tr key={report.report_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-800">{report.title}</td>
                        <td className="px-5 py-4 text-slate-600">{report.category_name}</td>
                        <td className="px-5 py-4 text-slate-600">{report.incident_village}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(report.sla_deadline)}</td>
                        <td className="px-5 py-4 text-sm font-semibold">
                          <span className={timer.isOverdue ? 'text-red-600' : 'text-blue-700'}>{timer.text}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={report.status} />
                        </td>
                        <td className="px-5 py-4">
                          {isResolved || awaitingCitizen ? (
                            <span className="text-sm text-slate-500">No actions</span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleResolve(report.report_id);
                                }}
                                disabled={isRowLoading}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Resolve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleEscalate(report.report_id);
                                }}
                                disabled={isRowLoading}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Escalate
                              </button>
                            </div>
                          )}
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

export default LeaderDashboard;

