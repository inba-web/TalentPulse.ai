import { PrismaClient, RoleName, OpportunityStatus, JobStatus, PlacementStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
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
  {
    name: 'Apex Finance',
    website: 'https://apexfinance.com',
    employeeSize: 1200,
    industry: 'Financial Services',
    exactAddress: 'Gachibowli, Hyderabad, Telangana 500032',
    latitude: 17.4483,
    longitude: 78.3741,
    contactPerson: 'Amitabh Sharma',
    designation: 'Senior HR Recruiter',
    contactEmail: 'sharma.a@apexfin.com',
    contactMobile: '9998887776',
    status: OpportunityStatus.DRIVE_COMPLETED,
  },
];

async function main() {
  console.log('Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: { code: perm.code, description: perm.description },
    });
  }

  console.log('Seeding role permissions...');
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

  console.log('Seeding departments...');
  const deptMap: Record<string, string> = {};
  for (const dept of DEPARTMENTS) {
    const createdDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { name: dept.name, code: dept.code },
    });
    deptMap[dept.code] = createdDept.id;
  }

  console.log('Seeding administrative users...');
  const defaultHash = await argon2.hash('Password123!');
  const adminHash = await argon2.hash('admin@123');

  const users = [
    { email: 'admin@gmail.com', fullName: 'Admin User', roleName: RoleName.ADMIN, hash: adminHash },
    { email: 'manager@talentpulse.ai', fullName: 'Manager User', roleName: RoleName.MANAGER, hash: defaultHash },
    { email: 'lead@talentpulse.ai', fullName: 'Lead User', roleName: RoleName.LEAD, hash: defaultHash },
    { email: 'recruiter@talentpulse.ai', fullName: 'Recruiter User', roleName: RoleName.RECRUITER, hash: defaultHash },
  ];

  const userMap: Record<string, string> = {};
  for (const u of users) {
    const createdUser = await prisma.user.upsert({
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
    userMap[u.roleName] = createdUser.id;
  }

  console.log('Seeding companies...');
  const companyMap: Record<string, string> = {};
  for (const comp of COMPANIES_SEED) {
    const createdComp = await prisma.company.upsert({
      where: { name: comp.name },
      update: {},
      create: comp,
    });
    companyMap[comp.name] = createdComp.id;
  }

  console.log('Seeding jobs...');
  // Setup Jobs
  const techGiantJob = await prisma.job.create({
    data: {
      companyId: companyMap['TechGiant Corp'],
      jobTitle: 'Software Engineering Associate',
      jdText: 'We are looking for a Software Associate with strong JavaScript, Node.js, and SQL skills. Experience with AWS is a plus.',
      ctc: 12.5,
      location: 'Bangalore',
      status: JobStatus.APPROVED,
      createdById: userMap['LEAD'],
    },
  });

  const innovateAIJob = await prisma.job.create({
    data: {
      companyId: companyMap['InnovateAI Solutions'],
      jobTitle: 'Junior Machine Learning Engineer',
      jdText: 'Python developer with knowledge of PyTorch, Scikit-learn and SQL databases. Will work on training model feeds.',
      ctc: 18.0,
      location: 'Chennai (Onsite)',
      status: JobStatus.PENDING_APPROVAL,
      createdById: userMap['LEAD'],
    },
  });

  const starkJob = await prisma.job.create({
    data: {
      companyId: companyMap['Stark Logistics'],
      jobTitle: 'Operations Analyst',
      jdText: 'Excel parsing, analytical modeling and data dashboarding using Python/Pandas.',
      ctc: 8.0,
      location: 'Mumbai',
      status: JobStatus.DRAFT,
      createdById: userMap['LEAD'],
    },
  });

  const apexJob = await prisma.job.create({
    data: {
      companyId: companyMap['Apex Finance'],
      jobTitle: 'Investment Analyst',
      jdText: 'Quantitative finance model developer. Requires SQL, Excel and strong statistics background.',
      ctc: 15.0,
      location: 'Hyderabad',
      status: JobStatus.APPROVED,
      createdById: userMap['LEAD'],
    },
  });

  console.log('Seeding 100+ fictional students...');
  const departmentsList = Object.keys(deptMap);
  const firstNames = [
    'Arun', 'Bala', 'Chitra', 'Divya', 'Elango', 'Farhan', 'Ganesh', 'Hari', 'Indu', 'Jay',
    'Kavin', 'Latha', 'Mani', 'Nisha', 'Oviya', 'Prabhu', 'Ram', 'Sita', 'Tharun', 'Uma',
    'Vijay', 'Yash', 'Zayan', 'Aishwarya', 'Deepak', 'Gautham', 'Janani', 'Karthik', 'Meena', 'Pranav'
  ];
  const lastNames = [
    'Rajan', 'Kumar', 'Devi', 'Sundar', 'Manian', 'Ali', 'Prasad', 'Krishna', 'Prakash', 'Srinivasan',
    'Chandran', 'Nathan', 'Subramanian', 'Vel', 'Murugan', 'Dharshini', 'Karthikeyan', 'Senthil', 'Shekar', 'Nair'
  ];

  const studentPromises = [];
  for (let i = 1; i <= 105; i++) {
    const rollNo = `23CS${i.toString().padStart(3, '0')}`;
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const fullName = `${fName} ${lName}`;
    const personalEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@gmail.com`;
    const collegeEmail = `${fName.toLowerCase()}.${rollNo.toLowerCase()}@college.edu`;
    const mobileNo = `9840${i.toString().padStart(6, '0')}`;
    const deptCode = departmentsList[i % departmentsList.length];
    const deptId = deptMap[deptCode];
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const hostelStatus = i % 3 === 0 ? 'HOSTEL' : 'DAY_SCHOLAR';

    const sslc = 75 + (i % 21);
    const hsc = 70 + (i % 26);
    const ug = 65 + (i % 31);
    const pg = i % 4 === 0 ? 70 + (i % 21) : null;

    const gitHub = `https://github.com/${fName.toLowerCase()}${i}`;
    const linkedIn = `https://linkedin.com/in/${fName.toLowerCase()}-${lName.toLowerCase()}-${i}`;
    const portfolio = `https://${fName.toLowerCase()}${i}.dev`;

    // Set some students as Placed, Unplaced, or Terminated
    let placementStatus: PlacementStatus = PlacementStatus.YET_TO_BE_PLACED;
    if (i <= 20) {
      placementStatus = PlacementStatus.PLACED;
    } else if (i === 99 || i === 100) {
      placementStatus = PlacementStatus.TERMINATED;
    }

    studentPromises.push(
      prisma.student.create({
        data: {
          rollNumber: rollNo,
          fullName,
          departmentId: deptId,
          gender,
          hostelStatus,
          personalEmail,
          collegeEmail,
          mobileNumber: mobileNo,
          graduationDate: new Date('2027-05-31'),
          placementStatus,
          academics: {
            create: {
              sslcPercentage: sslc,
              hscPercentage: hsc,
              ugPercentage: ug,
              pgPercentage: pg,
            },
          },
          links: {
            create: {
              githubUrl: gitHub,
              linkedinUrl: linkedIn,
              portfolioUrl: portfolio,
            },
          },
        },
      })
    );
  }

  const createdStudents = await Promise.all(studentPromises);
  console.log(`Successfully created ${createdStudents.length} student records.`);

  // Seeding Placement History
  console.log('Seeding placement offers...');
  for (let i = 0; i < 20; i++) {
    const student = createdStudents[i];
    await prisma.studentPlacementHistory.create({
      data: {
        studentId: student.id,
        companyId: companyMap['Apex Finance'],
        jobId: apexJob.id,
        ctc: 15.0,
        status: 'JOINED',
      },
    });
  }

  // Seeding Terminated Students
  console.log('Seeding student terminations...');
  const terminatedStudentIds = createdStudents.filter((s) => s.placementStatus === PlacementStatus.TERMINATED).map((s) => s.id);
  for (const sId of terminatedStudentIds) {
    await prisma.studentTermination.create({
      data: {
        studentId: sId,
        reason: 'Violation of placement conduct during interview rounds.',
        terminatedById: userMap['ADMIN'],
        isActive: true,
      },
    });
  }

  // Seed an active and revoked termination
  const reinstatedStudent = createdStudents[50];
  await prisma.student.update({
    where: { id: reinstatedStudent.id },
    data: { placementStatus: PlacementStatus.YET_TO_BE_PLACED },
  });
  await prisma.studentTermination.create({
    data: {
      studentId: reinstatedStudent.id,
      reason: 'Missing placement orientation session.',
      terminatedById: userMap['ADMIN'],
      terminatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      revokedById: userMap['ADMIN'],
      revokedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: false,
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
