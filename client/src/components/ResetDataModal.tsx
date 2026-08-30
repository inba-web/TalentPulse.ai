import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, Loader2, X, RefreshCw } from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { useJobStore } from '../store/jobStore';
import { useCompanyStore } from '../store/companyStore';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResetDataModal({ isOpen, onClose, onSuccess }: ResetDataModalProps) {
  const [counts, setCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [executingReset, setExecutingReset] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const REQUIRED_TEXT = 'RESET PLACEMENT DATA';

  const { fetchStudents } = useStudentStore();
  const { fetchJobs } = useJobStore();
  const { fetchCompanies } = useCompanyStore();

  const loadCounts = async () => {
    setLoadingCounts(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/admin/reset-counts');
      const result = await res.json();
      if (result.success) {
        setCounts(result.data);
      } else {
        setErrorMsg(result.error?.message || 'Failed to load placement data counts');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCounts();
      setTypedConfirmation('');
      setResetResult(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirmation !== REQUIRED_TEXT) return;

    setExecutingReset(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: typedConfirmation }),
      });
      const result = await res.json();

      if (result.success) {
        setResetResult(result.data?.summary || result.data);
        // Refresh global client stores so all lists immediately clear
        fetchStudents({ page: 1, limit: 10 });
        fetchJobs({ limit: 100 });
        fetchCompanies({ page: 1 });
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(result.error?.message || 'Data reset failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute reset operation');
    } finally {
      setExecutingReset(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/75 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200">
      <div className="bg-surface-1 max-w-xl w-full rounded-xl border border-error/30 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-error/10">
          <h3 className="font-extrabold text-error text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-error" />
            <span>Reset Placement Business Data</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-2 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!resetResult ? (
            <>
              <div className="bg-error/5 border border-error/20 p-4 rounded-lg space-y-2">
                <p className="text-xs text-text-primary leading-relaxed">
                  This permanently removes all placement-related business data and prepares TalentPulse.ai for a fresh dataset.
                </p>
                <p className="text-[11px] text-text-muted font-medium">
                  System users, RBAC permissions, audit infrastructure, and application settings will <strong className="text-success">NOT</strong> be affected.
                </p>
              </div>

              {/* Entity Count Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Current Database Record Impact</span>
                  <button
                    onClick={loadCounts}
                    disabled={loadingCounts}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingCounts ? 'animate-spin' : ''}`} />
                    Refresh Counts
                  </button>
                </div>

                {loadingCounts ? (
                  <div className="py-8 text-center text-text-muted text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
                    Calculating database metrics...
                  </div>
                ) : counts ? (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.students}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Students</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.companies}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Companies</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.jobs}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Jobs</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.jds}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">JDs</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.drives}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Drives</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.placements}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Placements</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.atsAnalyses}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">ATS Runs</div>
                    </div>
                    <div className="p-2.5 bg-background-secondary rounded border border-border-primary">
                      <div className="font-extrabold text-text-primary text-base">{counts.businessNotifications}</div>
                      <div className="text-[9px] text-text-muted font-sans font-bold uppercase mt-0.5">Alerts</div>
                    </div>
                  </div>
                ) : null}
              </div>

              {errorMsg && (
                <div className="p-3 bg-error/15 border border-error/30 text-error text-xs rounded font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Confirmation Form */}
              <form onSubmit={handleExecuteReset} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    To confirm deletion, type <span className="text-error font-mono select-all font-extrabold">{REQUIRED_TEXT}</span> below:
                  </label>
                  <input
                    type="text"
                    required
                    value={typedConfirmation}
                    onChange={(e) => setTypedConfirmation(e.target.value)}
                    placeholder="Type RESET PLACEMENT DATA"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-error transition font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-primary">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={executingReset}
                    className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 transition text-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={typedConfirmation !== REQUIRED_TEXT || executingReset}
                    className="px-5 py-2 bg-error hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded flex items-center gap-2 transition cursor-pointer shadow-lg"
                  >
                    {executingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Erasing Placement Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Permanently Erase Placement Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Reset Success Summary */
            <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-text-primary">Placement Data Reset Complete</h4>
                <p className="text-xs text-text-muted mt-1">All business entity records have been removed and local files cleaned up.</p>
              </div>

              <div className="bg-background-secondary p-4 rounded-lg border border-border-primary text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between py-1 border-b border-border-primary">
                  <span className="text-text-muted">Students Removed:</span>
                  <span className="font-extrabold text-text-primary">{resetResult.studentsRemoved ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-primary">
                  <span className="text-text-muted">Companies Removed:</span>
                  <span className="font-extrabold text-text-primary">{resetResult.companiesRemoved ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-primary">
                  <span className="text-text-muted">Jobs &amp; JDs Removed:</span>
                  <span className="font-extrabold text-text-primary">{resetResult.jobsRemoved ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-primary">
                  <span className="text-text-muted">Drives &amp; Placements Removed:</span>
                  <span className="font-extrabold text-text-primary">{(resetResult.drivesRemoved ?? 0) + (resetResult.placementsRemoved ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-primary">
                  <span className="text-text-muted">ATS Analyses Removed:</span>
                  <span className="font-extrabold text-text-primary">{resetResult.atsAnalysesRemoved ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 text-success font-bold font-sans">
                  <span>System Users Preserved:</span>
                  <span>{resetResult.systemUsersPreserved ?? 0} Users Active</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 transition cursor-pointer"
              >
                Done &amp; Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
