import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const createStudentSchema = z.object({
  rollNumber: z.string().min(1, 'Roll number is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  departmentId: z.string().uuid('Invalid department ID'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  hostelStatus: z.enum(['HOSTEL', 'DAY_SCHOLAR']),
  personalEmail: z.string().email('Invalid personal email format'),
  collegeEmail: z.string().email('Invalid college email format'),
  mobileNumber: z.string().regex(mobileRegex, 'Invalid Indian mobile number. Must be exactly 10 digits starting with 6-9'),
  graduationDate: z.string().transform((val) => new Date(val)),
  
  // Academics
  sslcPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  hscPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  ugPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  pgPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100').optional().nullable(),

  // Links
  githubUrl: z.string().url('Invalid GitHub URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  portfolioUrl: z.string().url('Invalid Portfolio URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  studentPhotoUrl: z.string().url('Invalid Photo URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  selfIntroVideoUrl: z.string().url('Invalid Video URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  resumeUrl: z.string().url('Invalid Resume URL').optional().nullable(),
});


export const updateStudentSchema = createStudentSchema
  .extend({
    placementStatus: z.enum(['YET_TO_BE_PLACED', 'PLACED', 'TERMINATED']).optional(),
  })
  .partial()
  .omit({
    rollNumber: true, // Roll number cannot be updated after creation
  });

export const terminateStudentSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});
