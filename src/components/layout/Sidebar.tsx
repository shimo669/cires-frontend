import { LayoutDashboard, FilePlus, ClipboardList, Settings, ShieldAlert, Users, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FilePlus, label: 'Submit Report', path: '/report/new', roles: ['CITIZEN'] },
    { icon: ClipboardList, label: 'My Tickets', path: '/reports', roles: ['CITIZEN'] },
    { icon: ShieldAlert, label: 'Escalation Queue', path: '/escalations', roles: ['LEADER'] },
    { icon: Users, label: 'User Management', path: '/admin/users', roles: ['ADMIN'] },
    { icon: Settings, label: 'SLA Config', path: '/admin/sla-config', roles: ['ADMIN'] },
  ];

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-[calc(100vh-81px)] lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Welcome</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{user?.username ?? 'User'}</p>
        <p className="text-xs text-slate-500">Role: {user?.role ?? 'N/A'}</p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {menuItems
          .filter((item) => !item.roles || item.roles.includes(user?.role ?? ''))
          .map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Button onClick={handleLogout} variant="outline" className="w-full gap-2 border-slate-300 text-slate-700 hover:bg-slate-100">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;