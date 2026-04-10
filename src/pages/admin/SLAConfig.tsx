import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

const SLAConfig: React.FC = () => (
  <div className="min-h-screen bg-slate-100">
    <Navbar />
    <div className="mx-auto flex w-full max-w-[1400px]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">SLA Configuration</h1>
          <p className="mt-1 text-slate-600">Configure SLA settings.</p>
        </div>
      </main>
    </div>
  </div>
);
export default SLAConfig;
