import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <nav className="border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">CIRES Platform</h1>
            <p className="text-xs text-slate-500">Citizen Issue Reporting & Escalation System</p>
          </div>
        </div>

        {user && (
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{user.username}</span>
          </p>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
