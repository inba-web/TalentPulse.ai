import { create } from 'zustand';

interface Job {
  id: string;
  jobTitle: string;
  jdText: string;
  jdPdfUrl: string | null;
  jdLink: string | null;
  ctc: number;
  location: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  company: { name: string; id: string };
  createdBy: { fullName: string; email: string };
  approval?: {
    reviewedAt: string | null;
    comment: string | null;
    reviewedBy?: { fullName: string; email: string };
  };
}

interface JobState {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;

  fetchJobs: (filters: {
    search?: string;
    status?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  fetchJobById: (id: string) => Promise<any>;
  createJob: (data: any) => Promise<void>;
  updateJob: (id: string, data: any) => Promise<void>;
  forwardJob: (id: string) => Promise<void>;
  reviewJob: (id: string, approve: boolean, comment?: string) => Promise<void>;
  extractJd: (fileOrText: File | string) => Promise<any>;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  total: 0,
  loading: false,
  error: null,

  fetchJobs: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        set({
          jobs: result.data.jobs,
          total: result.data.total,
          loading: false,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch jobs');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchJobById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/jobs/${id}`);
      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data.job;
      throw new Error(result.error?.message || 'Failed to fetch job details');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createJob: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to create job opportunity');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateJob: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to update job details');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  forwardJob: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/jobs/${id}/forward`, { method: 'POST' });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to forward opportunity');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reviewJob: async (id, approve, comment) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/jobs/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, comment }),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to review opportunity');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  extractJd: async (fileOrText) => {
    set({ loading: true, error: null });
    try {
      let response;
      if (typeof fileOrText === 'string') {
        response = await fetch('/api/jobs/extract-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fileOrText }),
        });
      } else {
        const formData = new FormData();
        formData.append('file', fileOrText);
        response = await fetch('/api/jobs/extract-jd', {
          method: 'POST',
          body: formData,
        });
      }

      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data;
      throw new Error(result.error?.message || 'Failed to parse JD');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
