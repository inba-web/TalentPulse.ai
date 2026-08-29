import React, { useEffect, useState } from 'react';
import { useCompanyStore } from '../store/companyStore';
import StatusBadge from '../components/StatusBadge';
import { Search, Plus, MapPin, Globe, Mail, Phone, X, Check, Loader2, Eye, Edit2, Trash2, Building2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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
        const res = await fetch('/api/companies/industries');
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

  useEffect(() => {
    fetchCompanies({ search, status, page, limit: 10 });
  }, [search, status, page]);

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
      setCreateOpen(false);
      // Reset form
      setName('');
      setWebsite('');
      setIndustry('');
      setContactPerson('');
      setDesignation('');
      setContactEmail('');
      setContactMobile('');
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
                  <StatusBadge status={company.status} />
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
          <div className="bg-surface-1 max-w-2xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>{detailedCompany?.name || 'Company Profile'}</span>
              </h3>
              <button
                onClick={() => setViewOpen(false)}
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
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Location Information */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Office Location & Places Info</h4>
                  <div className="bg-background-secondary p-4 rounded border border-border-primary space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <MapPin className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-text-primary">Corporate Office Address</div>
                        <div className="mt-1 leading-normal">{detailedCompany.exactAddress || 'No verified address resolver records.'}</div>
                      </div>
                    </div>
                    {detailedCompany.mapsUrl && (
                      <a
                        href={detailedCompany.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-bold text-primary hover:underline pl-7"
                      >
                        View coordinates on Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>

                {/* Job Postings and CTCs */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Job Descriptions & CTCs</h4>
                  {!detailedCompany.jobs || detailedCompany.jobs.length === 0 ? (
                    <div className="text-center py-8 bg-background-secondary rounded border border-border-primary text-xs text-text-muted">
                      No active job postings registered for this company.
                    </div>
                  ) : (
                    <div className="border border-border-primary rounded overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-background-tertiary border-b border-border-primary text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="px-4 py-3">Role / Job Title</th>
                            <th className="px-4 py-3 text-center">Average CTC Package</th>
                            <th className="px-4 py-3 text-right">Approval Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                          {detailedCompany.jobs.map((job: any) => (
                            <tr key={job.id} className="hover:bg-surface-2 transition duration-150">
                              <td className="px-4 py-3 font-semibold text-text-primary">{job.jobTitle}</td>
                              <td className="px-4 py-3 text-center font-bold text-success">{job.averageCtc} LPA</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                  job.status === 'APPROVED' 
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-warning/10 border-warning/20 text-warning'
                                }`}>
                                  {job.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
    </div>
  );
}
