import { PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Business Administration', code: 'BBA' },
  { name: 'Cyber Security', code: 'BCY' },
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
  console.log('Seeding Neon database system permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { code: perm.code, description: perm.description },
    });
  }

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

  for (const dept of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({
      where: { OR: [{ code: dept.code }, { name: dept.name }] },
    });
    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: { name: dept.name, code: dept.code },
      });
    } else {
      await prisma.department.create({
        data: { name: dept.name, code: dept.code },
      });
    }
  }

  const defaultHash = await argon2.hash('Password123!');
  const users = [
    { email: 'admin@talentpulse.ai', fullName: 'Admin User', roleName: RoleName.ADMIN, hash: defaultHash },
    { email: 'manager@talentpulse.ai', fullName: 'Manager User', roleName: RoleName.MANAGER, hash: defaultHash },
    { email: 'lead@talentpulse.ai', fullName: 'Lead User', roleName: RoleName.LEAD, hash: defaultHash },
    { email: 'recruiter@talentpulse.ai', fullName: 'Recruiter User', roleName: RoleName.RECRUITER, hash: defaultHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        email: u.email,
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

  console.log('Neon database clean initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
