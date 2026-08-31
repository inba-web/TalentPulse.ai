import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { formatImageUrl } from '../utils/formatImageUrl';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { useJobStore } from '../store/jobStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Award,
  DollarSign,
  Layers,
  Activity,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Building2,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { jobs, fetchJobs } = useJobStore();
  const { user: authUser } = useAuthStore();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Modal & Roster states
  const [activeModal, setActiveModal] = useState<'PLACED' | 'UNPLACED' | 'ELIGIBLE' | 'HIGHEST' | 'COMPANY' | null>(null);
  const [modalCompanyData, setModalCompanyData] = useState<any>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [placementsReport, setPlacementsReport] = useState<any>(null);
  const [placementsLoading, setPlacementsLoading] = useState(false);

  // Modal Filter, Search & Pagination states
  const [modalSearch, setModalSearch] = useState('');
  const [ctcTierFilter, setCtcTierFilter] = useState<'ALL' | 'TOP_20' | 'MID_10_20' | 'UNDER_10'>('ALL');
  const [modalPage, setModalPage] = useState(1);

  useEffect(() => {
    setModalPage(1);
  }, [activeModal, modalSearch, ctcTierFilter]);


  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiFetch('/api/reports/overview');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPlacementsReport = async () => {
    setPlacementsLoading(true);
    try {
      const response = await apiFetch('/api/reports/placements');
      const result = await response.json();
      if (result.success) {
        setPlacementsReport(result.data);
      }
    } catch (err) {
      console.error('Failed to load placements report:', err);
    } finally {
      setPlacementsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchJobs({ limit: 100 }),
      fetchPlacementsReport(),
    ]).catch((err) => console.error('Dashboard initialization error:', err));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(true),
        fetchJobs({ limit: 100 }),
        fetchPlacementsReport(),
      ]);
    } catch (err) {
      console.error('Failed to refresh dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const COLORS = ['#22C55E', '#0D9488', '#F97316', '#EF4444', '#6F7885'];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalStudents: 0,
    eligibleStudents: 0,
    placedStudents: 0,
    yetToBePlaced: 0,
    terminatedStudents: 0,
    placementRate: 0,
    averageCtc: 0,
    highestCtc: 0,
  };

  const companyBreakdown: any[] = stats?.companyBreakdown || [];

  return (
    <div className="space-y-8 relative">
      {/* Premium ambient radial glows */}
      <div className="absolute top-[-150px] left-[15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[100px] right-[10%] w-[400px] h-[400px] bg-warning/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Page Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Overview</h1>
          <p className="text-xs text-text-muted mt-1">Operational recruitment benchmarks and program activity. Click any metric to inspect detailed candidate rosters.</p>
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

      {/* Primary KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative">
        <div onClick={() => setActiveModal('ELIGIBLE')} className="cursor-pointer transition transform hover:-translate-y-0.5">
          <KpiCard
            title="Total Registered Students"
            value={kpis.totalStudents}
            icon={Users}
            description="Click to inspect all enrolled candidates"
            color="blue"
          />
        </div>
        <div onClick={() => setActiveModal('PLACED')} className="cursor-pointer transition transform hover:-translate-y-0.5">
          <KpiCard
            title="Placement Success Rate"
            value={`${kpis.placementRate}%`}
            icon={TrendingUp}
            description="Click to inspect placed candidates"
            color="emerald"
          />
        </div>
        <div onClick={() => setActiveModal('HIGHEST')} className="cursor-pointer transition transform hover:-translate-y-0.5">
          <KpiCard
            title="Average Salary Package"
            value={`${kpis.averageCtc} LPA`}
            icon={DollarSign}
            description="Click to inspect placement salary tiers"
            color="blue"
          />
        </div>
        <div onClick={() => setActiveModal('HIGHEST')} className="cursor-pointer transition transform hover:-translate-y-0.5">
          <KpiCard
            title="Highest Package Offered"
            value={`${kpis.highestCtc} LPA`}
            icon={Award}
            description="Click to inspect top offer holders"
            color="amber"
          />
        </div>
      </div>

      {/* Secondary Interactive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => setActiveModal('PLACED')}
          className="bg-surface-1 p-5 rounded-lg border border-border-primary hover:border-success/50 flex items-center justify-between gap-4 cursor-pointer transition shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 text-success rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Placed Candidates</div>
              <div className="text-lg font-bold text-text-primary">{kpis.placedStudents} Students</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-success hover:underline">Inspect &rarr;</span>
        </div>

        <div
          onClick={() => setActiveModal('UNPLACED')}
          className="bg-surface-1 p-5 rounded-lg border border-border-primary hover:border-warning/50 flex items-center justify-between gap-4 cursor-pointer transition shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 text-warning rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pending Placements</div>
              <div className="text-lg font-bold text-text-primary">{kpis.yetToBePlaced} Students</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-warning hover:underline">Inspect &rarr;</span>
        </div>

        <div
          onClick={() => setActiveModal('ELIGIBLE')}
          className="bg-surface-1 p-5 rounded-lg border border-border-primary hover:border-error/50 flex items-center justify-between gap-4 cursor-pointer transition shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-error/10 text-error rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Terminated Students</div>
              <div className="text-lg font-bold text-text-primary">{kpis.terminatedStudents} Students</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-error hover:underline">Inspect &rarr;</span>
        </div>

        <div
          onClick={() => setActiveModal('ELIGIBLE')}
          className="bg-surface-1 p-5 rounded-lg border border-border-primary hover:border-primary/50 flex items-center justify-between gap-4 cursor-pointer transition shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Eligible Candidates</div>
              <div className="text-lg font-bold text-text-primary">{kpis.eligibleStudents} Students</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary hover:underline">Inspect &rarr;</span>
        </div>
      </div>

      {/* ─── Company-Wise Placement & Offer Distribution Table ─── */}
      <div className="bg-surface-1 p-6 rounded-lg border border-border-primary space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Company-Wise Placements &amp; Offer Breakdown</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Inspect which hiring partners placed candidates and number of offer letters issued.</p>
          </div>
          <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold rounded-full">
            {companyBreakdown.length} Corporate Partners Hired
          </span>
        </div>

        {companyBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">No placement records available yet.</div>
        ) : (
          <div className="border border-border-primary rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background-tertiary">
                <tr className="text-[10px] font-bold text-text-muted uppercase border-b border-border-primary">
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3 text-center">Placed Candidates</th>
                  <th className="px-4 py-3 text-center">Total Offers Issued</th>
                  <th className="px-4 py-3 text-center">Highest Package</th>
                  <th className="px-4 py-3 text-center">Average Package</th>
                  <th className="px-4 py-3 text-right">Roster &amp; Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs">
                {companyBreakdown.map((c: any) => (
                  <React.Fragment key={c.companyId || c.companyName}>
                    <tr className="hover:bg-surface-2/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>{c.companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-extrabold text-xs text-success bg-success/15 px-2.5 py-1 rounded-full border border-success/30">
                          {c.placedCount} Placed
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-extrabold text-xs text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/30">
                          {c.offersCount} Offers
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-400">
                        ₹ {c.maxCtc} LPA
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-text-secondary">
                        ₹ {c.avgCtc} LPA
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setModalCompanyData(c);
                            setActiveModal('COMPANY');
                          }}
                          className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[11px] font-bold text-primary transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Placed Students ({c.placedCount})</span>
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actionable items section — only for ADMIN/MANAGER who can approve */}
      {['ADMIN', 'MANAGER'].includes(authUser?.roleName || '') &&
        jobs.filter((j) => j.status === 'PENDING_APPROVAL').length > 0 && (
        <div className="bg-surface-1 p-6 rounded-lg border border-border-primary space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" />
              <span>Requires Attention</span>
            </h3>
            <span className="text-[10px] font-bold bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20">
              {jobs.filter((j) => j.status === 'PENDING_APPROVAL').length} Pending Approval
            </span>
          </div>
          
          <div className="divide-y divide-border-primary">
            {jobs.filter((j) => j.status === 'PENDING_APPROVAL').slice(0, 3).map((job) => (
              <div key={job.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">{job.jobTitle}</div>
                  <div className="text-xs text-text-muted">{job.company.name} &bull; {job.location}</div>
                </div>
                <button
                  onClick={() => navigate('/jobs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded transition cursor-pointer"
                >
                  <span>Review Opening</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Placement Rate by Department */}
        <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Placements by Department</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="placedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.25} />
                  </linearGradient>
                  <linearGradient id="unplacedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252C36" />
                <XAxis dataKey="department" stroke="#737D89" fontSize={11} tickLine={false} />
                <YAxis stroke="#737D89" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#141820', borderColor: '#252C36', color: '#F4F6F8' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="placed" name="Placed Students" fill="url(#placedGradient)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="unplaced" name="Yet to Place" fill="url(#unplacedGradient)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics (Hostel vs Day Scholar) */}
        <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Student Residency Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.demographics?.residence || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats?.demographics?.residence || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141820', borderColor: '#252C36', color: '#F4F6F8' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average CTC by Department */}
        <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-semibold">Average package CTC by Department (LPA)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252C36" />
                <XAxis dataKey="department" stroke="#737D89" fontSize={11} tickLine={false} />
                <YAxis stroke="#737D89" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#141820', borderColor: '#252C36', color: '#F4F6F8' }} formatter={(value) => `${value} LPA`} />
                <Bar dataKey="averageCtc" name="Average Salary CTC (LPA)" fill="url(#growthGradient)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Interactive Student Roster Modal ─── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-border-primary rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-primary flex justify-between items-center bg-background-secondary">
              <div>
                <h3 className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                  {activeModal === 'COMPANY' && <Building2 className="w-5 h-5 text-primary" />}
                  {activeModal === 'PLACED' && <CheckCircle className="w-5 h-5 text-success" />}
                  {activeModal === 'UNPLACED' && <Activity className="w-5 h-5 text-warning" />}
                  {activeModal === 'HIGHEST' && <Award className="w-5 h-5 text-amber-400" />}
                  {activeModal === 'ELIGIBLE' && <Users className="w-5 h-5 text-primary" />}
                  <span>
                    {activeModal === 'COMPANY' && `Placed Students Roster — ${modalCompanyData?.companyName}`}
                    {activeModal === 'PLACED' && `Placed Candidates Directory (${(placementsReport?.placed || []).length} Placed)`}
                    {activeModal === 'UNPLACED' && `Pending Placement Candidates (${(placementsReport?.unplaced || []).length} Unplaced)`}
                    {activeModal === 'HIGHEST' && `Highest CTC Offers & Package Holders`}
                    {activeModal === 'ELIGIBLE' && `All Registered Candidate Roster (${kpis.totalStudents} Students)`}
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Verified real-time placement data and candidate academic records.</p>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setModalCompanyData(null);
                  setModalSearch('');
                }}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text-primary transition cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search & Tier Filters */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-background-secondary p-3.5 rounded-lg border border-border-primary">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search name, CTC (e.g. 24), roll no, company..."
                    className="w-full pl-9 pr-3 py-1.5 bg-surface-2 border border-border-primary rounded text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
                  />
                </div>
                {(activeModal === 'PLACED' || activeModal === 'HIGHEST') && (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setCtcTierFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${ctcTierFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-surface-2 text-text-muted border-border-primary hover:border-border-hover'}`}
                    >
                      All Offers
                    </button>
                    <button
                      onClick={() => setCtcTierFilter('TOP_20')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${ctcTierFilter === 'TOP_20' ? 'bg-amber-500 text-black border-amber-500 font-extrabold' : 'bg-surface-2 text-amber-400 border-amber-400/30 hover:bg-amber-500/10'}`}
                    >
                      🔥 20+ LPA Top Tier
                    </button>
                    <button
                      onClick={() => setCtcTierFilter('MID_10_20')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${ctcTierFilter === 'MID_10_20' ? 'bg-primary text-white border-primary' : 'bg-surface-2 text-text-muted border-border-primary hover:border-border-hover'}`}
                    >
                      10-20 LPA
                    </button>
                  </div>
                )}
              </div>

              {/* Shimmer Skeleton Loader when fetching */}
              {placementsLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-surface-2/80 rounded border border-border-primary/50 animate-pulse flex items-center px-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-3" />
                        <div className="space-y-1">
                          <div className="w-32 h-3 bg-surface-3 rounded" />
                          <div className="w-20 h-2.5 bg-surface-3/60 rounded" />
                        </div>
                      </div>
                      <div className="w-24 h-4 bg-surface-3 rounded" />
                      <div className="w-16 h-6 bg-surface-3 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  // Determine dataset according to activeModal
                  let rawList: any[] = [];
                  if (activeModal === 'COMPANY') rawList = modalCompanyData?.students || [];
                  else if (activeModal === 'PLACED' || activeModal === 'HIGHEST') rawList = placementsReport?.placed || [];
                  else if (activeModal === 'UNPLACED') rawList = placementsReport?.unplaced || [];
                  else if (activeModal === 'ELIGIBLE') rawList = placementsReport?.overall || [];

                  // Apply search and tier filters
                  const q = modalSearch.toLowerCase().trim();
                  const filteredList = rawList
                    .filter((item: any) => {
                      if ((activeModal === 'PLACED' || activeModal === 'HIGHEST') && ctcTierFilter !== 'ALL') {
                        if (ctcTierFilter === 'TOP_20' && (item.ctc || 0) < 20) return false;
                        if (ctcTierFilter === 'MID_10_20' && ((item.ctc || 0) < 10 || (item.ctc || 0) >= 20)) return false;
                        if (ctcTierFilter === 'UNDER_10' && (item.ctc || 0) >= 10) return false;
                      }
                      if (!q) return true;
                      return (
                        (item.fullName || '').toLowerCase().includes(q) ||
                        (item.rollNumber || '').toLowerCase().includes(q) ||
                        (item.department || '').toLowerCase().includes(q) ||
                        (item.departmentName || '').toLowerCase().includes(q) ||
                        (item.email || item.collegeEmail || item.personalEmail || '').toLowerCase().includes(q) ||
                        (item.companyName || item.placedCompany || '').toLowerCase().includes(q) ||
                        (item.ctc ? item.ctc.toString().includes(q) || `${item.ctc} lpa`.includes(q) : false)
                      );
                    })
                    .sort((a: any, b: any) => {
                      if (activeModal === 'HIGHEST' || activeModal === 'PLACED') return (b.ctc || 0) - (a.ctc || 0);
                      return (a.rollNumber || '').localeCompare(b.rollNumber || '');
                    });

                  const pageSize = 10;
                  const totalRecords = filteredList.length;
                  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
                  const currentPage = Math.min(modalPage, totalPages);
                  const startIndex = (currentPage - 1) * pageSize;
                  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

                  return (
                    <div className="space-y-4">
                      <div className="border border-border-primary rounded overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-background-tertiary">
                            <tr className="text-[10px] font-bold text-text-muted uppercase border-b border-border-primary">
                              <th className="px-4 py-2.5">Candidate Name</th>
                              <th className="px-4 py-2.5">Roll No &amp; Dept</th>
                              <th className="px-4 py-2.5">
                                {activeModal === 'PLACED' || activeModal === 'HIGHEST' ? 'Hiring Company' : 'Email Contact'}
                              </th>
                              <th className="px-4 py-2.5 text-center">
                                {activeModal === 'PLACED' || activeModal === 'HIGHEST' ? 'Offered Package (CTC)' : activeModal === 'ELIGIBLE' ? 'Placement Status' : 'UG Score'}
                              </th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-primary">
                            {paginatedList.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-xs text-text-muted">
                                  No matching records found.
                                </td>
                              </tr>
                            ) : (
                              paginatedList.map((s: any) => (
                                <tr
                                  key={s.id || s.studentId || s.placementId}
                                  className={`transition ${s.ctc >= 24 ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-surface-2/60'}`}
                                >
                                  <td className="px-4 py-3 font-bold text-text-primary">
                                    <div className="flex items-center gap-2.5">
                                      {s.studentPhotoUrl ? (
                                        <img
                                          src={formatImageUrl(s.studentPhotoUrl)}
                                          className="w-7 h-7 rounded-full object-cover border border-primary/30 flex-shrink-0"
                                          alt={s.fullName}
                                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                                          {s.fullName?.charAt(0).toUpperCase() || 'S'}
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                                          <span>{s.fullName}</span>
                                          {s.ctc >= 24 && (
                                            <span className="px-2 py-0.5 bg-amber-500 text-black text-[9px] font-extrabold rounded-full uppercase tracking-wider shadow">
                                              🏆 24 LPA Top Offer
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-mono font-semibold text-text-primary">{s.rollNumber}</span>
                                    <span className="text-[10px] text-text-muted block">{s.department || s.departmentName}</span>
                                  </td>
                                  <td className="px-4 py-3 text-text-secondary font-medium">
                                    {activeModal === 'PLACED' || activeModal === 'HIGHEST' ? (
                                      <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                                        <Building2 className="w-3.5 h-3.5 text-primary" />
                                        <span>{s.companyName || s.placedCompany}</span>
                                      </div>
                                    ) : (
                                      <span>{s.email || s.collegeEmail || s.personalEmail}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {activeModal === 'PLACED' || activeModal === 'HIGHEST' ? (
                                      <span className={`font-extrabold text-xs px-2.5 py-1 rounded border ${s.ctc >= 24 ? 'bg-amber-500 text-black border-amber-400' : 'text-success bg-success/10 border-success/20'}`}>
                                        ₹ {s.ctc} LPA
                                      </span>
                                    ) : activeModal === 'ELIGIBLE' ? (
                                      <StatusBadge status={s.placementStatus} />
                                    ) : (
                                      <span className="font-bold text-text-primary">{s.ugPercentage}%</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => {
                                        setActiveModal(null);
                                        navigate(`/students/${s.studentId || s.id}`);
                                      }}
                                      className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[10px] font-bold text-primary transition cursor-pointer"
                                    >
                                      Profile &rarr;
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      {totalRecords > 0 && (
                        <div className="px-4 py-3 border border-border-primary rounded bg-background-tertiary flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                          <span className="text-text-muted font-semibold">
                            Showing <strong className="text-text-primary">{startIndex + 1}–{Math.min(totalRecords, startIndex + pageSize)}</strong> of <strong className="text-text-primary">{totalRecords}</strong> records
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-text-muted bg-surface-2 px-2.5 py-1 rounded border border-border-primary">
                              Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3.5 py-1.5 border border-border-primary rounded bg-surface-2 disabled:opacity-40 text-text-secondary text-xs font-bold hover:bg-surface-elevated transition cursor-pointer disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setModalPage((p) => p + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-3.5 py-1.5 border border-border-primary rounded bg-surface-2 disabled:opacity-40 text-text-secondary text-xs font-bold hover:bg-surface-elevated transition cursor-pointer disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

