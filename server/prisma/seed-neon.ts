import { PrismaClient, RoleName, OpportunityStatus, JobStatus } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import * as argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);

const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = [
  // Engineering & Technology
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Aerospace Engineering', code: 'AERO' },
  
  // Sciences & Cyber
  { name: 'Cyber Security', code: 'CYBER' },
  { name: 'Data Science & Artificial Intelligence', code: 'DSAI' },
  { name: 'Mathematics & Computing', code: 'MATH' },
  { name: 'Physics & Applied Sciences', code: 'PHYS' },
  
  // Business & Management
  { name: 'Business Administration', code: 'MBA' },
  { name: 'Commerce & Financial Analytics', code: 'BCOM' },
  { name: 'Economics & Public Policy', code: 'ECON' },

  // Humanities & Arts
  { name: 'English Literature & Linguistics', code: 'ENG' },
  { name: 'Psychology & Behavioral Sciences', code: 'PSY' },
  { name: 'Media Studies & Journalism', code: 'MEDIA' },

  // Medical & Health Sciences
  { name: 'Bio-Technology & Life Sciences', code: 'BIOTECH' },
  { name: 'Pharmaceutical Sciences', code: 'PHARMA' }
];

const PERMISSIONS = [
  { code: 'STUDENT_READ', description: 'Read student records' },
  { code: 'STUDENT_CREATE', description: 'Create student records' },
  { code: 'STUDENT_UPDATE', description: 'Update student records' },
  { code: 'STUDENT_DELETE', description: 'Delete student records' },
  { code: 'STUDENT_IMPORT', description: 'Bulk import student records' },
  { code: 'COMPANY_READ', description: 'Read company records' },
  { code: 'COMPANY_CREATE', description: 'Create company records' },
  { code: 'COMPANY_UPDATE', description: 'Update company records' },
  { code: 'COMPANY_DELETE', description: 'Delete company records' },
  { code: 'COMPANY_IMPORT', description: 'Bulk import company records' },
  { code: 'JOB_READ', description: 'Read job postings' },
  { code: 'JOB_CREATE', description: 'Create job postings' },
  { code: 'JOB_UPDATE', description: 'Update job postings' },
  { code: 'JOB_DELETE', description: 'Delete job postings' },
  { code: 'APPROVAL_READ', description: 'Read approval requests' },
  { code: 'APPROVAL_APPROVE', description: 'Approve placement jobs' },
  { code: 'APPROVAL_REJECT', description: 'Reject placement jobs' },
  { code: 'RECRUITER_READ', description: 'Access recruiter operations' },
  { code: 'ATS_ANALYSIS', description: 'Run ATS matching evaluations' },
  { code: 'REPORT_READ', description: 'Access reporting and analytics' },
  { code: 'USER_MANAGE', description: 'Manage system users' },
  { code: 'ROLE_MANAGE', description: 'Manage user roles' },
  { code: 'PERMISSION_MANAGE', description: 'Grant or revoke permissions' },
  { code: 'AUDIT_READ', description: 'View system audit trails' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.code),
  MANAGER: [
    'STUDENT_READ',
    'STUDENT_CREATE',
    'STUDENT_UPDATE',
    'STUDENT_IMPORT',
    'RECRUITER_READ',
    'REPORT_READ',
  ],
  LEAD: [
    'COMPANY_READ',
    'COMPANY_CREATE',
    'COMPANY_UPDATE',
    'COMPANY_IMPORT',
    'JOB_READ',
    'JOB_CREATE',
    'JOB_UPDATE',
    'APPROVAL_READ',
  ],
  RECRUITER: [
    'JOB_READ',
    'RECRUITER_READ',
    'ATS_ANALYSIS',
  ],
};

async function main() {
  console.log('Seeding permissions to Neon...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { code: perm.code, description: perm.description },
    });
  }

  console.log('Seeding role permissions to Neon...');
  for (const role of Object.keys(ROLE_PERMISSIONS) as RoleName[]) {
    const permCodes = ROLE_PERMISSIONS[role];
    for (const code of permCodes) {
      await prisma.rolePermission.upsert({
        where: {
          roleName_permissionCode: {
            roleName: role,
            permissionCode: code,
          },
        },
        update: {},
        create: {
          roleName: role,
          permissionCode: code,
        },
      });
    }
  }

  console.log('Seeding departments to Neon...');
  for (const dept of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { code: dept.code },
          { name: dept.name }
        ]
      }
    });

    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: {
          code: dept.code,
          name: dept.name,
        }
      });
    } else {
      await prisma.department.create({
        data: {
          code: dept.code,
          name: dept.name,
        }
      });
    }
  }

  console.log('Seeding user credentials to Neon...');
  const adminHash = await argon2.hash('admin@123');
  const tpHash = await argon2.hash('Password123!');
  const defaultHash = await argon2.hash('Password123!');

  const users = [
    { email: 'admin@gmail.com', fullName: 'Admin User', roleName: RoleName.ADMIN, hash: adminHash },
    { email: 'admin2@gmail.com', fullName: 'Admin User 2', roleName: RoleName.ADMIN, hash: adminHash },
    { email: 'admin@talentpulse.ai', fullName: 'Admin User', roleName: RoleName.ADMIN, hash: tpHash },
    { email: 'manager@talentpulse.ai', fullName: 'Manager User', roleName: RoleName.MANAGER, hash: defaultHash },
    { email: 'manager2@talentpulse.ai', fullName: 'Manager User 2', roleName: RoleName.MANAGER, hash: defaultHash },
    { email: 'lead@talentpulse.ai', fullName: 'Lead User', roleName: RoleName.LEAD, hash: defaultHash },
    { email: 'lead2@talentpulse.ai', fullName: 'Lead User 2', roleName: RoleName.LEAD, hash: defaultHash },
    { email: 'recruiter@talentpulse.ai', fullName: 'Recruiter User', roleName: RoleName.RECRUITER, hash: defaultHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        passwordHash: u.hash,
        roleName: u.roleName,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: u.hash,
        roleName: u.roleName,
        isEmailVerified: true,
      },
    });
  }

  console.log('Seeding companies to Neon...');
  const leadUser = await prisma.user.findFirst({ where: { roleName: RoleName.LEAD } });
  const adminUser = await prisma.user.findFirst({ where: { roleName: RoleName.ADMIN } });
  const createdById = leadUser?.id || adminUser?.id || '';

  const COMPANIES_SEED = [
    {
      name: 'TechGiant Corp',
      website: 'https://techgiant.com',
      employeeSize: 10000,
      industry: 'Technology',
      exactAddress: 'Varthur Hobli, Bangalore, Karnataka 560087',
      latitude: 12.9438,
      longitude: 77.7471,
      placeId: 'ChIJz2xM3g0UrjsR2Jt4UvJg_t4',
      mapsUrl: 'https://maps.google.com/?q=TechGiant+Corp+Bangalore',
      contactPerson: 'Sarah Jenkins',
      designation: 'Director of Talent Acquisition',
      contactEmail: 's.jenkins@techgiant.com',
      contactMobile: '9876543210',
      status: OpportunityStatus.HOT,
    },
    {
      name: 'InnovateAI Solutions',
      website: 'https://innovateai.io',
      employeeSize: 250,
      industry: 'Artificial Intelligence',
      exactAddress: 'Tidal Park, Taramani, Chennai, Tamil Nadu 600113',
      latitude: 12.9894,
      longitude: 80.2471,
      placeId: 'ChIJy_8w56pUrjsR9X37297gYvY',
      mapsUrl: 'https://maps.google.com/?q=InnovateAI+Chennai',
      contactPerson: 'Rajesh Kumar',
      designation: 'HR Lead',
      contactEmail: 'rajesh@innovateai.io',
      contactMobile: '9123456789',
      status: OpportunityStatus.WARM,
    },
    {
      name: 'Stark Logistics',
      website: 'https://starklogistics.co.in',
      employeeSize: 50,
      industry: 'Supply Chain',
      exactAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      latitude: 19.0607,
      longitude: 72.8642,
      contactPerson: 'Pepper Potts',
      designation: 'COO',
      contactEmail: 'potts@stark.com',
      contactMobile: '9000012345',
      status: OpportunityStatus.COLD,
    },
  ];

  const companyMap: Record<string, string> = {};
  for (const comp of COMPANIES_SEED) {
    const createdComp = await prisma.company.upsert({
      where: { name: comp.name },
      update: {
        website: comp.website,
        employeeSize: comp.employeeSize,
        industry: comp.industry,
        exactAddress: comp.exactAddress,
        contactPerson: comp.contactPerson,
        designation: comp.designation,
        contactEmail: comp.contactEmail,
        contactMobile: comp.contactMobile,
        status: comp.status,
      },
      create: comp,
    });
    companyMap[comp.name] = createdComp.id;
  }

  console.log('Seeding jobs to Neon...');
  const JOBS_SEED = [
    {
      companyId: companyMap['TechGiant Corp'],
      jobTitle: 'Software Engineering Associate',
      jdText: 'We are looking for a Software Associate with strong JavaScript, Node.js, and SQL skills. Experience with AWS is a plus.',
      ctc: 12.5,
      location: 'Bangalore',
      status: JobStatus.APPROVED,
      createdById,
    },
    {
      companyId: companyMap['InnovateAI Solutions'],
      jobTitle: 'Junior Machine Learning Engineer',
      jdText: 'Python developer with knowledge of PyTorch, Scikit-learn and SQL databases. Will work on training model feeds.',
      ctc: 18.0,
      location: 'Chennai (Onsite)',
      status: JobStatus.PENDING_APPROVAL,
      createdById,
    },
  ];

  for (const job of JOBS_SEED) {
    const existingJob = await prisma.job.findFirst({
      where: {
        companyId: job.companyId,
        jobTitle: job.jobTitle,
      },
    });
    if (!existingJob) {
      await prisma.job.create({
        data: job,
      });
    }
  }

  console.log('Database configuration seeding successfully completed on Neon!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
