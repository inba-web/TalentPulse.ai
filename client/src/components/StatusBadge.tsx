import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(' ', '_');

  const configs: Record<string, { bg: string; label: string }> = {
    // Student Placement
    YET_TO_BE_PLACED: { bg: 'bg-warning-soft text-warning border-warning/20', label: 'Yet To Be Placed' },
    PLACED: { bg: 'bg-success-soft text-success border-success/20', label: 'Placed' },
    TERMINATED: { bg: 'bg-error-soft text-error border-error/20', label: 'Terminated' },

    // Job Status
    DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
    PENDING_APPROVAL: { bg: 'bg-warning-soft text-warning border-warning/20', label: 'Pending Approval' },
    APPROVED: { bg: 'bg-primary-soft text-primary border-primary/20', label: 'Approved' },
    REJECTED: { bg: 'bg-error-soft text-error border-error/20', label: 'Rejected' },

    // Company Status
    COLD: { bg: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Cold' },
    WARM: { bg: 'bg-warning-soft text-warning border-warning/20', label: 'Warm' },
    HOT: { bg: 'bg-secondary-soft text-secondary border-secondary/20', label: 'Hot' },
    DRIVE_COMPLETED: { bg: 'bg-success-soft text-success border-success/20', label: 'Drive Completed' },

    // Roles
    ADMIN: { bg: 'bg-primary-soft text-primary border-primary/20', label: 'Admin' },
    MANAGER: { bg: 'bg-primary-soft text-primary border-primary/20', label: 'Manager' },
    LEAD: { bg: 'bg-primary-soft text-primary border-primary/20', label: 'Lead' },
    RECRUITER: { bg: 'bg-primary-soft text-primary border-primary/20', label: 'Recruiter' },
  };

  const config = configs[normalized] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}
