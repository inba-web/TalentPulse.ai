import React, { useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
import {
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Award,
  DollarSign,
  Layers,
  Activity,
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/reports/overview');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6'];

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
    <div className="space-y-8">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text tracking-tight">Placement Command Center</h1>
        <p className="text-sm text-secondary font-medium mt-1">Live operational metrics and intelligence analytics.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Registered Students"
          value={kpis.totalStudents}
          icon={Users}
          description="Enrolled in active batches"
          color="indigo"
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
          color="cyan"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Placed Candidates</div>
            <div className="text-lg font-bold text-text">{kpis.placedStudents}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Pending Placements</div>
            <div className="text-lg font-bold text-text">{kpis.yetToBePlaced}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Terminated Students</div>
            <div className="text-lg font-bold text-text">{kpis.terminatedStudents}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wider font-semibold">Eligible Candidates</div>
            <div className="text-lg font-bold text-text">{kpis.eligibleStudents}</div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placement Rate by Department */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">Placements by Department</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="department" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="placed" name="Placed Students" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unplaced" name="Yet to Place" fill="#64748B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics (Hostel vs Day Scholar) */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">Student Residency Distribution</h3>
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
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Average CTC by Department */}
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider font-semibold">Average package CTC by Department (LPA)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="department" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => `${value} LPA`} />
                <Bar dataKey="averageCtc" name="Average Salary CTC (LPA)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
