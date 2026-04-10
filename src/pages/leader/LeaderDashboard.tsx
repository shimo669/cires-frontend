import { useEffect, useState } from 'react';
import type { Report as ReportDTO } from '../../types/report';
import { escalateReport, getReportsByLevel, resolveReport } from '../../api/reportApi';
import Badge from '../../components/common/Badge';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const LEVELS = ['AT_VILLAGE', 'AT_CELL', 'AT_SECTOR', 'AT_DISTRICT', 'AT_PROVINCE'] as const;

type QueueLevel = (typeof LEVELS)[number];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<QueueLevel>('AT_VILLAGE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchReports = async (level: QueueLevel) => {
    setLoading(true);
    setError('');

    try {
      const data = await getReportsByLevel(level);
      setReports(data);
    } catch {
      setError('Failed to load reports for this queue. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports(selectedLevel);
  }, [selectedLevel]);

  const handleResolve = async (id: number) => {
    setActionLoadingId(id);
    setError('');

    try {
      await resolveReport(id);
      await fetchReports(selectedLevel);
    } catch {
      setError('Failed to resolve report. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalate = async (id: number) => {
    setActionLoadingId(id);
    setError('');

    try {
      await escalateReport(id);
      await fetchReports(selectedLevel);
    } catch {
      setError('Failed to escalate report. Please try again.');
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
            <p className="mt-1 text-sm text-slate-500">Process incoming reports and manage escalation queues efficiently.</p>
          </section>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Leader Dashboard</h1>
              <p className="text-slate-500">Monitor and process reports by escalation level queue.</p>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="queue-level" className="text-sm font-semibold text-slate-600">
                Queue Level
              </label>
              <select
                id="queue-level"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
                value={selectedLevel}
                onChange={(event) => setSelectedLevel(event.target.value as QueueLevel)}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => {
                    const isResolved = report.status === 'RESOLVED';
                    const isRowLoading = actionLoadingId === report.report_id;

                    return (
                      <tr key={report.report_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-800">{report.title}</td>
                        <td className="px-5 py-4 text-slate-600">{report.category_name}</td>
                        <td className="px-5 py-4 text-slate-600">{report.incident_village}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(report.sla_deadline)}</td>
                        <td className="px-5 py-4">
                          <Badge status={report.status} />
                        </td>
                        <td className="px-5 py-4">
                          {isResolved ? (
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

