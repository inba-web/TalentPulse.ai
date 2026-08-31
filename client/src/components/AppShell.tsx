import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../utils/apiFetch';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileBarChart2,
  LogOut,
  Search,
  Menu,
  X,
  Settings,
  FileSearch,
  AlertTriangle,
  Bell,
  CheckCheck,
  Sparkles,
  UserPlus,
  CheckCircle2,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import CommandPalette from './CommandPalette';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  time?: string;
  type: 'STUDENT' | 'JOB' | 'COMPANY' | 'ATS';
  read: boolean;
  link: string;
}

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const fetchLiveNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      const result = await res.json();
      if (result.success && Array.isArray(result.data?.notifications)) {
        setNotifications(result.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch live notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications([]);
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const markItemRead = async (id: string, link: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setOpen(false);
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
    if (link) {
      navigate(link);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'STUDENT':
        return <UserPlus className="w-4 h-4 text-primary" />;
      case 'JOB':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'COMPANY':
        return <Building className="w-4 h-4 text-warning" />;
      case 'ATS':
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-background-secondary text-text-muted hover:text-text-primary transition cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-1 rounded border border-border-primary shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between bg-surface-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-extrabold text-xs text-text-primary uppercase tracking-wider">Notifications &amp; Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-border-primary max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">No new notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markItemRead(n.id, n.link)}
                    className={`p-3.5 flex gap-3 items-start transition cursor-pointer ${
                      n.read ? 'bg-surface-1 hover:bg-surface-2' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    <div className="p-2 rounded bg-surface-2 border border-border-primary flex-shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-xs font-bold truncate ${n.read ? 'text-text-primary' : 'text-primary'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{n.time || formatTimeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug line-clamp-2">{n.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('talentpulse_sidebar_collapsed') === 'true';
  });
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('talentpulse_sidebar_collapsed', String(next));
      return next;
    });
  };

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
      name: 'Students',
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
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      show: !!user,
    },
  ];

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/students/')) return 'Student Profile';
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
          <div className="p-0.5 bg-white rounded flex items-center justify-center">
            <img src="/assets/rathinam_logo.png" className="h-7 w-auto object-contain" alt="Rathinam Logo" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-text-primary">TalentPulse<span className="text-primary">.ai</span></span>
        </div>
        <div className="flex items-center gap-2">
          {user && <NotificationDropdown />}
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-surface-elevated rounded">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 bg-background-secondary text-text-secondary flex flex-col border-r border-border-primary transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } w-64 transform md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo Area */}
        <div className="px-4 py-4 border-b border-border-primary flex justify-between items-center bg-background-tertiary">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1 bg-white rounded-lg shadow-xs flex items-center justify-center flex-shrink-0">
              <img src="/assets/rathinam_logo.png" className="h-9 w-auto object-contain" alt="Rathinam Logo" />
            </div>
            {!isCollapsed && (
              <div className="truncate animate-in fade-in duration-200">
                <div className="font-extrabold text-base tracking-tight text-text-primary leading-tight">TalentPulse<span className="text-primary">.ai</span></div>
                <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Placement Portal</div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:flex p-1.5 hover:bg-surface-2 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-surface-elevated rounded">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3.5'} py-2.5 rounded text-sm font-semibold transition duration-150 relative ${
                    active
                      ? 'bg-gradient-primary text-white glow-primary'
                      : 'hover:bg-surface-2 hover:text-text-primary text-text-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                </Link>
              );
            })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-border-primary bg-background-tertiary flex flex-col gap-2">
          {user && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} py-1.5`}>
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex justify-center items-center text-white font-bold text-sm glow-primary flex-shrink-0">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-text-primary truncate">{user.fullName}</div>
                  <div className="text-[10px] font-bold text-primary truncate uppercase tracking-wider">{user.roleName}</div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setSignOutOpen(true)}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'} py-2.5 rounded text-sm font-semibold text-text-muted hover:bg-error/10 hover:text-error border border-transparent hover:border-error/20 transition duration-150 cursor-pointer`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
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

            {/* Notifications Feature (Available to ALL roles: ADMIN, MANAGER, LEAD, RECRUITER) */}
            {user && (
              <NotificationDropdown />
            )}

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
