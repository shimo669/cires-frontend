import { useEffect, useMemo, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../api/adminApi';
import type { LevelTypeOption, LocationTypeOption, UserResponseDTO } from '../../types/admin';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import GeographyDropdowns from '../../components/form/GeographyDropdowns';
import type { AddressHierarchySelection } from '../../types/geo';
import { extractAxiosErrorMessage } from '../../api/responseUtils';

const ROLE_OPTIONS = ['CITIZEN', 'LEADER', 'ADMIN'] as const;
const LEVEL_OPTIONS: LevelTypeOption[] = [
  'CITIZEN',
  'VILLAGE_LEADER',
  'CELL_LEADER',
  'SECTOR_LEADER',
  'DISTRICT_MAYOR',
  'PROVINCE_GOVERNOR',
  'NATIONAL_ADMIN',
];

type RoleOption = (typeof ROLE_OPTIONS)[number];

const normalizeRole = (role?: string): RoleOption => {
  const normalized = (role ?? 'CITIZEN').replace(/^ROLE_/, '').toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'LEADER' || normalized === 'CITIZEN') {
    return normalized;
  }

  return 'CITIZEN';
};

const normalizeLevel = (levelType?: string): LevelTypeOption | '' => {
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

  return LEVEL_OPTIONS.includes(normalized as LevelTypeOption) ? (normalized as LevelTypeOption) : '';
};

const getRequiredLocationId = (levelType: LevelTypeOption | '', selection: AddressHierarchySelection): number | undefined => {
  if (levelType === 'PROVINCE_GOVERNOR') {
    return selection.provinceId ?? undefined;
  }

  if (levelType === 'DISTRICT_MAYOR') {
    return selection.districtId ?? undefined;
  }

  if (levelType === 'SECTOR_LEADER') {
    return selection.sectorId ?? undefined;
  }

  if (levelType === 'CELL_LEADER') {
    return selection.cellId ?? undefined;
  }

  if (levelType === 'VILLAGE_LEADER' || levelType === 'CITIZEN') {
    return selection.villageId ?? undefined;
  }

  return undefined;
};

const getLocationTypeForLevel = (levelType: LevelTypeOption | ''): LocationTypeOption | undefined => {
  if (levelType === 'PROVINCE_GOVERNOR') {
    return 'PROVINCE';
  }

  if (levelType === 'DISTRICT_MAYOR') {
    return 'DISTRICT';
  }

  if (levelType === 'SECTOR_LEADER') {
    return 'SECTOR';
  }

  if (levelType === 'CELL_LEADER') {
    return 'CELL';
  }

  if (levelType === 'VILLAGE_LEADER' || levelType === 'CITIZEN') {
    return 'VILLAGE';
  }

  return undefined;
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleName, setRoleName] = useState<RoleOption>('CITIZEN');
  const [levelType, setLevelType] = useState<LevelTypeOption | ''>('CITIZEN');
  const [locationSelection, setLocationSelection] = useState<AddressHierarchySelection>({
    provinceId: null,
    districtId: null,
    sectorId: null,
    cellId: null,
    villageId: null,
  });
  const [locationResetKey, setLocationResetKey] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((item) => {
      const haystack = [
        item.id.toString(),
        item.username,
        item.email,
        item.nationalId ?? '',
        item.locationName ?? '',
        item.fullRwandanAddress ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, users]);

  const handleOpenEditor = (user: UserResponseDTO) => {
    setSelectedUserId(user.id);
    setRoleName(normalizeRole(user.role));
    setLevelType(normalizeLevel(user.levelType) || (normalizeRole(user.role) === 'LEADER' ? 'VILLAGE_LEADER' : normalizeRole(user.role) === 'ADMIN' ? 'NATIONAL_ADMIN' : 'CITIZEN'));
    setLocationSelection({ provinceId: null, districtId: null, sectorId: null, cellId: null, villageId: null });
    setLocationResetKey((previous) => previous + 1);
    setError('');
    setSuccess('');
  };

  const handleRoleChange = async () => {
    if (!selectedUserId) {
      setError('Please select a user to update.');
      return;
    }

    setUpdatingUserId(selectedUserId);
    setError('');
    setSuccess('');

    if (roleName === 'LEADER' && !levelType) {
      setError('Please select a level type for leaders.');
      setUpdatingUserId(null);
      return;
    }

    const locationId = getRequiredLocationId(levelType, locationSelection);
    const locationType = getLocationTypeForLevel(levelType);
    const needsLocation = levelType && levelType !== 'NATIONAL_ADMIN';

    if (roleName === 'LEADER' && (!levelType || !locationType || !locationId)) {
      setError('Leader assignment requires level type and location (type + id).');
      setUpdatingUserId(null);
      return;
    }

    if (needsLocation && (!locationType || !locationId)) {
      setError('Please choose the required assignment location for the selected level.');
      setUpdatingUserId(null);
      return;
    }

    try {
      await updateUserRole(selectedUserId, roleName, levelType || undefined, locationType, locationId);
      await loadUsers();
      setSuccess(`Updated user to ${roleName}${levelType ? ` (${levelType})` : ''} successfully.`);
    } catch (caughtError) {
      setError(extractAxiosErrorMessage(caughtError, 'Failed to update role. Please try again.'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500">Assign role, level type, and jurisdiction location for each user.</p>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username, email, national ID, or address"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-900"
            />
          </div>

          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {selectedUserId && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Update Selected User</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
                  <select
                    value={roleName}
                    onChange={(event) => {
                      const nextRole = event.target.value as RoleOption;
                      setRoleName(nextRole);

                      if (nextRole === 'ADMIN') {
                        setLevelType('NATIONAL_ADMIN');
                      } else if (nextRole === 'LEADER' && !levelType) {
                        setLevelType('VILLAGE_LEADER');
                      } else if (nextRole === 'CITIZEN') {
                        setLevelType('CITIZEN');
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Level Type</label>
                  <select
                    value={levelType}
                    onChange={(event) => setLevelType(event.target.value as LevelTypeOption)}
                    disabled={roleName === 'ADMIN'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {LEVEL_OPTIONS.filter((option) => {
                      if (roleName === 'CITIZEN') {
                        return option === 'CITIZEN';
                      }
                      if (roleName === 'LEADER') {
                        return option !== 'NATIONAL_ADMIN' && option !== 'CITIZEN';
                      }
                      return option === 'NATIONAL_ADMIN';
                    }).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRoleChange();
                    }}
                    disabled={updatingUserId === selectedUserId}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingUserId === selectedUserId ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {levelType !== 'NATIONAL_ADMIN' && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Assignment Location</p>
                  <GeographyDropdowns
                    key={locationResetKey}
                    onSelectionChange={(selection) => {
                      setLocationSelection(selection);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No users found.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Username</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">National ID</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Location Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Full Rwandan Address</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Level Type</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm text-slate-700">{user.id}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-800">{user.username}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.email}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.nationalId ?? 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.locationName ?? 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.fullRwandanAddress ?? 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{normalizeLevel(user.levelType) || 'N/A'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{normalizeRole(user.role)}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEditor(user)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Manage
                          </button>
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

export default UserManagement;

