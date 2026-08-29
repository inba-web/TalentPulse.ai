import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  BrainCircuit,
  FileBarChart2,
  ShieldCheck,
  LogOut,
  Search,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import CommandPalette from './CommandPalette';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Student Intelligence',
      path: '/students',
      icon: Users,
      show: hasPermission('STUDENT_READ'),
    },
    {
      name: 'Placement Companies',
      path: '/companies',
      icon: Building2,
      show: hasPermission('COMPANY_READ'),
    },
    {
      name: 'Job Openings',
      path: '/jobs',
      icon: Briefcase,
      show: hasPermission('JOB_READ'),
    },
    {
      name: 'Recruiter Matching',
      path: '/recruiter',
      icon: BrainCircuit,
      show: hasPermission('RECRUITER_READ'),
    },
    {
      name: 'Placements Analytics',
      path: '/reports',
      icon: FileBarChart2,
      show: hasPermission('REPORT_READ'),
    },
    {
      name: 'Audit Trail',
      path: '/audit',
      icon: ShieldCheck,
      show: hasPermission('AUDIT_READ'),
    },
  ];

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/students/')) return 'Student Profile';
    if (path.startsWith('/companies/')) return 'Company Details';
    if (path.startsWith('/jobs/')) return 'Job Details';
    
    const matched = navItems.find((item) => item.path === path);
    return matched ? matched.name : 'Placement Hub';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center bg-slate-900 text-white px-4 h-16 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <img src="/assets/talentpulse_logo.png" className="w-6 h-6 object-contain" alt="Logo" />
          <span className="font-extrabold text-lg tracking-tight">TalentPulse<span className="text-primary">.ai</span></span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-slate-800 rounded">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transform md:transform-none transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2.5">
            <img src="/assets/talentpulse_logo.png" className="w-7 h-7 object-contain" alt="Logo" />
            <span className="font-extrabold text-xl tracking-tight text-white">TalentPulse<span className="text-primary">.ai</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-slate-800 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition duration-150 ${
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex justify-center items-center text-primary font-bold text-sm">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                <div className="text-[10px] font-bold text-primary truncate uppercase tracking-wider">{user.roleName}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition duration-150"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TopBar Header */}
        <header className="hidden md:flex justify-between items-center h-16 px-8 bg-surface border-b border-border">
          <h2 className="text-lg font-bold text-text">{getBreadcrumb()}</h2>
          
          <div className="flex items-center gap-6">
            {/* Ctrl + K Trigger Widget */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border hover:border-slate-400 bg-slate-50/50 text-secondary transition duration-150 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium">Search records...</span>
              <kbd className="text-[10px] font-bold border border-border px-1.5 py-0.5 rounded bg-surface shadow-sm">
                Ctrl + K
              </kbd>
            </button>

            {user && (
              <div className="flex items-center gap-2.5 border-l border-border pl-6">
                <div className="text-right">
                  <div className="text-xs font-bold text-text">{user.fullName}</div>
                  <div className="text-[9px] font-extrabold text-primary uppercase tracking-widest">{user.roleName}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex justify-center items-center text-primary font-bold text-xs border border-border">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Viewer */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Central Global Search Overlay */}
      <CommandPalette />
    </div>
  );
}
