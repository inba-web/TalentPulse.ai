import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Invalid website URL').startsWith('https://', 'HTTPS protocol required').optional().nullable(),
  employeeSize: z.number().int().positive().optional().nullable(),
  industry: z.string().optional().nullable(),
  exactAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  placeId: z.string().optional().nullable(),
  mapsUrl: z.string().url('Invalid Google Maps link').optional().nullable(),
  contactPerson: z.string().min(1, 'Contact person name is required'),
  designation: z.string().min(1, 'Designation is required'),
  contactEmail: z.string().email('Invalid email address format'),
  contactMobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number. Must be exactly 10 digits'),
  status: z.enum(['COLD', 'WARM', 'HOT', 'DRIVE_COMPLETED']).default('COLD'),
});

export const updateCompanySchema = createCompanySchema.partial();
