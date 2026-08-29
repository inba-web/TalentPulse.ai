import { create } from 'zustand';
import { apiFetch } from '../utils/apiFetch';

interface Student {
  id: string;
  rollNumber: string;
  fullName: string;
  gender: string;
  hostelStatus: string;
  personalEmail: string;
  collegeEmail: string;
  mobileNumber: string;
  graduationDate: string;
  placementStatus: 'YET_TO_BE_PLACED' | 'PLACED' | 'TERMINATED';
  isDeleted?: boolean;
  deletedAt?: string | null;
  department: { name: string; code: string };
  academics?: {
    sslcPercentage: number;
    hscPercentage: number;
    ugPercentage: number;
    pgPercentage: number | null;
  };
  links?: {
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
  };
}

interface FetchFilters {
  search?: string;
  departmentId?: string;
  placementStatus?: string;
  gender?: string;
  hostelStatus?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

interface StudentState {
  students: Student[];
  total: number;
  loading: boolean;
  error: string | null;

  // Store last-used filters so we can re-fetch after mutations
  lastFilters: FetchFilters;

  fetchStudents: (filters: FetchFilters) => Promise<void>;
  refreshStudents: () => Promise<void>;

  fetchStudentById: (id: string) => Promise<any>;
  createStudent: (data: any) => Promise<void>;
  updateStudent: (id: string, data: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  recoverStudent: (id: string) => Promise<void>;
  terminateStudent: (id: string, reason: string) => Promise<void>;
  revokeTermination: (id: string) => Promise<void>;
  importStudents: (file: File) => Promise<any>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  total: 0,
  loading: false,
  error: null,
  lastFilters: { page: 1, limit: 10 },

  fetchStudents: async (filters) => {
    set({ loading: true, error: null, lastFilters: filters });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.placementStatus) params.append('placementStatus', filters.placementStatus);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.hostelStatus) params.append('hostelStatus', filters.hostelStatus);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.includeDeleted) params.append('includeDeleted', 'true');

      const response = await apiFetch(`/api/students?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        set({
          students: result.data.students,
          total: result.data.total,
          loading: false,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  refreshStudents: async () => {
    const filters = get().lastFilters;
    await get().fetchStudents(filters);
  },

  fetchStudentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}`);
      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data.student;
      throw new Error(result.error?.message || 'Failed to fetch student details');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createStudent: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to create student');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to update student');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete student');
      // Refresh with current filters
      await get().refreshStudents();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  recoverStudent: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}/recover`, { method: 'POST' });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to recover student');
      // Refresh with current filters (should still be includeDeleted=true for the tab)
      await get().refreshStudents();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  terminateStudent: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to terminate student');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  revokeTermination: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/api/students/${id}/revoke-termination`, { method: 'POST' });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to revoke termination');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  importStudents: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiFetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      set({ loading: false });
      if (result.success) {
        // CRITICAL FIX: Re-fetch student list with page 1 to show newly imported records
        await get().fetchStudents({ page: 1, limit: 10 });
        return result.data;
      }
      throw new Error(result.error?.message || 'Import failed');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
