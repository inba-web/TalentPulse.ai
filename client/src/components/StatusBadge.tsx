import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(' ', '_');

  const configs: Record<string, { bg: string; label: string }> = {
    // Student Placement
    YET_TO_BE_PLACED: { bg: 'bg-warning/10 text-warning border-warning/20', label: 'Yet To Be Placed' },
    PLACED: { bg: 'bg-success/10 text-success border-success/20', label: 'Placed' },
    TERMINATED: { bg: 'bg-error/10 text-error border-error/20', label: 'Terminated' },

    // Job Status
    DRAFT: { bg: 'bg-surface-3 text-text-muted border-border-primary', label: 'Draft' },
    PENDING_APPROVAL: { bg: 'bg-warning/10 text-warning border-warning/20', label: 'Pending Approval' },
    APPROVED: { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Approved' },
    REJECTED: { bg: 'bg-error/10 text-error border-error/20', label: 'Rejected' },

    // Company Status
    COLD: { bg: 'bg-surface-3 text-text-muted border-border-primary', label: 'Cold' },
    WARM: { bg: 'bg-warning/10 text-warning border-warning/20', label: 'Warm' },
    HOT: { bg: 'bg-error/10 text-error border-error/20', label: 'Hot' },
    DRIVE_COMPLETED: { bg: 'bg-success/10 text-success border-success/20', label: 'Drive Completed' },

    // Roles
    ADMIN: { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Admin' },
    MANAGER: { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Manager' },
    LEAD: { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Lead' },
    RECRUITER: { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Recruiter' },
  };

  const config = configs[normalized] || { bg: 'bg-surface-3 text-text-muted border-border-primary', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}
