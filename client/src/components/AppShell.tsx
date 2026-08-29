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
  Settings,
  FileSearch,
  AlertTriangle,
} from 'lucide-react';
import CommandPalette from './CommandPalette';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setSignOutOpen(false);
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Candidates',
      path: '/students',
      icon: Users,
      show: hasPermission('STUDENT_READ'),
    },
    {
      name: 'Companies',
      path: '/companies',
      icon: Building2,
      show: hasPermission('COMPANY_READ'),
    },
    {
      name: 'Jobs',
      path: '/jobs',
      icon: Briefcase,
      show: hasPermission('JOB_READ'),
    },
    {
      name: 'Screening',
      path: '/recruiter',
      icon: BrainCircuit,
      show: hasPermission('RECRUITER_READ'),
    },
    {
      name: 'JD Matcher',
      path: '/jd-matcher',
      icon: FileSearch,
      show: hasPermission('ATS_ANALYSIS'),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileBarChart2,
      show: hasPermission('REPORT_READ'),
    },
    {
      name: 'Audit Logs',
      path: '/audit',
      icon: ShieldCheck,
      show: hasPermission('AUDIT_READ'),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      show: !!user,
    },
  ];

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/students/')) return 'Candidate Profile';
    if (path.startsWith('/companies/')) return 'Company Details';
    if (path.startsWith('/jobs/')) return 'Job Details';

    const matched = navItems.find((item) => item.path === path);
    return matched ? matched.name : 'TalentPulse.ai';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center bg-surface-2 text-text-primary px-4 h-16 border-b border-border-secondary">
        <div className="flex items-center gap-2.5">
          <img src="/assets/talentpulse_logo.png" className="w-7 h-7 object-contain" alt="Logo" />
          <span className="font-extrabold text-lg tracking-tight text-text-primary">TalentPulse<span className="text-primary">.ai</span></span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-surface-elevated rounded">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-background-secondary text-text-secondary flex flex-col border-r border-border-primary transform md:transform-none transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Logo Area — Larger & More Prominent */}
        <div className="px-5 py-5 border-b border-border-primary flex justify-between items-center bg-background-tertiary">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-primary rounded glow-primary">
              <img src="/assets/talentpulse_logo.png" className="w-9 h-9 object-contain" alt="TalentPulse Logo" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-text-primary leading-tight">TalentPulse<span className="text-primary">.ai</span></div>
              <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Placement Portal</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-surface-elevated rounded">
            <X className="w-5 h-5 text-text-muted" />
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold transition duration-150 relative ${active
                      ? 'bg-gradient-primary text-white glow-primary'
                      : 'hover:bg-surface-2 hover:text-text-primary text-text-muted'
                    }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-border-primary bg-background-tertiary flex flex-col gap-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex justify-center items-center text-white font-bold text-sm glow-primary">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">{user.fullName}</div>
                <div className="text-[10px] font-bold text-primary truncate uppercase tracking-wider">{user.roleName}</div>
              </div>
            </div>
          )}

          <button
            onClick={() => setSignOutOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold text-text-muted hover:bg-error/10 hover:text-error border border-transparent hover:border-error/20 transition duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TopBar Header */}
        <header className="hidden md:flex justify-between items-center h-16 px-8 bg-surface-1 border-b border-border-primary">
          <h2 className="text-lg font-bold text-text-primary">{getBreadcrumb()}</h2>

          <div className="flex items-center gap-6">
            {/* Ctrl + K Trigger Widget */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded border border-border-primary hover:border-border-hover bg-background-secondary text-text-muted transition duration-150 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium">Search records...</span>
              <kbd className="text-[10px] font-bold border border-border-primary px-1.5 py-0.5 rounded bg-surface-2 shadow-sm">
                Ctrl + K
              </kbd>
            </button>

            {user && (
              <div className="flex items-center gap-2.5 border-l border-border-primary pl-6">
                <div className="text-right">
                  <div className="text-xs font-bold text-text-primary">{user.fullName}</div>
                  <div className="text-[9px] font-extrabold text-primary uppercase tracking-widest">{user.roleName}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex justify-center items-center text-white font-bold text-xs glow-primary">
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

      {/* Sign Out Confirmation Dialog */}
      {signOutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-1 w-full max-w-sm rounded border border-border-primary shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 bg-error/10 rounded-full border border-error/20">
                  <AlertTriangle className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-primary">Sign Out?</h3>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                    You will be signed out of your current session and redirected to the login page.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSignOutOpen(false)}
                  className="flex-1 h-10 border border-border-primary rounded text-sm font-semibold text-text-secondary hover:bg-surface-2 transition cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 h-10 bg-error hover:brightness-110 text-white text-sm font-bold rounded flex items-center justify-center gap-2 transition border-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
