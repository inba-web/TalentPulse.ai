import { create } from 'zustand';

interface Company {
  id: string;
  name: string;
  website: string | null;
  employeeSize: number | null;
  industry: string | null;
  exactAddress: string | null;
  placeId: string | null;
  mapsUrl: string | null;
  contactPerson: string;
  designation: string;
  contactEmail: string;
  contactMobile: string;
  status: 'COLD' | 'WARM' | 'HOT' | 'DRIVE_COMPLETED';
}

interface CompanyState {
  companies: Company[];
  total: number;
  loading: boolean;
  error: string | null;

  fetchCompanies: (filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  fetchCompanyById: (id: string) => Promise<any>;
  createCompany: (data: any) => Promise<Company>;
  updateCompany: (id: string, data: any) => Promise<void>;
  searchLocations: (name: string, location: string) => Promise<any[]>;
  resolveLocation: (companyId: string, placeId: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  total: 0,
  loading: false,
  error: null,

  fetchCompanies: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/companies?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        set({
          companies: result.data.companies,
          total: result.data.total,
          loading: false,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch companies');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCompanyById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/companies/${id}`);
      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data.company;
      throw new Error(result.error?.message || 'Failed to fetch company details');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createCompany: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data.company;
      throw new Error(result.error?.message || 'Failed to create company');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCompany: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to update company');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchLocations: async (name, location) => {
    try {
      const response = await fetch(`/api/companies/search-location?name=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`);
      const result = await response.json();
      if (result.success) return result.data.candidates || [];
      return [];
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  },

  resolveLocation: async (companyId, placeId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/companies/resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, placeId }),
      });
      const result = await response.json();
      set({ loading: false });
      if (!result.success) throw new Error(result.error?.message || 'Failed to resolve company address');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
