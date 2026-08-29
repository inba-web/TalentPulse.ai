import { z } from 'zod';

export const createJobSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  jobTitle: z.string().min(1, 'Job title is required'),
  jdText: z.string().min(10, 'Job description must be at least 10 characters'),
  jdPdfUrl: z.string().url('Invalid PDF link').startsWith('https://').optional().nullable(),
  jdLink: z.string().url('Invalid JD website link').startsWith('https://').optional().nullable(),
  ctc: z.number().positive('CTC must be a positive value'),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).default('DRAFT'),
});

export const updateJobSchema = createJobSchema.partial();

export const approveJobSchema = z.object({
  approve: z.boolean(),
  comment: z.string().max(200, 'Comment must be under 200 characters').optional(),
});
