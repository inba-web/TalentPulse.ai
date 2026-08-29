import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { ShieldCheck, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiFetch(`/api/audit-logs?limit=15&offset=${(page - 1) * 15}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLogs(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('TERMINATED') || action.includes('DELETED') || action.includes('REJECTED')) {
      return 'text-danger bg-red-500/10 border-red-500/20';
    }
    if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('IMPORTED') || action.includes('RESOLVED')) {
      return 'text-success bg-emerald-500/10 border-emerald-500/20';
    }
    return 'text-primary bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Audit Logs</h1>
          <p className="text-xs text-text-muted mt-1">Immutable audit trail of administrative activities and compliance events.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded bg-surface-1 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Logs container */}
      <div className="bg-surface-1 rounded border border-border-primary p-6">
        {loading && logs.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <span>Loading audit ledger...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            No audit records logged in the database yet.
          </div>
        ) : (
          <div className="relative border-l border-border-primary ml-4 pl-8 space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative flex flex-col md:flex-row md:justify-between items-start gap-4">

                {/* Timeline node icon */}
                <span className="absolute -left-[41px] top-1 p-1 bg-surface-1 rounded-full border border-border-primary">
                  <span className="w-3.5 h-3.5 rounded-full bg-text-muted block" />
                </span>

                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-text-secondary font-bold">
                      {log.actor?.fullName || 'System Account'} ({log.actor?.roleName || 'SYSTEM'})
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-normal">
                    Modified <strong className="text-text-primary">{log.entity}</strong> record
                    {log.entityId && <span className="font-mono text-[10px] bg-background-secondary border border-border-primary px-1 rounded ml-1">ID: {log.entityId}</span>}
                  </p>

                  {log.metadata && (
                    <div className="text-[10px] font-mono bg-background-secondary p-2 border border-border-primary rounded max-w-lg overflow-x-auto text-text-muted leading-relaxed">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right text-[10px] text-text-muted font-medium min-w-[120px] md:pt-1">
                  <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                  <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  {log.ipAddress && <div className="text-text-disabled mt-0.5">IP: {log.ipAddress}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="mt-8 pt-6 border-t border-border-primary flex justify-between items-center text-xs">
            <span className="text-text-muted font-medium">
              Showing {logs.length} of {total} events
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border-primary rounded bg-surface-1 disabled:opacity-50 text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 15 >= total}
                className="px-3 py-1.5 border border-border-primary rounded bg-surface-1 disabled:opacity-50 text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
