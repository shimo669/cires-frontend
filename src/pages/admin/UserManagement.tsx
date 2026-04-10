import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../api/adminApi';
import type { UserResponseDTO } from '../../types/admin';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

const ROLE_OPTIONS = ['CITIZEN', 'LEADER', 'ADMIN'];

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

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

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId);
    setError('');
    setSuccess('');

    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
      setSuccess(`Role updated to ${newRole} successfully.`);
    } catch {
      setError('Failed to update role. Please try again.');
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
            <p className="text-slate-500">Manage platform users and update their access roles.</p>
          </div>

          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No users found.</div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Username</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Level Type</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isUpdating = updatingUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm text-slate-700">{user.id}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-800">{user.username}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.email}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{user.levelType || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <select
                            value={user.role}
                            disabled={isUpdating}
                            onChange={(event) => {
                              void handleRoleChange(user.id, event.target.value);
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
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

