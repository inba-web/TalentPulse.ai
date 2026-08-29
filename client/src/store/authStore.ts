import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: 'ADMIN' | 'MANAGER' | 'LEAD' | 'RECRUITER';
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, roleName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  initialize: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

// Role base default permissions mapping for client-side routing optimization
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'], // Superuser
  MANAGER: ['STUDENT_READ', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_IMPORT', 'RECRUITER_READ', 'REPORT_READ'],
  LEAD: ['COMPANY_READ', 'COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_IMPORT', 'JOB_READ', 'JOB_CREATE', 'JOB_UPDATE', 'APPROVAL_READ'],
  RECRUITER: ['JOB_READ', 'RECRUITER_READ', 'ATS_ANALYSIS'],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Login failed');
      }

      set({
        user: result.data.user,
        accessToken: result.data.accessToken,
        loading: false,
      });

      return result.data.user;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  register: async (email, password, fullName, roleName) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, roleName }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Registration failed');
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      set({ user: null, accessToken: null, loading: false });
    }
  },

  refresh: async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        set({
          user: result.data.user,
          accessToken: result.data.accessToken,
          initialized: true,
        });
        return result.data.user;
      }
      
      set({ user: null, accessToken: null, initialized: true });
      return null;
    } catch (error) {
      set({ user: null, accessToken: null, initialized: true });
      return null;
    }
  },

  initialize: async () => {
    if (get().initialized) return;
    await get().refresh();
  },

  hasPermission: (permissionCode) => {
    const user = get().user;
    if (!user) return false;
    
    if (user.roleName === 'ADMIN') return true;

    const perms = ROLE_PERMISSIONS[user.roleName] || [];
    return perms.includes(permissionCode);
  },
}));
