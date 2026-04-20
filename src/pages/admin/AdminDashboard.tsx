import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getAllUsers, updateUserRole } from '../../api/adminApi';
import { getAdminReports } from '../../api/reportApi';
import type { UserResponseDTO } from '../../types/admin';
import type { Report as ReportDTO } from '../../types/report';

const ROLE_OPTIONS = ['CITIZEN', 'LEADER', 'ADMIN'] as const;
const LEVEL_OPTIONS = ['CITIZEN', 'VILLAGE_LEADER', 'CELL_LEADER', 'SECTOR_LEADER', 'DISTRICT_MAYOR', 'PROVINCE_GOVERNOR', 'NATIONAL_ADMIN'] as const;

type RoleOption = (typeof ROLE_OPTIONS)[number];
type LevelOption = (typeof LEVEL_OPTIONS)[number];

interface DeadlineBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    fill?: string;
  };
}

const DeadlineBarShape = ({ x, y, width, height, payload }: DeadlineBarShapeProps) => {
  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return null;
  }

  return <rect x={x} y={y} width={width} height={height} rx={10} ry={10} fill={payload?.fill ?? '#2563eb'} />;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const formatDateKey = (value: Date) => {
  return value.toLocaleDateString('en-CA');
};

const formatTrendLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateKey : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDisplayName = (user: UserResponseDTO) => user.fullName?.trim() || user.username;

const getUserAddress = (user: UserResponseDTO) => {
  if (user.fullRwandanAddress?.trim()) {
    return user.fullRwandanAddress;
  }

  return user.locationName?.trim() || 'N/A';
};

const getSafeStatus = (status?: string) => (status ?? 'PENDING').toUpperCase();

const toRoleOption = (role?: string): RoleOption => {
  const normalized = (role ?? 'CITIZEN').replace(/^ROLE_/, '').toUpperCase();
  if (normalized === 'LEADER') {
    return 'LEADER';
  }

  if (normalized === 'ADMIN') {
    return 'ADMIN';
  }

  return 'CITIZEN';
};

const toLevelOption = (levelType?: string): LevelOption | '' => {
  const normalized = (levelType ?? '').toUpperCase();

  if (normalized === 'AT_VILLAGE') {
    return 'VILLAGE_LEADER';
  }
  if (normalized === 'AT_CELL') {
    return 'CELL_LEADER';
  }
  if (normalized === 'AT_SECTOR') {
    return 'SECTOR_LEADER';
  }
  if (normalized === 'AT_DISTRICT') {
    return 'DISTRICT_MAYOR';
  }
  if (normalized === 'AT_PROVINCE') {
    return 'PROVINCE_GOVERNOR';
  }
  if (normalized === 'NATIONAL') {
    return 'NATIONAL_ADMIN';
  }

  return LEVEL_OPTIONS.includes(normalized as LevelOption) ? (normalized as LevelOption) : '';
};

const isOverdue = (report: ReportDTO) => {
  const deadline = new Date(report.sla_deadline);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  return deadline.getTime() < Date.now();
};

const isResolvedOnTime = (report: ReportDTO) => {
  return report.status === 'RESOLVED' && !isOverdue(report);
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [reports, setReports] = useState<ReportDTO[]>([]);

  const [usersLoading, setUsersLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [roleUpdatingId, setRoleUpdatingId] = useState<number | null>(null);
  const [pendingRoleByUserId, setPendingRoleByUserId] = useState<Record<number, RoleOption>>({});
  const [pendingLevelByUserId, setPendingLevelByUserId] = useState<Record<number, LevelOption | ''>>({});

  const [usersError, setUsersError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [roleMessage, setRoleMessage] = useState('');

  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError('');

      try {
        const data = await getAllUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch {
        if (isMounted) {
          setUsers([]);
          setUsersError('Failed to load users. Please try again.');
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    };

    void loadUsers();

    const intervalId = window.setInterval(() => {
      void loadUsers();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError('');

      try {
        const allReports = await getAdminReports();
        const mergedReports = allReports.sort(
          (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
        );

        if (isMounted) {
          setReports(mergedReports);
        }
      } catch (caughtError) {
        const message = (caughtError as { response?: { data?: { message?: string } } })?.response?.data?.message;
        if (isMounted) {
          setReports([]);
          setReportsError(message ?? 'Failed to load reports. Please try again.');
        }
      } finally {
        if (isMounted) {
          setReportsLoading(false);
        }
      }
    };

    void loadReports();

    const intervalId = window.setInterval(() => {
      void loadReports();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setPendingRoleByUserId((previous) => {
      const next = { ...previous };
      users.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = toRoleOption(item.role);
        }
      });

      return next;
    });

    setPendingLevelByUserId((previous) => {
      const next = { ...previous };
      users.forEach((item) => {
        if (!(item.id in next)) {
          next[item.id] = toLevelOption(item.levelType);
        }
      });

      return next;
    });
  }, [users]);

  const userStats = useMemo(() => {
    return {
      totalUsers: users.length,
      citizens: users.filter((item) => toRoleOption(item.role) === 'CITIZEN').length,
      leaders: users.filter((item) => toRoleOption(item.role) === 'LEADER').length,
      admins: users.filter((item) => toRoleOption(item.role) === 'ADMIN').length,
    };
  }, [users]);

  const reportStats = useMemo(() => {
    const solved = reports.filter((report) => report.status === 'RESOLVED').length;
    const inProgress = reports.filter((report) => report.status === 'IN_PROGRESS').length;
    const pending = reports.filter((report) => report.status === 'PENDING' || report.status === 'ESCALATED').length;
    const overdue = reports.filter(isOverdue).length;

    return {
      totalReports: reports.length,
      solved,
      inProgress,
      pending,
      overdue,
    };
  }, [reports]);

  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((item) => {
      const haystack = [
        item.id.toString(),
        item.username,
        item.fullName ?? '',
        item.email,
        item.nationalId ?? '',
        item.locationName ?? '',
        item.fullRwandanAddress ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [userSearchQuery, users]);

  const searchedReports = useMemo(() => {
    const query = reportSearchQuery.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) => {
      return report.report_id.toString().includes(query) || report.title.toLowerCase().includes(query);
    });
  }, [reportSearchQuery, reports]);

  const criticalReports = useMemo(() => {
    return reports
      .filter(isOverdue)
      .sort((left, right) => new Date(left.sla_deadline).getTime() - new Date(right.sla_deadline).getTime());
  }, [reports]);

  const statusChartData = [
    { name: 'Solved', value: reportStats.solved, fill: '#16a34a' },
    { name: 'Pending', value: reportStats.pending, fill: '#f59e0b' },
    { name: 'In-Progress', value: reportStats.inProgress, fill: '#3b82f6' },
  ];

  const deadlineChartData = [
    { name: 'Solved On-Time', value: reports.filter(isResolvedOnTime).length, fill: '#2563eb' },
    { name: 'Overdue (Missed Deadline)', value: reportStats.overdue, fill: '#dc2626' },
  ];

  const trendChartData = useMemo(() => {
    const today = new Date();
    const last30Days: string[] = [];

    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      last30Days.push(formatDateKey(date));
    }

    const counts = new Map<string, number>();
    reports.forEach((report) => {
      const reportDate = new Date(report.created_at);
      if (Number.isNaN(reportDate.getTime())) {
        return;
      }

      const key = formatDateKey(reportDate);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return last30Days.map((dayKey) => ({
      day: formatTrendLabel(dayKey),
      volume: counts.get(dayKey) ?? 0,
    }));
  }, [reports]);

  const handleUserSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserSearchQuery(userSearchInput);
  };

  const handleReportSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportSearchQuery(reportSearchInput);
  };

  const handleRoleChange = async (userId: number) => {
    setRoleUpdatingId(userId);
    setRoleMessage('');

    const newRoleValue = pendingRoleByUserId[userId] ?? 'CITIZEN';
    const selectedLevel = pendingLevelByUserId[userId] ?? '';

    if (newRoleValue === 'LEADER' && !selectedLevel) {
      setRoleMessage('Please select a leader level before saving.');
      setRoleUpdatingId(null);
      return;
    }

    try {
      await updateUserRole(userId, newRoleValue, newRoleValue === 'LEADER' ? (selectedLevel as LevelOption) : undefined);
      const refreshedUsers = await getAllUsers();
      setUsers(refreshedUsers);
      setRoleMessage(
        newRoleValue === 'LEADER'
          ? `Role updated to ${newRoleValue} with level ${selectedLevel}.`
          : `Role updated successfully to ${newRoleValue}.`,
      );
    } catch {
      setRoleMessage('Failed to update user role. Please try again.');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px]">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">National Admin Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.username ?? 'Admin'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Monitor platform-wide performance, search users and reports, and act on critical deadlines from one command center.
            </p>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Users', value: userStats.totalUsers, icon: Users, accent: 'blue' },
              { label: 'Total Reports', value: reportStats.totalReports, icon: BarChart3, accent: 'slate' },
              { label: 'Solved Issues', value: reportStats.solved, icon: PieChartIcon, accent: 'emerald' },
              { label: 'Overdue Issues', value: reportStats.overdue, icon: AlertTriangle, accent: 'red' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${item.accent === 'blue' ? 'bg-blue-50 text-blue-600' : item.accent === 'emerald' ? 'bg-emerald-50 text-emerald-600' : item.accent === 'red' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Issue Status</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Solved, pending, and in-progress issue distribution.</p>
                </div>
              </div>

              <div className="h-[320px]">
                {reportsLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart data...</div>
                ) : statusChartData.every((item) => item.value === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No report data available yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Deadline Performance</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Solved on-time vs. overdue issues that missed the deadline.</p>
                </div>
              </div>

              <div className="h-[320px]">
                {reportsLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart data...</div>
                ) : deadlineChartData.every((item) => item.value === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No deadline data available yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deadlineChartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} shape={DeadlineBarShape} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">30-Day Trend</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Daily issue volume for the last 30 days.</p>
                </div>
              </div>

              <div className="h-[320px]">
                {reportsLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={2} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">User Management</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Search users by name or national ID and change their role instantly.</p>
              </div>

              <form onSubmit={handleUserSearchSubmit} className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-end">
                <div className="flex-1">
                  <Input
                    label="Search users"
                    value={userSearchInput}
                    onChange={(event) => setUserSearchInput(event.target.value)}
                    placeholder="Type username, full name, or national ID"
                    className="bg-white"
                  />
                </div>
                <Button type="submit" className="w-full gap-2 lg:w-auto">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
            </div>

            {roleMessage && <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{roleMessage}</div>}
            {usersError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{usersError}</div>}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              {usersLoading ? (
                <div className="p-8 text-center text-slate-500">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No users match your search.</div>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">National ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Full Rwandan Address</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Level Type</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.map((item) => {
                      const isUpdating = roleUpdatingId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm text-slate-700">{item.id}</td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-900">{getDisplayName(item)}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{item.nationalId ?? 'N/A'}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{getUserAddress(item)}</td>
                          <td className="px-5 py-4">
                            <select
                              value={pendingLevelByUserId[item.id] ?? ''}
                              onChange={(event) => {
                                const nextLevel = event.target.value as LevelOption | '';
                                setPendingLevelByUserId((previous) => ({
                                  ...previous,
                                  [item.id]: nextLevel,
                                }));
                              }}
                              disabled={(pendingRoleByUserId[item.id] ?? toRoleOption(item.role)) !== 'LEADER' || isUpdating}
                              className="min-w-[150px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">Select level</option>
                              {LEVEL_OPTIONS.map((level) => (
                                <option key={level} value={level}>
                                  {level}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={pendingRoleByUserId[item.id] ?? toRoleOption(item.role)}
                                onChange={(event) => {
                                  const nextRole = event.target.value as RoleOption;
                                  setPendingRoleByUserId((previous) => ({
                                    ...previous,
                                    [item.id]: nextRole,
                                  }));

                                  if (nextRole !== 'LEADER') {
                                    setPendingLevelByUserId((previous) => ({
                                      ...previous,
                                      [item.id]: '',
                                    }));
                                  }
                                }}
                                disabled={isUpdating}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {ROLE_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  void handleRoleChange(item.id);
                                }}
                                disabled={isUpdating}
                                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Save
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
          </section>

          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900">
                  <Search className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Issue Search & Oversight</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Find issues by report ID or title and keep an eye on overdue cases.</p>
              </div>

              <form onSubmit={handleReportSearchSubmit} className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-end">
                <div className="flex-1">
                  <Input
                    label="Search reports"
                    value={reportSearchInput}
                    onChange={(event) => setReportSearchInput(event.target.value)}
                    placeholder="Enter report ID or title"
                    className="bg-white"
                  />
                </div>
                <Button type="submit" className="w-full gap-2 lg:w-auto">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
            </div>

            {reportsError && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{reportsError}</div>}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              {reportsLoading ? (
                <div className="p-8 text-center text-slate-500">Loading reports...</div>
              ) : searchedReports.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No reports match your search.</div>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {searchedReports.map((report) => (
                      <tr key={report.report_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm text-slate-700">#{report.report_id}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{report.title}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{report.category_name || 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{report.incident_village || 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{formatDateTime(report.sla_deadline)}</td>
                        <td className="px-5 py-4">
                          <Badge status={getSafeStatus(report.status)} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{report.current_escalation_level || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold">Critical List</h2>
            </div>
            <p className="mb-6 text-sm text-slate-500">Reports currently over the deadline and requiring immediate attention.</p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              {reportsLoading ? (
                <div className="p-8 text-center text-slate-500">Loading critical issues...</div>
              ) : criticalReports.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No overdue issues found.</div>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-red-700">ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-red-700">Title</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-red-700">Deadline</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-red-700">Days Overdue</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-red-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {criticalReports.map((report) => {
                      const overdueDays = Math.max(1, Math.ceil((Date.now() - new Date(report.sla_deadline).getTime()) / (1000 * 60 * 60 * 24)));

                      return (
                        <tr key={report.report_id} className="hover:bg-red-50/40">
                          <td className="px-5 py-4 text-sm font-medium text-slate-900">#{report.report_id}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{report.title}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{formatDateTime(report.sla_deadline)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-red-600">{overdueDays} day(s)</td>
                          <td className="px-5 py-4">
                            <Badge status="OVERDUE" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {reportsLoading || usersLoading ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing dashboard data...
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
