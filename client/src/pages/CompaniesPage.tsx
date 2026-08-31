import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { formatImageUrl } from '../utils/formatImageUrl';
import { useCompanyStore } from '../store/companyStore';
import StatusBadge from '../components/StatusBadge';
import { Search, Plus, MapPin, Globe, Mail, Phone, X, Check, Loader2, Eye, Edit2, Trash2, Building2, RefreshCw, FileText, ChevronDown, ChevronUp, Users, Award, Upload } from 'lucide-react';
import DriveManagementModal from '../components/DriveManagementModal';
import JdPdfViewerModal from '../components/JdPdfViewerModal';
import ExcelImportModal from '../components/ExcelImportModal';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { useNavigate } from 'react-router-dom';

export default function CompaniesPage() {
  const { 
    companies, 
    total, 
    loading, 
    fetchCompanies, 
    fetchCompanyById,
    createCompany, 
    updateCompany, 
    deleteCompany, 
    searchLocations, 
    resolveLocation 
  } = useCompanyStore();
  const { hasPermission } = useAuthStore();
  const { extractJd, createJob } = useJobStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [employeeSizeTier, setEmployeeSizeTier] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCompanies({
        search,
        status,
        industry: industryFilter,
        employeeSizeTier,
        page,
        limit: 10,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const res = await apiFetch('/api/companies/industries');
        const result = await res.json();
        if (result.success) {
          setIndustries(result.data);
        }
      } catch (err) {
        console.error('Failed to load industries:', err);
      }
    };
    loadIndustries();
  }, []);

  useEffect(() => {
    fetchCompanies({
      search,
      status,
      industry: industryFilter,
      employeeSizeTier,
      page,
      limit: 10,
    });
  }, [search, status, industryFilter, employeeSizeTier, page]);

  // Excel Import state
  const [excelImportOpen, setExcelImportOpen] = useState(false);

  // Creation form state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [employeeSize, setEmployeeSize] = useState(100);
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [opStatus, setOpStatus] = useState('COLD');
  const [createLoading, setCreateLoading] = useState(false);

  // Company JD PDF upload & AI extraction state
  const [companyJdPdf, setCompanyJdPdf] = useState<File | null>(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [createJobTitle, setCreateJobTitle] = useState('');
  const [createCtc, setCreateCtc] = useState(6.0);
  const [createLocation, setCreateLocation] = useState('');
  const [createJdText, setCreateJdText] = useState('');

  // Edit form state
  const [editOpen, setEditOpen] = useState(false);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editEmployeeSize, setEditEmployeeSize] = useState(100);
  const [editIndustry, setEditIndustry] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactMobile, setEditContactMobile] = useState('');
  const [editOpStatus, setEditOpStatus] = useState('COLD');
  const [editLoading, setEditLoading] = useState(false);

  // Detail View State
  const [viewOpen, setViewOpen] = useState(false);
  const [detailedCompany, setDetailedCompany] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Location Resolution State
  const [resolveOpen, setResolveOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationCandidates, setLocationCandidates] = useState<any[]>([]);
  const [resolvingLoading, setResolvingLoading] = useState(false);

  // Company JD candidates state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobCandidates, setJobCandidates] = useState<Record<string, any[]>>({});
  const [jobCandidatesLoading, setJobCandidatesLoading] = useState<Record<string, boolean>>({});

  // JD Upload + Evaluate state (within company detail)
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdEvaluating, setJdEvaluating] = useState(false);
  const [jdResults, setJdResults] = useState<any[]>([]);
  const [jdError, setJdError] = useState('');
  const [jdResultsExpanded, setJdResultsExpanded] = useState(false);

  // Drive Modal state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [activeDriveJob, setActiveDriveJob] = useState<any>(null);

  // Job JD edit state (edit jdText per job in view modal)
  const [editJdJobId, setEditJdJobId] = useState<string | null>(null);
  const [editJdText, setEditJdText] = useState('');
  const [editJdSaving, setEditJdSaving] = useState(false);

  // JD PDF View Modal state
  const [jdPdfModalOpen, setJdPdfModalOpen] = useState(false);
  const [activeJdPdfUrl, setActiveJdPdfUrl] = useState<string | null>(null);
  const [activeJdTitle, setActiveJdTitle] = useState('');
  const [activeJdCompanyName, setActiveJdCompanyName] = useState('');
  const [activeJdText, setActiveJdText] = useState<string | null>(null);

  const handleEvaluateJd = async () => {
    setJdEvaluating(true);
    setJdError('');
    setJdResults([]);
    try {
      let res: Response;
      if (jdFile) {
        const fd = new FormData();
        fd.append('file', jdFile);
        if (jdText.trim()) fd.append('jdText', jdText);
        res = await apiFetch('/api/ats/jd/analyze', { method: 'POST', body: fd });
      } else {
        res = await apiFetch('/api/ats/jd/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jdText }),
        });
      }
      const result = await res.json();
      if (result.success) {
        setJdResults(result.data || []);
        setJdResultsExpanded(true);
      } else {
        setJdError(result.error?.message || 'Evaluation failed.');
      }
    } catch (err: any) {
      setJdError(err.message || 'Network error during evaluation.');
    } finally {
      setJdEvaluating(false);
    }
  };

  const handleSaveJobJd = async (jobId: string) => {
    setEditJdSaving(true);
    try {
      const res = await apiFetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText: editJdText }),
      });
      const result = await res.json();
      if (result.success && detailedCompany) {
        // Update the local jobs list
        setDetailedCompany((prev: any) => ({
          ...prev,
          jobs: prev.jobs.map((j: any) => j.id === jobId ? { ...j, jdText: editJdText } : j),
        }));
      }
      setEditJdJobId(null);
    } catch (err) {
      console.error('Failed to save JD text:', err);
    } finally {
      setEditJdSaving(false);
    }
  };

  const handleDeleteJobJd = async (jobId: string) => {
    if (!confirm('Clear the JD text for this job?')) return;
    const res = await apiFetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdText: '' }),
    });
    const result = await res.json();
    if (result.success && detailedCompany) {
      setDetailedCompany((prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((j: any) => j.id === jobId ? { ...j, jdText: '' } : j),
      }));
    }
  };

  const fetchJobCandidates = async (jobId: string) => {
    if (jobCandidates[jobId]) {
      setExpandedJobId(prev => prev === jobId ? null : jobId);
      return;
    }
    setExpandedJobId(jobId);
    setJobCandidatesLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await apiFetch(`/api/ats/jobs/${jobId}/candidates`);
      const result = await res.json();
      if (result.success) {
        setJobCandidates(prev => ({ ...prev, [jobId]: result.data || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch job candidates:', err);
    } finally {
      setJobCandidatesLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  useEffect(() => {
    fetchCompanies({ search, status, page, limit: 10 });
  }, [search, status, page]);

  const handleCompanyPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompanyJdPdf(file);
    setPdfExtracting(true);

    try {
      const data = await extractJd(file);
      const ext = data.extracted;

      if (ext.jobTitle) {
        setCreateJobTitle(ext.jobTitle);
        if (!designation) setDesignation(ext.jobTitle);
      }
      if (ext.location) setCreateLocation(ext.location);
      if (ext.ctc) setCreateCtc(ext.ctc);

      let text = `Required Skills: ${ext.requiredSkills.join(', ')}\n\n`;
      text += `Preferred Skills: ${ext.preferredSkills.join(', ')}\n\n`;
      text += `Education: ${ext.education}\nExperience: ${ext.experience}\n\n`;
      text += `Responsibilities:\n${ext.responsibilities.map((r: string) => `- ${r}`).join('\n')}`;

      setCreateJdText(text);
    } catch (err) {
      alert('Failed to parse Company JD PDF using Gemini AI. Details can be entered manually.');
    } finally {
      setPdfExtracting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await createCompany({
        name,
        website: website || null,
        employeeSize: Number(employeeSize),
        industry: industry || null,
        contactPerson,
        designation,
        contactEmail,
        contactMobile,
        status: opStatus,
      });

      // Automatically create the job opening if JD PDF or JD info is attached!
      if (createJobTitle || createJdText) {
        try {
          const res = await apiFetch(`/api/companies?search=${encodeURIComponent(name)}`);
          const resData = await res.json();
          const createdComp = resData.data?.companies?.[0];
          if (createdComp?.id) {
            await createJob({
              companyId: createdComp.id,
              jobTitle: createJobTitle || designation || 'Graduate Engineer Trainee',
              jdText: createJdText || `Job Opportunity at ${name}`,
              ctc: Number(createCtc) || 6.0,
              location: createLocation || 'India',
            });
          }
        } catch (jErr) {
          console.error('Job auto-creation notice:', jErr);
        }
      }

      setCreateOpen(false);
      // Reset form
      setName('');
      setWebsite('');
      setIndustry('');
      setContactPerson('');
      setDesignation('');
      setContactEmail('');
      setContactMobile('');
      setCompanyJdPdf(null);
      setCreateJobTitle('');
      setCreateCtc(6.0);
      setCreateLocation('');
      setCreateJdText('');
      fetchCompanies({ page: 1 });
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewCompany = async (companyId: string) => {
    setViewOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchCompanyById(companyId);
      setDetailedCompany(data);
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (company: any) => {
    setActiveEditId(company.id);
    setEditName(company.name);
    setEditWebsite(company.website || '');
    setEditEmployeeSize(company.employeeSize || 100);
    setEditIndustry(company.industry || '');
    setEditContactPerson(company.contactPerson);
    setEditDesignation(company.designation);
    setEditContactEmail(company.contactEmail);
    setEditContactMobile(company.contactMobile);
    setEditOpStatus(company.status);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditId) return;
    setEditLoading(true);
    try {
      await updateCompany(activeEditId, {
        name: editName,
        website: editWebsite || null,
        employeeSize: Number(editEmployeeSize),
        industry: editIndustry || null,
        contactPerson: editContactPerson,
        designation: editDesignation,
        contactEmail: editContactEmail,
        contactMobile: editContactMobile,
        status: editOpStatus,
      });
      setEditOpen(false);
      fetchCompanies({ page });
    } catch (err: any) {
      alert(err.message || 'Edit failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company? This will delete all jobs associated with it.')) return;
    try {
      await deleteCompany(companyId);
      fetchCompanies({ page: 1 });
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleSearchLocations = async () => {
    if (!activeCompanyId || !cityQuery) return;
    setSearchLoading(true);
    setLocationCandidates([]);
    
    const company = companies.find((c) => c.id === activeCompanyId);
    if (!company) return;

    try {
      const results = await searchLocations(company.name, cityQuery);
      setLocationCandidates(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConfirmLocation = async (placeId: string) => {
    if (!activeCompanyId) return;
    setResolvingLoading(true);
    try {
      await resolveLocation(activeCompanyId, placeId);
      setResolveOpen(false);
      fetchCompanies({ page });
    } catch (err: any) {
      alert(err.message || 'Resolution failed');
    } finally {
      setResolvingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Companies</h1>
          <p className="text-xs text-text-muted mt-1">Manage corporate recruitment partners and locations.</p>
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
          {hasPermission('COMPANY_CREATE') && (
            <button
              onClick={() => setExcelImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-primary text-text-primary text-xs font-semibold rounded bg-surface-1 hover:bg-surface-2 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Import Excel</span>
            </button>
          )}
          {hasPermission('COMPANY_CREATE') && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary hover:brightness-110 text-white text-xs font-semibold rounded glow-primary border-0 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create company account</span>
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
            placeholder="Search company name, industry, recruiter..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Pipelines</option>
            <option value="COLD">Cold</option>
            <option value="WARM">Warm</option>
            <option value="HOT">Hot</option>
            <option value="DRIVE_COMPLETED">Drive Completed</option>
          </select>

          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={employeeSizeTier}
            onChange={(e) => {
              setEmployeeSizeTier(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Sizes</option>
            <option value="SMALL">Small (&lt;50)</option>
            <option value="MEDIUM">Medium (50-250)</option>
            <option value="LARGE">Large (251-1000)</option>
            <option value="ENTERPRISE">Enterprise (&gt;1000)</option>
          </select>
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading && companies.length === 0 ? (
        <div className="text-center py-16 text-text-muted font-medium animate-pulse">Loading company catalog...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-text-muted font-medium">No company records matching your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`bg-surface-1 p-6 rounded border transition duration-200 flex flex-col justify-between ${
                company.status === 'HOT'
                  ? 'border-warning/30 hover:border-warning/50 glow-action'
                  : 'border-border-primary hover:border-border-hover'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-text-primary text-base leading-tight">{company.name}</h3>
                    <div className="text-xs text-text-muted font-medium">{company.industry || 'Corporate Partner'}</div>
                  </div>
                  {hasPermission('COMPANY_UPDATE') ? (
                    <select
                      value={company.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          await updateCompany(company.id, { status: newStatus as any });
                          fetchCompanies({ page, limit: 10, search, status, industry: industryFilter, employeeSizeTier });
                        } catch (err: any) {
                          alert(err.message || 'Company status update failed');
                        }
                      }}
                      className="px-2.5 py-1 bg-surface-2 border border-border-primary rounded text-xs font-bold text-text-primary outline-none cursor-pointer focus:border-primary hover:border-border-hover transition"
                    >
                      <option value="COLD">Cold</option>
                      <option value="WARM">Warm</option>
                      <option value="HOT">Hot</option>
                      <option value="DRIVE_COMPLETED">Drive Completed</option>
                    </select>
                  ) : (
                    <StatusBadge status={company.status} />
                  )}
                </div>

                {/* Location resolver check */}
                <div className="pt-2 border-t border-border-primary space-y-2">
                  <div className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                    <MapPin className="w-4.5 h-4.5 text-text-disabled mt-0.5 flex-shrink-0" />
                    {company.exactAddress ? (
                      <span className="font-medium text-text-secondary">{company.exactAddress}</span>
                    ) : (
                      <span className="italic text-text-disabled">Address not resolved.</span>
                    )}
                  </div>
                  
                  {company.mapsUrl && (
                    <a
                      href={company.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[10px] font-bold text-primary hover:underline gap-1 pl-6"
                    >
                      View on Google Maps
                    </a>
                  )}

                  {!company.exactAddress && hasPermission('COMPANY_CREATE') && (
                    <button
                      onClick={() => {
                        setActiveCompanyId(company.id);
                        setCityQuery('');
                        setLocationCandidates([]);
                        setResolveOpen(true);
                      }}
                      className="inline-flex items-center text-[10px] font-bold text-primary hover:underline gap-1 pl-6 cursor-pointer"
                    >
                      Resolve location via Google Places
                    </button>
                  )}
                </div>

                {/* Contact info */}
                <div className="pt-3 border-t border-border-primary space-y-2 text-xs">
                  <div className="font-semibold text-text-primary">{company.contactPerson} ({company.designation})</div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span className="truncate">{company.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <span>{company.contactMobile}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border-primary">
                <button
                  onClick={() => handleViewCompany(company.id)}
                  className="flex-1 h-9 bg-surface-2 hover:bg-surface-3 border border-border-primary text-text-primary rounded text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>View Jobs & location</span>
                </button>
                {hasPermission('COMPANY_UPDATE') && (
                  <button
                    onClick={() => handleOpenEdit(company)}
                    className="w-9 h-9 flex items-center justify-center bg-surface-2 hover:bg-surface-3 border border-border-primary text-text-primary hover:text-primary rounded transition cursor-pointer"
                    title="Edit Company"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {hasPermission('COMPANY_DELETE') && (
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="w-9 h-9 flex items-center justify-center bg-surface-2 hover:bg-surface-3 border border-border-primary text-error hover:bg-error/10 rounded transition cursor-pointer"
                    title="Delete Company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {viewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface-1 max-w-3xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>{detailedCompany?.name || 'Company Profile'}</span>
              </h3>
              <button
                onClick={() => { setViewOpen(false); setExpandedJobId(null); setJdResults([]); setJdText(''); setJdFile(null); setEditJdJobId(null); }}
                className="p-1 hover:bg-surface-2 rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="text-center py-16 text-text-muted">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <span>Fetching company records and active JDs...</span>
              </div>
            ) : !detailedCompany ? (
              <div className="text-center py-16 text-error">Failed to load detailed profile.</div>
            ) : (
              <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">

                {/* ─── JD Upload + Evaluate Section ─── */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload JD &amp; Evaluate Candidates</span>
                  </h4>
                  <div className="bg-background-secondary border border-border-primary rounded p-4 space-y-3">
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 text-xs border border-border-primary rounded bg-background-tertiary text-text-primary placeholder-text-disabled focus:border-primary outline-none transition resize-none font-mono"
                      placeholder="Paste Job Description text here... (or upload a PDF below)"
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <label className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-primary rounded text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover cursor-pointer transition">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>{jdFile ? jdFile.name : 'Upload JD PDF'}</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => setJdFile(e.target.files?.[0] || null)} />
                      </label>
                      {jdFile && (
                        <button onClick={() => setJdFile(null)} className="text-[10px] text-error font-bold hover:underline cursor-pointer border-0 bg-transparent">
                          Remove PDF
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={handleEvaluateJd}
                        disabled={jdEvaluating || (!jdText.trim() && !jdFile)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white text-xs font-bold rounded border-0 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                      >
                        {jdEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                        <span>{jdEvaluating ? 'Evaluating...' : 'Evaluate Against All Candidates'}</span>
                      </button>
                    </div>
                    {jdError && <div className="text-xs text-error font-semibold">{jdError}</div>}
                  </div>

                  {/* JD Results */}
                  {jdResults.length > 0 && (
                    <div className="border border-border-primary rounded overflow-hidden">
                      <div className="bg-background-secondary px-4 py-2.5 flex items-center justify-between border-b border-border-primary">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Candidate Rankings — {jdResults.length} candidates evaluated</span>
                        </div>
                        <button onClick={() => setJdResultsExpanded(p => !p)} className="text-[10px] text-primary font-bold cursor-pointer border-0 bg-transparent hover:underline">
                          {jdResultsExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      {jdResultsExpanded && (
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-background-tertiary">
                              <tr className="text-[10px] font-bold text-text-muted uppercase border-b border-border-primary">
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">Candidate</th>
                                <th className="px-3 py-2">Dept</th>
                                <th className="px-3 py-2 text-center">ATS Score</th>
                                <th className="px-3 py-2">Matched Skills</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-primary">
                              {jdResults.map((c: any, i: number) => (
                                <tr key={c.studentId} className="hover:bg-surface-2 text-xs">
                                  <td className="px-3 py-2 font-bold text-text-muted">{i + 1}</td>
                                  <td className="px-3 py-2">
                                    <div className="font-semibold text-text-primary">{c.fullName}</div>
                                    <div className="text-[10px] text-text-muted font-mono">{c.rollNumber}</div>
                                  </td>
                                  <td className="px-3 py-2 text-text-secondary">{c.department}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`font-extrabold text-sm ${
                                      c.atsScore >= 70 ? 'text-success' : c.atsScore >= 50 ? 'text-warning' : 'text-error'
                                    }`}>{c.atsScore}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {(c.matchedSkills || []).slice(0, 3).map((s: string) => (
                                        <span key={s} className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded font-bold uppercase">{s}</span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── Office Location ─── */}
                {(() => {
                  const VERIFIED_COMPANY_LOCATIONS: Record<string, { address: string; mapsUrl: string }> = {
                    'zoho': {
                      address: 'Estancia IT Park, Plot No. 140 & 151, GST Road, Vallanchery, Guduvancheri, Chennai, Tamil Nadu 603202, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Zoho+Corporation+Estancia+IT+Park+GST+Road+Guduvancheri',
                    },
                    'google': {
                      address: 'Block 1, Divyasree Omega, Survey No 13, Kothaguda, Hitec City, Kondapur, Hyderabad, Telangana 500084, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Google+India+Kothaguda+Hitec+City+Hyderabad',
                    },
                    'amazon': {
                      address: 'Amazon Towers, Financial District, Nanakramguda, Gachibowli, Hyderabad, Telangana 500032, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Amazon+Development+Centre+Nanakramguda+Hyderabad',
                    },
                    'aws': {
                      address: 'Amazon Towers, Financial District, Nanakramguda, Gachibowli, Hyderabad, Telangana 500032, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Amazon+Web+Services+Nanakramguda+Hyderabad',
                    },
                    'cisco': {
                      address: 'SEZ Unit, Cessna Business Park, Kadubeesanahalli, Varthur Hobli, Outer Ring Road, Bengaluru, Karnataka 560103, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cisco+Systems+Cessna+Business+Park+Bengaluru',
                    },
                    'microsoft': {
                      address: 'Building 3, Microsoft Campus, Gachibowli, Hyderabad, Telangana 500032, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Microsoft+India+Campus+Gachibowli+Hyderabad',
                    },
                    'tata': {
                      address: 'TCS House, Raveline Street, Fort, Mumbai, Maharashtra 400001, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tata+Consultancy+Services+TCS+House+Fort+Mumbai',
                    },
                    'tcs': {
                      address: 'TCS House, Raveline Street, Fort, Mumbai, Maharashtra 400001, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tata+Consultancy+Services+TCS+House+Fort+Mumbai',
                    },
                    'deloitte': {
                      address: 'Building 3, Deloitte Drive, Hitec City, Madhapur, Hyderabad, Telangana 500081, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Deloitte+USI+Hitec+City+Hyderabad',
                    },
                    'hdfc': {
                      address: 'HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=HDFC+Bank+House+Lower+Parel+Mumbai',
                    },
                    'wipro': {
                      address: 'Doddakannelli, Sarjapur Road, Bengaluru, Karnataka 560035, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Wipro+Corporate+Office+Sarjapur+Road+Bengaluru',
                    },
                    'palo alto': {
                      address: 'Prestige Trade Tower, Palace Road, High Grounds, Sampangi Rama Nagar, Bengaluru, Karnataka 560001, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Palo+Alto+Networks+Prestige+Trade+Tower+Bengaluru',
                    },
                    'techgiant': {
                      address: 'Embassy Tech Village, Outer Ring Road, Devarabeesanahalli, Bengaluru, Karnataka 560103, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+Tech+Village+Outer+Ring+Road+Bengaluru',
                    },
                    'innovateai': {
                      address: 'Tidel Park, Module 121, Canal Bank Road, Taramani, Chennai, Tamil Nadu 600113, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tidel+Park+Taramani+Chennai',
                    },
                    'stark': {
                      address: 'Bandra Kurla Complex, Plot C-57, G Block, BKC, Mumbai, Maharashtra 400051, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bandra+Kurla+Complex+Mumbai',
                    },
                    'apex': {
                      address: 'Building 9, Mindspace Cyberabad, Hitec City, Madhapur, Hyderabad, Telangana 500081, India',
                      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mindspace+Hitec+City+Hyderabad',
                    },
                  };

                  let loc = {
                    address: detailedCompany.exactAddress || `${detailedCompany.name} Corporate HQ, India`,
                    mapsUrl: detailedCompany.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailedCompany.name + ' Corporate Office India')}`,
                  };

                  if (!detailedCompany.exactAddress || detailedCompany.exactAddress.includes('Official Campus')) {
                    const key = (detailedCompany.name || '').toLowerCase().trim();
                    for (const [k, v] of Object.entries(VERIFIED_COMPANY_LOCATIONS)) {
                      if (key.includes(k)) {
                        loc = v;
                        break;
                      }
                    }
                  }

                  return (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Office Location &amp; Places Info</h4>
                      <div className="bg-background-secondary p-4 rounded border border-border-primary space-y-2.5">
                        <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-text-primary">{detailedCompany.name} Corporate Headquarters</div>
                            <div className="mt-1 leading-normal text-text-secondary">
                              {loc.address}
                            </div>
                          </div>
                        </div>
                        <a
                          href={loc.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pl-6 cursor-pointer"
                        >
                          <span>View verified location for {detailedCompany.name} on Google Maps</span>
                          <span>&rarr;</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {/* ─── Placed Candidates Roster & Placement Records ─── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-success" />
                      <span>Placed Candidates Roster &amp; Hired Students</span>
                    </h4>
                    <span className="px-2.5 py-1 bg-success/15 border border-success/30 text-success text-[10px] font-extrabold rounded-full">
                      {((detailedCompany as any).placements || []).length} Students Placed
                    </span>
                  </div>

                  {!((detailedCompany as any).placements) || ((detailedCompany as any).placements).length === 0 ? (
                    <div className="bg-background-secondary p-4 rounded border border-border-primary text-center text-xs text-text-muted">
                      No placement offers recorded for {detailedCompany.name} yet.
                    </div>
                  ) : (
                    <div className="border border-border-primary rounded overflow-hidden bg-surface-1 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-background-tertiary">
                          <tr className="text-[10px] font-bold text-text-muted uppercase border-b border-border-primary">
                            <th className="px-4 py-2.5">Student Name</th>
                            <th className="px-4 py-2.5">Roll No &amp; Dept</th>
                            <th className="px-4 py-2.5">Job Designation</th>
                            <th className="px-4 py-2.5 text-center">Package (CTC)</th>
                            <th className="px-4 py-2.5 text-center">Offer Status</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary text-xs">
                          {((detailedCompany as any).placements).map((p: any) => (
                            <tr key={p.id} className="hover:bg-surface-2/60 transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {p.student?.studentPhotoUrl ? (
                                    <img
                                      src={formatImageUrl(p.student.studentPhotoUrl)}
                                      className="w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0"
                                      alt={p.student?.fullName}
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                                      {p.student?.fullName?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-text-primary">{p.student?.fullName}</div>
                                    <div className="text-[10px] text-text-muted">{p.student?.personalEmail || p.student?.collegeEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-mono text-xs font-semibold text-text-primary">{p.student?.rollNumber}</div>
                                <div className="text-[10px] text-text-muted font-medium">{p.student?.department?.name || p.student?.department?.code}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-text-primary">
                                {p.job?.jobTitle || p.jobTitle || 'Software Engineer'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-extrabold text-success text-xs bg-success/10 px-2.5 py-1 rounded border border-success/20">
                                  ₹ {p.ctc || p.job?.ctc || 8.0} LPA
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                  p.status === 'JOINED'
                                    ? 'bg-success/15 border-success/30 text-success'
                                    : 'bg-primary/15 border-primary/30 text-primary'
                                }`}>
                                  {p.status || 'OFFERED'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => navigate(`/students/${p.studentId}`)}
                                  className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[10px] font-bold text-primary transition cursor-pointer"
                                >
                                  View Profile &rarr;
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ─── Job Descriptions with per-job JD edit + Eligible Candidates ─── */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Job Descriptions &amp; Eligible Candidates</h4>
                  {!detailedCompany.jobs || detailedCompany.jobs.length === 0 ? (
                    <div className="text-center py-8 bg-background-secondary rounded border border-border-primary text-xs text-text-muted">
                      No active job postings registered for this company.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detailedCompany.jobs.map((job: any) => (
                        <div key={job.id} className="border border-border-primary rounded overflow-hidden">
                          {/* Job Header */}
                          <div className="bg-background-secondary px-4 py-3 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-text-primary">{job.jobTitle}</div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-success font-bold">{job.averageCtc} LPA</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${
                                  job.status === 'APPROVED'
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-warning/10 border-warning/20 text-warning'
                                }`}>
                                  {job.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setActiveDriveJob({ ...job, company: { name: detailedCompany.name } });
                                  setDriveModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                                title="Manage Drive Candidates"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Manage Drive</span>
                              </button>
                              {/* Render JD PDF button */}
                              <button
                                onClick={() => {
                                  setActiveJdTitle(job.jobTitle);
                                  setActiveJdCompanyName(detailedCompany.name);
                                  setActiveJdPdfUrl(job.jdPdfUrl || job.jdLink || null);
                                  setActiveJdText(job.jdText || null);
                                  setJdPdfModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-gradient-primary text-white text-xs font-bold rounded flex items-center gap-1.5 hover:brightness-110 transition cursor-pointer border-0 shadow-sm"
                                title="Fetch and Render Attached JD PDF (Google Drive Link)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Render JD PDF</span>
                              </button>
                              {/* JD Edit button */}
                              {hasPermission('JOB_UPDATE') && (
                                <button
                                  onClick={() => { setEditJdJobId(job.id); setEditJdText(job.jdText || ''); }}
                                  title="Edit JD text"
                                  className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border-primary hover:border-primary hover:text-primary text-text-muted rounded transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* JD Delete button */}
                              {hasPermission('JOB_UPDATE') && job.jdText && (
                                <button
                                  onClick={() => handleDeleteJobJd(job.id)}
                                  title="Clear JD text"
                                  className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border-primary hover:border-error hover:text-error text-text-muted rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => fetchJobCandidates(job.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded border border-primary/20 transition cursor-pointer"
                              >
                                {jobCandidatesLoading[job.id] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Users className="w-3.5 h-3.5" />
                                )}
                                <span>Eligible</span>
                                {expandedJobId === job.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* JD Edit Inline Form */}
                          {editJdJobId === job.id && (
                            <div className="px-4 py-3 border-t border-border-primary bg-background-secondary space-y-2">
                              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Edit Job Description Text</div>
                              <textarea
                                rows={5}
                                className="w-full px-3 py-2 text-xs border border-border-primary rounded bg-background-tertiary text-text-primary focus:border-primary outline-none transition resize-none font-mono"
                                value={editJdText}
                                onChange={(e) => setEditJdText(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditJdJobId(null)}
                                  className="px-3 py-1.5 border border-border-primary text-text-secondary text-xs font-semibold rounded hover:bg-surface-2 transition cursor-pointer bg-transparent"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveJobJd(job.id)}
                                  disabled={editJdSaving}
                                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded border-0 hover:brightness-110 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  {editJdSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Save JD
                                </button>
                              </div>
                            </div>
                          )}

                          {/* JD Text (read-only view) */}
                          {job.jdText && editJdJobId !== job.id && (
                            <div className="px-4 py-3 border-t border-border-primary">
                              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Job Description</span>
                              </div>
                              <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto bg-background-secondary p-3 rounded border border-border-primary font-mono">
                                {job.jdText}
                              </div>
                            </div>
                          )}

                          {/* Eligible Candidates Table (read-only — no student profile links for LEAD) */}
                          {expandedJobId === job.id && (
                            <div className="px-4 py-3 border-t border-border-primary">
                              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>Eligible Candidates — Ranked by ATS Score</span>
                              </div>
                              {jobCandidatesLoading[job.id] ? (
                                <div className="text-center py-6 text-text-muted">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-1" />
                                  <span className="text-xs">Evaluating resumes...</span>
                                </div>
                              ) : !jobCandidates[job.id] || jobCandidates[job.id].length === 0 ? (
                                <div className="text-center py-6 text-xs text-text-muted">No eligible candidates found for this job opening.</div>
                              ) : (
                                <div className="border border-border-primary rounded overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-background-tertiary text-[10px] font-bold text-text-muted uppercase border-b border-border-primary">
                                        <th className="px-3 py-2">#</th>
                                        <th className="px-3 py-2">Candidate</th>
                                        <th className="px-3 py-2">Dept</th>
                                        <th className="px-3 py-2 text-center">ATS Score</th>
                                        <th className="px-3 py-2">Top Skills</th>
                                        {hasPermission('STUDENT_READ') && <th className="px-3 py-2">Profile</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-primary">
                                      {jobCandidates[job.id].slice(0, 15).map((c: any, i: number) => (
                                        <tr key={c.studentId} className="hover:bg-surface-2 text-xs">
                                          <td className="px-3 py-2 font-bold text-text-muted">{i + 1}</td>
                                          <td className="px-3 py-2">
                                            <div className="font-semibold text-text-primary">{c.fullName}</div>
                                            <div className="text-[10px] text-text-muted font-mono">{c.rollNumber}</div>
                                          </td>
                                          <td className="px-3 py-2 text-text-secondary">{c.department}</td>
                                          <td className="px-3 py-2 text-center">
                                            <span className={`font-extrabold text-sm ${
                                              c.atsScore >= 70 ? 'text-success' : c.atsScore >= 50 ? 'text-warning' : 'text-error'
                                            }`}>{c.atsScore}</span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-1">
                                              {(c.matchedSkills || []).slice(0, 3).map((s: string) => (
                                                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded font-bold uppercase">{s}</span>
                                              ))}
                                            </div>
                                          </td>
                                          {hasPermission('STUDENT_READ') && (
                                            <td className="px-3 py-2">
                                              <a
                                                href={`/students/${c.studentId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] font-bold text-primary hover:underline"
                                              >
                                                View Profile →
                                              </a>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface-1 max-w-lg w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">Create Company Account</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 hover:bg-surface-2 rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Company JD PDF Upload Box */}
              <div className="border border-dashed border-border-primary p-4 rounded-xl text-center space-y-2 bg-background-secondary relative">
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleCompanyPdfUpload}
                  disabled={pdfExtracting}
                />
                {pdfExtracting ? (
                  <div className="flex flex-col items-center gap-2 py-1">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <div className="text-xs font-bold text-primary">Gemini AI parsing Company JD PDF...</div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-primary mx-auto" />
                    <div className="text-xs font-bold text-text-primary">
                      {companyJdPdf ? companyJdPdf.name : 'Upload Company Job Description (JD) PDF'}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Gemini AI will automatically parse designation, package, location, and requirements.
                    </div>
                  </>
                )}
              </div>

              <div className="border-b border-border-primary pb-2 pt-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Company Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    placeholder="e.g. Google India"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Industry Segment</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    placeholder="e.g. Software Service"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Website URL</label>
                <input
                  type="url"
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                  placeholder="https://google.co.in"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Mobile</label>
                  <input
                    type="tel"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    placeholder="10 digit Indian number"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Employee Size</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={employeeSize}
                    onChange={(e) => setEmployeeSize(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pipeline status</label>
                  <select
                    className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={opStatus}
                    onChange={(e) => setOpStatus(e.target.value)}
                  >
                    <option value="COLD">Cold</option>
                    <option value="WARM">Warm</option>
                    <option value="HOT">Hot</option>
                  </select>
                </div>
              </div>

              {/* Job Opening Specifications (autofilled from PDF) */}
              <div className="border-b border-border-primary pb-2 pt-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Placement Job Role Specifications (Extracted from JD PDF)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Job Role / Designation</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    placeholder="e.g. Software Engineer Trainee"
                    value={createJobTitle}
                    onChange={(e) => setCreateJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CTC Package (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={createCtc}
                    onChange={(e) => setCreateCtc(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Job Location</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                  placeholder="e.g. Bangalore / Chennai / Remote"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Job Description Details (JD Text)</label>
                <textarea
                  className="w-full p-3 border border-border-primary rounded text-xs outline-none focus:border-primary h-28 resize-none bg-background-secondary text-text-primary font-mono"
                  placeholder="Job requirements, responsibilities, and criteria..."
                  value={createJdText}
                  onChange={(e) => setCreateJdText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 text-text-secondary transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-gradient-primary text-white text-xs font-semibold rounded hover:brightness-110 disabled:opacity-50 transition glow-primary border-0 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface-1 max-w-lg w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">Edit Company Account</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 hover:bg-surface-2 rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Industry Segment</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Website URL</label>
                <input
                  type="url"
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Mobile</label>
                  <input
                    type="tel"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editContactMobile}
                    onChange={(e) => setEditContactMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Employee Size</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    value={editEmployeeSize}
                    onChange={(e) => setEditEmployeeSize(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pipeline status</label>
                  <select
                    className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={editOpStatus}
                    onChange={(e) => setEditOpStatus(e.target.value)}
                  >
                    <option value="COLD">Cold</option>
                    <option value="WARM">Warm</option>
                    <option value="HOT">Hot</option>
                    <option value="DRIVE_COMPLETED">Drive Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 text-text-secondary transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-gradient-primary text-white text-xs font-semibold rounded hover:brightness-110 disabled:opacity-50 transition glow-primary border-0 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Resolution Dialog */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface-1 max-w-md w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Google Places Resolver</span>
              </h3>
              <button
                onClick={() => setResolveOpen(false)}
                className="p-1 hover:bg-surface-2 rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Search City / Landmark</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 h-10 px-3 border border-border-primary rounded text-xs outline-none focus:border-primary bg-background-secondary text-text-primary transition"
                    placeholder="e.g. Whitefield Bangalore"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                  />
                  <button
                    onClick={handleSearchLocations}
                    disabled={!cityQuery || searchLoading}
                    className="px-4 bg-gradient-primary text-white text-xs font-semibold rounded hover:brightness-110 disabled:opacity-50 transition glow-primary border-0 cursor-pointer animate-none"
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Candidates list */}
              {locationCandidates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-text-muted uppercase">Candidate Address Matches</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {locationCandidates.map((item) => (
                      <button
                        key={item.placeId}
                        disabled={resolvingLoading}
                        onClick={() => handleConfirmLocation(item.placeId)}
                        className="w-full text-left p-3 rounded border border-border-primary hover:bg-surface-2 text-xs transition duration-150 text-text-secondary hover:text-text-primary bg-background-secondary cursor-pointer"
                      >
                        <div className="font-bold text-text-primary mb-0.5">{item.name}</div>
                        <div className="text-text-muted leading-normal">{item.formattedAddress}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Drive Student Management Dashboard Modal */}
      <DriveManagementModal
        isOpen={driveModalOpen}
        job={activeDriveJob}
        onClose={() => setDriveModalOpen(false)}
      />

      {/* Excel Company Import Modal */}
      <ExcelImportModal
        isOpen={excelImportOpen}
        onClose={() => setExcelImportOpen(false)}
        onSuccess={() => fetchCompanies({ page: 1 })}
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
