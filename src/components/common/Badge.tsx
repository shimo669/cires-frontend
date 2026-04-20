import React from 'react';

interface BadgeProps {
  status: string;
}

const badgeStyles: Record<string, string> = {
  OPEN: 'border-red-200 bg-red-50 text-red-700',
  ESCALATED: 'border-red-200 bg-red-50 text-red-700',
  OVERDUE: 'border-red-200 bg-red-50 text-red-700',
  CRITICAL: 'border-red-200 bg-red-50 text-red-700',
  PENDING: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  PENDING_CONFIRMATION: 'border-purple-200 bg-purple-50 text-purple-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  RESOLVED: 'border-green-200 bg-green-50 text-green-700',
  REOPENED: 'border-orange-200 bg-orange-50 text-orange-700',
  SOLVED: 'border-green-200 bg-green-50 text-green-700',
  DEFAULT: 'border-slate-200 bg-slate-100 text-slate-700',
};

const badgeLabels: Record<string, string> = {
  IN_PROGRESS: 'IN PROGRESS',
  PENDING_CONFIRMATION: 'PENDING CONFIRMATION',
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();
  const style = badgeStyles[normalized] ?? badgeStyles.DEFAULT;
  const label = badgeLabels[normalized] ?? normalized.replace(/_/g, ' ');

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${style}`}>
      {label}
    </span>
  );
};

export default Badge;