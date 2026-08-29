import React, { useEffect, useState } from 'react';
import { useCompanyStore } from '../store/companyStore';
import StatusBadge from '../components/StatusBadge';
import { Search, Plus, MapPin, Globe, Mail, Phone, X, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CompaniesPage() {
  const { companies, total, loading, fetchCompanies, createCompany, searchLocations, resolveLocation } = useCompanyStore();
  const { hasPermission } = useAuthStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

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

  // Location Resolution State
  const [resolveOpen, setResolveOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
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

  const handleSearchLocations = async () => {
    if (!activeCompanyId || !cityQuery) return;
    setSearchLoading(true);
    setCandidates([]);
    
    // Find active company name
    const company = companies.find((c) => c.id === activeCompanyId);
    if (!company) return;

    try {
      const results = await searchLocations(company.name, cityQuery);
      setCandidates(results);
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
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Placement Company Accounts</h1>
          <p className="text-sm text-secondary font-medium">Manage corporate relationship pipeline and locations.</p>
        </div>
        
        {hasPermission('COMPANY_CREATE') && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg shadow shadow-primary/10 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create company account</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 border border-border rounded-lg text-xs outline-none bg-background focus:border-primary transition"
            placeholder="Search company name, industry, recruiter..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            className="h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
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
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading && companies.length === 0 ? (
        <div className="text-center py-16 text-secondary font-medium animate-pulse">Loading company catalog...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-secondary font-medium">No company records matching your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-text text-base leading-tight">{company.name}</h3>
                    <div className="text-xs text-secondary font-medium">{company.industry || 'Corporate Partner'}</div>
                  </div>
                  <StatusBadge status={company.status} />
                </div>

                {/* Location resolver check */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-secondary leading-relaxed">
                    <MapPin className="w-4.5 h-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    {company.exactAddress ? (
                      <span className="font-medium text-text">{company.exactAddress}</span>
                    ) : (
                      <span className="italic text-slate-400">Address not resolved.</span>
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
                        setCandidates([]);
                        setResolveOpen(true);
                      }}
                      className="inline-flex items-center text-[10px] font-bold text-primary hover:underline gap-1 pl-6 cursor-pointer"
                    >
                      Resolve location via Google Places
                    </button>
                  )}
                </div>

                {/* Contact info */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="font-semibold text-text">{company.contactPerson} ({company.designation})</div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{company.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Phone className="w-4 h-4" />
                    <span>{company.contactMobile}</span>
                  </div>
                </div>
              </div>

              {company.website && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-slate-50 transition duration-150 text-xs font-bold text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Visit Website</span>
                    </span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface max-w-lg w-full rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-slate-50/50">
              <h3 className="font-extrabold text-text">Create Company Account</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    placeholder="e.g. Google India"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Industry Segment</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    placeholder="e.g. Software Service"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Website URL</label>
                <input
                  type="url"
                  className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                  placeholder="https://google.co.in"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Contact Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Contact Mobile</label>
                  <input
                    type="tel"
                    required
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    placeholder="10 digit Indian number"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Employee Size</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    value={employeeSize}
                    onChange={(e) => setEmployeeSize(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Pipeline status</label>
                  <select
                    className="w-full h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
                    value={opStatus}
                    onChange={(e) => setOpStatus(e.target.value)}
                  >
                    <option value="COLD">Cold</option>
                    <option value="WARM">Warm</option>
                    <option value="HOT">Hot</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Resolution Dialog */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface max-w-md w-full rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-slate-50/50">
              <h3 className="font-extrabold text-text flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Google Places Resolver</span>
              </h3>
              <button onClick={() => setResolveOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Search City / Landmark</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 h-10 px-3 border border-border rounded-lg text-xs outline-none focus:border-primary bg-background text-text"
                    placeholder="e.g. Whitefield Bangalore"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                  />
                  <button
                    onClick={handleSearchLocations}
                    disabled={!cityQuery || searchLoading}
                    className="px-4 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition cursor-pointer"
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Candidates list */}
              {candidates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-secondary uppercase">Candidate Address Matches</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {candidates.map((item) => (
                      <button
                        key={item.placeId}
                        disabled={resolvingLoading}
                        onClick={() => handleConfirmLocation(item.placeId)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-slate-50 text-xs transition duration-150"
                      >
                        <div className="font-bold text-text mb-0.5">{item.name}</div>
                        <div className="text-secondary leading-normal">{item.formattedAddress}</div>
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
