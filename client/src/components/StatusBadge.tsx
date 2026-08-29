import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(' ', '_');

  const configs: Record<string, { bg: string; label: string }> = {
    // Student Placement
    YET_TO_BE_PLACED: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Yet To Be Placed' },
    PLACED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Placed' },
    TERMINATED: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Terminated' },

    // Job Status
    DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
    PENDING_APPROVAL: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Approval' },
    APPROVED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Approved' },
    REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },

    // Company Status
    COLD: { bg: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Cold' },
    WARM: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Warm' },
    HOT: { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Hot' },
    DRIVE_COMPLETED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Drive Completed' },

    // Roles
    ADMIN: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Admin' },
    MANAGER: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Manager' },
    LEAD: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Lead' },
    RECRUITER: { bg: 'bg-pink-50 text-pink-700 border-pink-200', label: 'Recruiter' },
  };

  const config = configs[normalized] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}
