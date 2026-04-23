import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Report as ReportDTO } from '../../types/report';
import { escalateReport, getMyJurisdictionReports, resolveReport } from '../../api/reportApi';
import Badge from '../../components/common/Badge';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { extractAxiosErrorMessage } from '../../api/responseUtils';
import { normalizeReportLevel } from '../../api/responseUtils';

const ESCALATION_ORDER = ['AT_VILLAGE', 'AT_CELL', 'AT_SECTOR', 'AT_DISTRICT'] as const;

const LEVEL_LABELS: Record<string, string> = {
  AT_VILLAGE: 'Village',
  AT_CELL: 'Cell',
  AT_SECTOR: 'Sector',
  AT_DISTRICT: 'District',
  AT_PROVINCE: 'Province',
  AT_NATIONAL: 'National',
};

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

const getLevelLabel = (level?: string | null) => {
  const normalized = normalizeReportLevel(level ?? 'AT_VILLAGE');
  return LEVEL_LABELS[normalized] ?? normalized.replace(/_/g, ' ');
};

const getNextEscalationLevel = (level?: string | null) => {
  const normalized = normalizeReportLevel(level ?? 'AT_VILLAGE');
  const index = ESCALATION_ORDER.indexOf(normalized as (typeof ESCALATION_ORDER)[number]);

  if (index === -1 || index >= ESCALATION_ORDER.length - 1) {
    return null;
  }

  return ESCALATION_ORDER[index + 1];
};

const isPendingReporterConfirmation = (report: ReportDTO) => {
  return report.status === 'PENDING_REPORTER_CONFIRMATION' || report.status === 'PENDING_CONFIRMATION';
};

const isNeverSolved = (report: ReportDTO) => report.status === 'NEVER_SOLVED';

const isTerminalReport = (report: ReportDTO) => isPendingReporterConfirmation(report) || isNeverSolved(report);

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const isFetchingRef = useRef(false);
  const normalizedLevel = useMemo(() => normalizeReportLevel(user?.levelType ?? 'AT_VILLAGE'), [user?.levelType]);
  const jurisdictionLabel = getLevelLabel(normalizedLevel);
  const nextEscalationLevel = getNextEscalationLevel(normalizedLevel);

  const fetchReports = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const data = await getMyJurisdictionReports(user?.levelType);
      if (!user?.levelType) {
        setReports(data);
        return;
      }

      const scopedReports = data.filter((report) => {
        const reportLevel = normalizeReportLevel(report.current_escalation_level);
        return reportLevel === normalizedLevel;
      });

      setReports(scopedReports.length > 0 ? scopedReports : data);
    } catch (caughtError) {
      setError(extractAxiosErrorMessage(caughtError, 'Failed to load reports in your jurisdiction. Please try again.'));
      setReports([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [normalizedLevel, user?.levelType]);

  useEffect(() => {
    void fetchReports();
    const timer = window.setInterval(() => {
      void fetchReports();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchReports]);

  const stats = useMemo(() => {
    const pendingConfirmation = reports.filter((item) => isPendingReporterConfirmation(item)).length;
    const open = reports.filter((item) => item.status === 'PENDING' || item.status === 'OPEN' || item.status === 'IN_PROGRESS' || item.status === 'ESCALATED').length;
    const overdue = reports.filter((item) => {
      const timer = getTimeRemaining(item.sla_deadline);
      return timer.isOverdue && !isTerminalReport(item) && item.status !== 'RESOLVED';
    }).length;
    const neverSolved = reports.filter((item) => isNeverSolved(item)).length;

    return {
      total: reports.length,
      open,
      pendingConfirmation,
      overdue,
      neverSolved,
    };
  }, [reports]);

  const queueReports = useMemo(() => {
    return [...reports].sort((left, right) => {
      const leftTimer = getTimeRemaining(left.sla_deadline);
      const rightTimer = getTimeRemaining(right.sla_deadline);

      if (leftTimer.isOverdue !== rightTimer.isOverdue) {
        return leftTimer.isOverdue ? -1 : 1;
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [reports]);

  const handleResolve = async (id: number) => {
    setActionLoadingId(id);
    setError('');
    setInfoMessage('');

    try {
      await resolveReport(id);
      setInfoMessage('Report marked as solved. Waiting for reporter confirmation and rating.');
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
      setInfoMessage(
        nextEscalationLevel
          ? `Issue escalated to ${getLevelLabel(nextEscalationLevel)}.`
          : 'Issue marked as never solved after district review.',
      );
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
            <p className="mt-1 text-sm text-slate-500">
              {jurisdictionLabel} jurisdiction queue with SLA visibility, escalation tracking, and citizen confirmation flow.
            </p>
          </section>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Leader Dashboard</h1>
              <p className="text-slate-500">
                Monitor and process reports assigned to the {jurisdictionLabel.toLowerCase()} queue. List refreshes every 30 seconds.
              </p>
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-rose-700">Never Solved</p>
              <p className="mt-2 text-2xl font-bold text-rose-700">{stats.neverSolved}</p>
            </div>
          </div>

          {infoMessage && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{infoMessage}</div>}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading queue...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : queueReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No reports in this queue.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Reporter ID</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Reporter Username</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Level</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Deadline</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Timer</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueReports.map((report) => {
                    const isResolved = report.status === 'RESOLVED';
                    const awaitingCitizen = isPendingReporterConfirmation(report);
                    const reportLevel = normalizeReportLevel(report.current_escalation_level);
                    const reportLevelLabel = getLevelLabel(reportLevel);
                    const nextLevel = getNextEscalationLevel(reportLevel);
                    const isRowLoading = actionLoadingId === report.report_id;
                    const timer = getTimeRemaining(report.sla_deadline);
                    const canResolve = !awaitingCitizen && !isResolved && !isNeverSolved(report);
                    const canEscalate = timer.isOverdue && !awaitingCitizen && !isResolved && !isNeverSolved(report);
                    const escalateLabel = nextLevel ? `Escalate to ${getLevelLabel(nextLevel)}` : 'Mark as Never Solved';

                    return (
                      <tr key={report.report_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-800">{report.title}</td>
                        <td className="px-5 py-4 text-slate-600">{report.reporter_id ?? 'N/A'}</td>
                        <td className="px-5 py-4 text-slate-600">{report.reporter_username ?? 'N/A'}</td>
                        <td className="px-5 py-4 text-slate-600">{report.category_name}</td>
                        <td className="px-5 py-4 text-slate-600">{report.incident_village}</td>
                        <td className="px-5 py-4 text-slate-600">{reportLevelLabel}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(report.sla_deadline)}</td>
                        <td className="px-5 py-4 text-sm font-semibold">
                          <span className={timer.isOverdue ? 'text-red-600' : 'text-blue-700'}>{timer.text}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={report.status} />
                        </td>
                        <td className="px-5 py-4">
                          {isResolved || awaitingCitizen || isNeverSolved(report) ? (
                            awaitingCitizen ? (
                              <span className="text-sm font-semibold text-amber-700">Waiting for reporter confirmation</span>
                            ) : isNeverSolved(report) ? (
                              <span className="text-sm font-semibold text-rose-700">Recorded as never solved</span>
                            ) : (
                              <span className="text-sm text-slate-500">Finalized</span>
                            )
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleResolve(report.report_id);
                                }}
                                disabled={isRowLoading || !canResolve}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Mark as Solved
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleEscalate(report.report_id);
                                }}
                                disabled={isRowLoading || !canEscalate}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {escalateLabel}
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

