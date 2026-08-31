import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useJobStore } from '../store/jobStore';
import { useCompanyStore } from '../store/companyStore';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, FileText, ArrowRight, Check, X, Loader2, Upload, HelpCircle, Edit, RefreshCw, Users } from 'lucide-react';
import DriveManagementModal from '../components/DriveManagementModal';
import JdPdfViewerModal from '../components/JdPdfViewerModal';

export default function JobsPage() {
  const { jobs, fetchJobs, createJob, forwardJob, reviewJob, extractJd } = useJobStore();
  const { companies, fetchCompanies } = useCompanyStore();
  const { user: authUser, hasPermission } = useAuthStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // JD PDF View Modal state
  const [jdPdfModalOpen, setJdPdfModalOpen] = useState(false);
  const [activeJdPdfUrl, setActiveJdPdfUrl] = useState<string | null>(null);
  const [activeJdTitle, setActiveJdTitle] = useState('');
  const [activeJdCompanyName, setActiveJdCompanyName] = useState('');
  const [activeJdText, setActiveJdText] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchJobs({ search, status, page, limit: 10 });
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Drawer control
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [ctc, setCtc] = useState(6.0);
  const [location, setLocation] = useState('');
  const [jdPdf, setJdPdf] = useState<File | null>(null);
  
  // Extraction states
  const [extracting, setExtracting] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Drive Candidates Modal control
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [activeDriveJob, setActiveDriveJob] = useState<any>(null);

  // Approval Comment Modal control
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [approveAction, setApproveAction] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchJobs({ search, status, page, limit: 10 });
    fetchCompanies({ page: 1, limit: 100 }); // Load all companies for dropdown
  }, [search, status, page]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJdPdf(file);
    setExtracting(true);

    try {
      const data = await extractJd(file);
      const ext = data.extracted;
      
      // Auto-fill fields from Gemini response
      if (ext.jobTitle) setJobTitle(ext.jobTitle);
      if (ext.location) setLocation(ext.location);
      if (ext.ctc) setCtc(ext.ctc);
      
      // Build structured text
      let text = `Required Skills: ${ext.requiredSkills.join(', ')}\n\n`;
      text += `Preferred Skills: ${ext.preferredSkills.join(', ')}\n\n`;
      text += `Education: ${ext.education}\nExperience: ${ext.experience}\n\n`;
      text += `Responsibilities:\n${ext.responsibilities.map((r: string) => `- ${r}`).join('\n')}`;
      
      setJdText(text);
    } catch (err) {
      alert('Failed to parse JD PDF using Gemini AI. Please insert details manually.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await createJob({
        companyId,
        jobTitle,
        jdText,
        ctc: Number(ctc),
        location,
      });
      setDrawerOpen(false);
      // Reset
      setCompanyId('');
      setJobTitle('');
      setJdText('');
      setCtc(6.0);
      setLocation('');
      setJdPdf(null);
      fetchJobs({ page: 1 });
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleForward = async (id: string) => {
    if (!confirm('Forward this placement opportunity to Admin governance for review?')) return;
    try {
      await forwardJob(id);
      fetchJobs({ page });
    } catch (err: any) {
      alert(err.message || 'Forward failed');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;

    setReviewLoading(true);
    try {
      await reviewJob(activeJobId, approveAction, reviewComment);
      setReviewOpen(false);
      setReviewComment('');
      setActiveJobId(null);
      fetchJobs({ page });
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const isAdmin = authUser?.roleName === 'ADMIN';
  const isLead = authUser?.roleName === 'LEAD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Jobs</h1>
          <p className="text-xs text-text-muted mt-1">Author specifications, match candidates, and track job opening approvals.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded bg-surface-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {hasPermission('JOB_CREATE') && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary hover:brightness-110 text-white text-xs font-semibold rounded glow-primary transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create job opening</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-1 p-4 rounded border border-border-primary flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 border border-border-primary rounded text-xs outline-none bg-background-secondary focus:border-primary text-text-primary transition"
            placeholder="Search job title, company name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Jobs list table */}
      <div className="bg-surface-1 rounded border border-border-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">CTC (LPA)</th>
                <th className="px-6 py-4 text-center">Pipeline Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary text-sm text-text-secondary">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted font-medium">
                    No placement job openings registered.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-2/40 transition duration-150">
                    <td className="px-6 py-4 font-semibold text-text-primary">{job.jobTitle}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-text-muted">{job.company.name}</td>
                    <td className="px-6 py-4 text-xs font-medium">{job.location}</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{job.ctc} LPA</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end gap-2">
                      {/* Render JD PDF Button */}
                      <button
                        onClick={() => {
                          setActiveJdTitle(job.jobTitle);
                          setActiveJdCompanyName(job.company.name);
                          setActiveJdPdfUrl(job.jdPdfUrl || job.jdLink || null);
                          setActiveJdText(job.jdText || null);
                          setJdPdfModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-primary text-white text-xs font-bold rounded transition cursor-pointer border-0 shadow-sm hover:brightness-110"
                        title="Render Attached JD PDF (Google Drive Link)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>JD PDF</span>
                      </button>

                      {/* Drive Candidates Management Button */}
                      <button
                        onClick={() => {
                          setActiveDriveJob(job);
                          setDriveModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded transition cursor-pointer"
                        title="Manage Registered Candidates & Drive Pipeline"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Drive Candidates</span>
                      </button>

                      {/* Draft forward action */}
                      {job.status === 'DRAFT' && isLead && (
                        <button
                          onClick={() => handleForward(job.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline hover:text-primary-hover cursor-pointer"
                        >
                          <span>Forward to Admin</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Admin review action */}
                      {job.status === 'PENDING_APPROVAL' && isAdmin && (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              setActiveJobId(job.id);
                              setApproveAction(true);
                              setReviewComment('');
                              setReviewOpen(true);
                            }}
                            className="bg-success/10 text-success hover:bg-success/20 border border-success/20 px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveJobId(job.id);
                              setApproveAction(false);
                              setReviewComment('');
                              setReviewOpen(true);
                            }}
                            className="bg-error/10 text-error hover:bg-error/20 border border-error/20 px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Side Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-surface border-l border-border shadow-2xl flex flex-col justify-between">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-base font-extrabold text-text">Post Placement Opportunity</h2>
                <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* PDF JD upload to trigger Gemini extraction */}
                <div className="border border-dashed border-border p-4 rounded-xl text-center space-y-3 bg-slate-50/50 relative">
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handlePdfUpload}
                    disabled={extracting}
                  />
                  {extracting ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <div className="text-xs font-bold text-primary">Gemini extracting job specifications...</div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-secondary mx-auto" />
                      <div className="text-xs font-bold text-text">
                        {jdPdf ? jdPdf.name : 'Upload JD PDF to autofill via Gemini AI'}
                      </div>
                      <div className="text-[10px] text-secondary">Automatically parses skills, responsibilities, and details.</div>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Select Corporate Partner</label>
                  <select
                    required
                    className="w-full h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                  >
                    <option value="">Choose Company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Job Role / Designation</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    placeholder="e.g. Graduate Engineer Trainee"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">CTC Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                      value={ctc}
                      onChange={(e) => setCtc(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Job Location</label>
                    <input
                      type="text"
                      required
                      className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                      placeholder="e.g. Bangalore"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Job Description Details (JD)</label>
                  <textarea
                    required
                    className="w-full p-3 border border-border rounded-lg text-xs outline-none focus:border-primary h-36 resize-none bg-background text-text"
                    placeholder="Type responsibilities, academic criteria, and skill requirements..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-2.5 border border-border text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !companyId}
                    className="px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition"
                  >
                    {createLoading ? 'Posting...' : 'Post Opportunity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approval Comment Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface max-w-md w-full rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-slate-50/50">
              <h3 className="font-extrabold text-text">
                {approveAction ? 'Approve Opportunity' : 'Reject Opportunity'}
              </h3>
              <button onClick={() => setReviewOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Review Comment / Remarks
                </label>
                <textarea
                  className="w-full p-3 border border-border rounded-lg text-xs outline-none focus:border-primary h-24 resize-none bg-background text-text"
                  placeholder="Insert notes for the placement team (optional)..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition ${
                    approveAction ? 'bg-success hover:bg-success-hover' : 'bg-error hover:bg-error-hover'
                  }`}
                >
                  {reviewLoading ? 'Reviewing...' : approveAction ? 'Approve & Publish' : 'Reject Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Drive Candidates Management Dashboard Modal */}
      <DriveManagementModal
        isOpen={driveModalOpen}
        job={activeDriveJob}
        onClose={() => {
          setDriveModalOpen(false);
          fetchJobs({ page });
        }}
      />

      {/* JD PDF Viewer Modal */}
      <JdPdfViewerModal
        isOpen={jdPdfModalOpen}
        onClose={() => setJdPdfModalOpen(false)}
        title={activeJdTitle}
        companyName={activeJdCompanyName}
        pdfUrl={activeJdPdfUrl}
        jdText={activeJdText}
      />
    </div>
  );
}
