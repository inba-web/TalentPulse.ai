import { create } from 'zustand';
import { apiFetch } from '../utils/apiFetch';

interface Candidate {
  studentId: string;
  fullName: string;
  rollNumber: string;
  department: string;
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

interface RecruiterState {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;

  fetchCandidatesForJob: (jobId: string) => Promise<void>;
  analyzeCandidateResume: (studentId: string, jobId: string, file?: File) => Promise<any>;
  analyzeCustomJd: (jdText: string, file?: File) => Promise<Candidate[]>;
}

export const useRecruiterStore = create<RecruiterState>((set) => ({
  candidates: [],
  loading: false,
  error: null,

  fetchCandidatesForJob: async (jobId) => {
    set({ loading: true, error: null, candidates: [] });
    try {
      const response = await apiFetch(`/api/ats/jobs/${jobId}/candidates`);
      const result = await response.json();
      
      if (result.success) {
        set({
          candidates: result.data.candidates,
          loading: false,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch candidate matches');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  analyzeCandidateResume: async (studentId, jobId, file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('studentId', studentId);
      formData.append('jobId', jobId);
      if (file) {
        formData.append('file', file);
      }

      const response = await apiFetch('/api/ats/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      set({ loading: false });
      if (result.success) return result.data.analysis;
      throw new Error(result.error?.message || 'Resume analysis failed');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  analyzeCustomJd: async (jdText, file) => {
    set({ loading: true, error: null, candidates: [] });
    try {
      const formData = new FormData();
      formData.append('jdText', jdText);
      if (file) {
        formData.append('file', file);
      }

      const response = await apiFetch('/api/ats/jd/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        set({
          candidates: result.data.candidates,
          loading: false,
        });
        return result.data.candidates;
      } else {
        throw new Error(result.error?.message || 'Failed to analyze Job Description');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
