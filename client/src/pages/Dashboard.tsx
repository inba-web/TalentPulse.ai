import React, { useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
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

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/reports/overview');
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

  useEffect(() => {
    fetchStats();
    fetchJobs({ limit: 100 });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStats(true);
      await fetchJobs({ limit: 100 });
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

  return (
    <div className="space-y-8 relative">
      {/* Premium ambient radial glows */}
      <div className="absolute top-[-150px] left-[15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[100px] right-[10%] w-[400px] h-[400px] bg-warning/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Page Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Overview</h1>
          <p className="text-xs text-text-muted mt-1">Operational recruitment benchmarks and program activity.</p>
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative">
        <KpiCard
          title="Total Registered Students"
          value={kpis.totalStudents}
          icon={Users}
          description="Enrolled in active batches"
          color="blue"
        />
        <KpiCard
          title="Placement Success Rate"
          value={`${kpis.placementRate}%`}
          icon={TrendingUp}
          description="Of active eligible students"
          color="emerald"
        />
        <KpiCard
          title="Average Salary Package"
          value={`${kpis.averageCtc} LPA`}
          icon={DollarSign}
          description="Average placement CTC offer"
          color="blue"
        />
        <KpiCard
          title="Highest Package Offered"
          value={`${kpis.highestCtc} LPA`}
          icon={Award}
          description="Highest CTC generated"
          color="amber"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-1 p-5 rounded-lg border border-border-primary flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Placed Candidates</div>
            <div className="text-lg font-bold text-text-primary">{kpis.placedStudents}</div>
          </div>
        </div>

        <div className="bg-surface-1 p-5 rounded-lg border border-border-primary flex items-center gap-4">
          <div className="p-3 bg-warning/10 text-warning rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pending Placements</div>
            <div className="text-lg font-bold text-text-primary">{kpis.yetToBePlaced}</div>
          </div>
        </div>

        <div className="bg-surface-1 p-5 rounded-lg border border-border-primary flex items-center gap-4">
          <div className="p-3 bg-error/10 text-error rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Terminated Students</div>
            <div className="text-lg font-bold text-text-primary">{kpis.terminatedStudents}</div>
          </div>
        </div>

        <div className="bg-surface-1 p-5 rounded-lg border border-border-primary flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-semibold">Eligible Candidates</div>
            <div className="text-lg font-bold text-text-primary">{kpis.eligibleStudents}</div>
          </div>
        </div>
      </div>

      {/* Actionable items section */}
      {jobs.filter((j) => j.status === 'PENDING_APPROVAL').length > 0 && (
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
    </div>
  );
}
