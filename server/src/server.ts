import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/db';

const PORT = process.env.PORT || 5000;

/**
 * Apply any pending schema changes that cannot be run via prisma migrate
 * in the current environment (e.g., Neon pooler restrictions).
 * All statements are idempotent — safe to run on every startup.
 */
async function runSchemaMigrations() {
  try {
    // Add soft-delete fields to Student if not present
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
    `);
    // Create index on isDeleted if not exists
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Student_isDeleted_idx" ON "Student"("isDeleted");
    `);

    // Create CompanyArchive table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CompanyArchive" (
        "id"             TEXT NOT NULL,
        "originalId"     TEXT NOT NULL,
        "name"           TEXT NOT NULL,
        "website"        TEXT,
        "employeeSize"   INTEGER,
        "industry"       TEXT,
        "exactAddress"   TEXT,
        "latitude"       DOUBLE PRECISION,
        "longitude"      DOUBLE PRECISION,
        "placeId"        TEXT,
        "mapsUrl"        TEXT,
        "contactPerson"  TEXT NOT NULL,
        "designation"    TEXT NOT NULL,
        "contactEmail"   TEXT NOT NULL,
        "contactMobile"  TEXT NOT NULL,
        "status"         TEXT NOT NULL,
        "jobCount"       INTEGER NOT NULL DEFAULT 0,
        "placementCount" INTEGER NOT NULL DEFAULT 0,
        "deletedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedByNote"  TEXT,
        CONSTRAINT "CompanyArchive_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CompanyArchive_originalId_idx" ON "CompanyArchive"("originalId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CompanyArchive_deletedAt_idx" ON "CompanyArchive"("deletedAt");
    `);

    // Purge legacy static ATS analysis cache so dynamic score engine recalculates per candidate
    await prisma.aTSAnalysis.deleteMany({});
    logger.info('Purged legacy static ATS score cache.');

    // Ensure default demo users exist if DB is empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const argon2 = require('argon2');
      const defaultHash = await argon2.hash('Password123!');
      await prisma.user.createMany({
        data: [
          { email: 'admin@talentpulse.ai', fullName: 'Admin User', roleName: 'ADMIN', passwordHash: defaultHash, isEmailVerified: true },
          { email: 'manager@talentpulse.ai', fullName: 'Manager User', roleName: 'MANAGER', passwordHash: defaultHash, isEmailVerified: true },
          { email: 'lead@talentpulse.ai', fullName: 'Lead User', roleName: 'LEAD', passwordHash: defaultHash, isEmailVerified: true },
          { email: 'recruiter@talentpulse.ai', fullName: 'Recruiter User', roleName: 'RECRUITER', passwordHash: defaultHash, isEmailVerified: true },
        ],
        skipDuplicates: true,
      });
      logger.info('Default demo users seeded automatically.');
    }

    // Ensure all demo users (Admin, Manager, Lead, Recruiter) have REPORT_READ & STUDENT_READ permissions to view dashboard stats
    try {
      const allUsers = await prisma.user.findMany();
      const corePermissions = ['REPORT_READ', 'STUDENT_READ', 'COMPANY_READ', 'JOB_READ'];
      for (const u of allUsers) {
        for (const pCode of corePermissions) {
          await prisma.userPermission.upsert({
            where: { userId_permissionCode: { userId: u.id, permissionCode: pCode } },
            create: { userId: u.id, permissionCode: pCode, granted: true },
            update: { granted: true },
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Non-fatal permission grant notice.');
    }

    // Auto-seed / Upsert INBAVARUNAN S student profile
    let dept = await prisma.department.findFirst({
      where: { OR: [{ name: 'Computer Science' }, { code: 'CSE' }, { code: 'CS' }] },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'Computer Science', code: 'CSE' },
      });
    }

    const inbaRoll = 'RCAS2024BCY046';
    const existingInba = await prisma.student.findFirst({
      where: {
        OR: [
          { rollNumber: inbaRoll },
          { personalEmail: 'inbavarunans@gmail.com' },
          { collegeEmail: 'inbavarunans.bcy24@rathinam.in' },
          { mobileNumber: '9876543210' },
        ],
      },
    });

    if (existingInba) {
      // Update existing student record to ensure RCAS2024BCY046 and all fields match
      await prisma.student.update({
        where: { id: existingInba.id },
        data: {
          rollNumber: inbaRoll,
          fullName: 'INBAVARUNAN S',
          departmentId: dept.id,
          gender: 'MALE',
          hostelStatus: 'HOSTEL',
          personalEmail: 'inbavarunans@gmail.com',
          collegeEmail: 'inbavarunans.bcy24@rathinam.in',
          mobileNumber: '9876543210',
          studentPhotoUrl: 'https://drive.google.com/file/d/1fmkUGuUsnWnFfZ_lppA7jv9YFWjNuV7Y/view?usp=sharing',
          selfIntroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          graduationDate: new Date('2027-05-31'),
          placementStatus: 'YET_TO_BE_PLACED',
          isDeleted: false,
          deletedAt: null,
          academics: {
            upsert: {
              create: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
              update: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
            },
          },
          links: {
            upsert: {
              create: {
                githubUrl: 'https://github.com/inba-web',
                linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
                portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
              },
              update: {
                githubUrl: 'https://github.com/inba-web',
                linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
                portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
              },
            },
          },
        },
      });

      await prisma.studentDocument.upsert({
        where: { id: `resume-doc-${existingInba.id}` },
        create: {
          id: `resume-doc-${existingInba.id}`,
          studentId: existingInba.id,
          documentType: 'RESUME',
          fileUrl: 'https://drive.google.com/file/d/1CvljA9jVEZBUpF7dC4IQX-I6rn3CjM2m/view?usp=drive_link',
          fileKey: 'inba-resume-drive-link',
          mimeType: 'application/pdf',
          fileSize: 1024576,
          isLatestResume: true,
        },
        update: {
          fileUrl: 'https://drive.google.com/file/d/1CvljA9jVEZBUpF7dC4IQX-I6rn3CjM2m/view?usp=drive_link',
          isLatestResume: true,
        },
      });

      logger.info('INBAVARUNAN S student profile updated successfully.');

    } else {
      // Create new student record
      await prisma.student.create({
        data: {
          rollNumber: inbaRoll,
          fullName: 'INBAVARUNAN S',
          departmentId: dept.id,
          gender: 'MALE',
          hostelStatus: 'HOSTEL',
          personalEmail: 'inbavarunans@gmail.com',
          collegeEmail: 'inbavarunans.bcy24@rathinam.in',
          mobileNumber: '9876543210',
          studentPhotoUrl: 'https://drive.google.com/file/d/1fmkUGuUsnWnFfZ_lppA7jv9YFWjNuV7Y/view?usp=sharing',
          graduationDate: new Date('2027-05-31'),
          placementStatus: 'YET_TO_BE_PLACED',
          isDeleted: false,
          academics: {
            create: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
          },
          links: {
            create: {
              githubUrl: 'https://github.com/inba-web',
              linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
              portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
            },
          },
          documents: {
            create: {
              documentType: 'RESUME',
              fileUrl: 'https://drive.google.com/file/d/1CvljA9jVEZBUpF7dC4IQX-I6rn3CjM2m/view?usp=drive_link',
              fileKey: 'inba-resume',
              mimeType: 'application/pdf',
              fileSize: 0,
              isLatestResume: true,
            },
          },
        },
      });
      logger.info('INBAVARUNAN S student profile created successfully.');
    }

    logger.info('Schema auto-migration completed successfully.');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Schema auto-migration warning (non-fatal).');
  }

  // Dedicated Auto-seed / Upsert for student INBAVARUNAN S (RCAS2024BCY046)
  try {
    let dept = await prisma.department.findFirst({
      where: { OR: [{ name: 'Computer Science' }, { code: 'CSE' }, { code: 'CS' }] },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'Computer Science', code: 'CSE' },
      });
    }

    const inbaRoll = 'RCAS2024BCY046';
    const existingInba = await prisma.student.findFirst({
      where: {
        OR: [
          { rollNumber: inbaRoll },
          { personalEmail: 'inbavarunans@gmail.com' },
          { collegeEmail: 'inbavarunans.bcy24@rathinam.in' },
          { mobileNumber: '9876543210' },
        ],
      },
    });

    if (existingInba) {
      await prisma.student.update({
        where: { id: existingInba.id },
        data: {
          rollNumber: inbaRoll,
          fullName: 'INBAVARUNAN S',
          departmentId: dept.id,
          gender: 'MALE',
          hostelStatus: 'HOSTEL',
          personalEmail: 'inbavarunans@gmail.com',
          collegeEmail: 'inbavarunans.bcy24@rathinam.in',
          mobileNumber: '9876543210',
          studentPhotoUrl: 'https://drive.google.com/file/d/1fmkUGuUsnWnFfZ_lppA7jv9YFWjNuV7Y/view?usp=sharing',
          graduationDate: new Date('2027-05-31'),
          placementStatus: 'YET_TO_BE_PLACED',
          isDeleted: false,
          deletedAt: null,
          academics: {
            upsert: {
              create: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
              update: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
            },
          },
          links: {
            upsert: {
              create: {
                githubUrl: 'https://github.com/inba-web',
                linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
                portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
              },
              update: {
                githubUrl: 'https://github.com/inba-web',
                linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
                portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
              },
            },
          },
        },
      });
      logger.info('INBAVARUNAN S student profile updated successfully.');
    } else {
      await prisma.student.create({
        data: {
          rollNumber: inbaRoll,
          fullName: 'INBAVARUNAN S',
          departmentId: dept.id,
          gender: 'MALE',
          hostelStatus: 'HOSTEL',
          personalEmail: 'inbavarunans@gmail.com',
          collegeEmail: 'inbavarunans.bcy24@rathinam.in',
          mobileNumber: '9876543210',
          studentPhotoUrl: 'https://drive.google.com/file/d/1fmkUGuUsnWnFfZ_lppA7jv9YFWjNuV7Y/view?usp=sharing',
          graduationDate: new Date('2027-05-31'),
          placementStatus: 'YET_TO_BE_PLACED',
          isDeleted: false,
          academics: {
            create: { sslcPercentage: 91.2, hscPercentage: 89.5, ugPercentage: 82.4 },
          },
          links: {
            create: {
              githubUrl: 'https://github.com/inba-web',
              linkedinUrl: 'https://www.linkedin.com/in/inbavarunan-s',
              portfolioUrl: 'https://inbavarunan-portfolio.vercel.app',
            },
          },
          documents: {
            create: {
              documentType: 'RESUME',
              fileUrl: 'https://drive.google.com/file/d/1CvljA9jVEZBUpF7dC4IQX-I6rn3CjM2m/view?usp=drive_link',
              fileKey: 'inba-resume',
              mimeType: 'application/pdf',
              fileSize: 0,
            },
          },
        },
      });
    }

    logger.info('INBAVARUNAN S student profile initialized.');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to seed INBAVARUNAN S student profile.');
  }

  // Update verified real physical addresses for companies in database
  try {
    const companyUpdates = [
      {
        name: 'Zoho Corporation',
        exactAddress: 'Estancia IT Park, Plot No. 140 & 151, GST Road, Vallanchery, Guduvancheri, Tamil Nadu 603202, India',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Zoho+Corporation+Estancia+IT+Park+GST+Road+Guduvancheri',
      },
      {
        name: 'Google India',
        exactAddress: 'Block 1, Divyasree Omega, Survey No 13, Kothaguda, Hitec City, Kondapur, Hyderabad, Telangana 500084, India',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Google+India+Kothaguda+Hitec+City+Hyderabad',
      },
      {
        name: 'Amazon Development Centre',
        exactAddress: 'Amazon Towers, Financial District, Nanakramguda, Gachibowli, Hyderabad, Telangana 500032, India',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Amazon+Development+Centre+Nanakramguda+Hyderabad',
      },
      {
        name: 'Palo Alto Networks',
        exactAddress: 'Prestige Trade Tower, Palace Road, High Grounds, Sampangi Rama Nagar, Bengaluru, Karnataka 560001, India',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Palo+Alto+Networks+Prestige+Trade+Tower+Bengaluru',
      },
      {
        name: 'TechGiant Corp',
        exactAddress: 'Embassy Tech Village, Outer Ring Road, Devarabeesanahalli, Bengaluru, Karnataka 560103, India',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+Tech+Village+Outer+Ring+Road+Bengaluru',
      },
    ];

    for (const c of companyUpdates) {
      await prisma.company.updateMany({
        where: { name: { contains: c.name.split(' ')[0], mode: 'insensitive' } },
        data: { exactAddress: c.exactAddress, mapsUrl: c.mapsUrl },
      });
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Non-fatal company address update notice.');
  }

  // Auto-seed demo placement records for Zoho Corporation
  try {
    const zoho = await prisma.company.findFirst({
      where: { name: { contains: 'Zoho', mode: 'insensitive' } },
      include: { jobs: true },
    });

    if (zoho && zoho.jobs.length > 0) {
      const inba = await prisma.student.findFirst({
        where: { rollNumber: 'RCAS2024BCY046' },
      });
      const arun = await prisma.student.findFirst({
        where: { rollNumber: '24IT003' },
      });

      const zohoJob = zoho.jobs[0];

      if (inba) {
        await prisma.student.update({
          where: { id: inba.id },
          data: { placementStatus: 'PLACED' },
        });

        const existingPlacementInba = await prisma.studentPlacementHistory.findFirst({
          where: { studentId: inba.id, companyId: zoho.id },
        });

        if (!existingPlacementInba) {
          await prisma.studentPlacementHistory.create({
            data: {
              studentId: inba.id,
              companyId: zoho.id,
              jobId: zohoJob.id,
              ctc: 8.0,
              status: 'OFFERED',
            },
          });
        }
      }

      if (arun) {
        await prisma.student.update({
          where: { id: arun.id },
          data: { placementStatus: 'PLACED' },
        });

        const existingPlacementArun = await prisma.studentPlacementHistory.findFirst({
          where: { studentId: arun.id, companyId: zoho.id },
        });

        if (!existingPlacementArun) {
          await prisma.studentPlacementHistory.create({
            data: {
              studentId: arun.id,
              companyId: zoho.id,
              jobId: zohoJob.id,
              ctc: 8.5,
              status: 'JOINED',
            },
          });
        }
      }
      logger.info('Zoho Corporation placed student records initialized successfully.');
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Non-fatal placement seeding notice.');
  }

  // Auto-seed 24.0 LPA and 20.0 LPA placement offer records for Palo Alto Networks & Google India
  try {
    const paloAlto = await prisma.company.findFirst({
      where: { name: { contains: 'Palo Alto', mode: 'insensitive' } },
      include: { jobs: true },
    });
    const google = await prisma.company.findFirst({
      where: { name: { contains: 'Google', mode: 'insensitive' } },
      include: { jobs: true },
    });

    const swetha = await prisma.student.findFirst({
      where: { rollNumber: '24CY003' },
    });
    const vignesh = await prisma.student.findFirst({
      where: { rollNumber: '24EC003' },
    });

    if (paloAlto && swetha) {
      await prisma.student.update({
        where: { id: swetha.id },
        data: { placementStatus: 'PLACED' },
      });
      await prisma.studentPlacementHistory.upsert({
        where: { id: `placement-24lpa-${swetha.id}` },
        create: {
          id: `placement-24lpa-${swetha.id}`,
          studentId: swetha.id,
          companyId: paloAlto.id,
          jobId: paloAlto.jobs[0]?.id,
          ctc: 24.0,
          status: 'JOINED',
        },
        update: { ctc: 24.0, status: 'JOINED' },
      });
    }

    if (google && vignesh) {
      await prisma.student.update({
        where: { id: vignesh.id },
        data: { placementStatus: 'PLACED' },
      });
      await prisma.studentPlacementHistory.upsert({
        where: { id: `placement-20lpa-${vignesh.id}` },
        create: {
          id: `placement-20lpa-${vignesh.id}`,
          studentId: vignesh.id,
          companyId: google.id,
          jobId: google.jobs[0]?.id,
          ctc: 20.0,
          status: 'OFFERED',
        },
        update: { ctc: 20.0, status: 'OFFERED' },
      });
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Non-fatal 20/24 LPA placement seeding notice.');
  }

  // Auto-seed demo placement drive candidate registrations
  try {
    const jobs = await prisma.job.findMany({ take: 5 });
    const students = await prisma.student.findMany({ where: { isDeleted: false }, take: 10 });
    if (jobs.length > 0 && students.length > 0) {
      for (const job of jobs) {
        for (let i = 0; i < Math.min(students.length, 6); i++) {
          const st = students[i];
          let statusVal: any = 'REGISTERED';
          if (i === 1) statusVal = 'ATTENDED';
          if (i === 2) statusVal = 'SHORTLISTED';
          if (i === 3) statusVal = 'SELECTED';

          await prisma.driveStudent.upsert({
            where: { jobId_studentId: { jobId: job.id, studentId: st.id } },
            create: {
              jobId: job.id,
              studentId: st.id,
              status: statusVal,
              registeredAt: new Date(),
              attendedAt: ['ATTENDED', 'SHORTLISTED', 'SELECTED'].includes(statusVal) ? new Date() : null,
              shortlistedAt: ['SHORTLISTED', 'SELECTED'].includes(statusVal) ? new Date() : null,
              selectedAt: statusVal === 'SELECTED' ? new Date() : null,
            },
            update: {},
          }).catch(() => {});
        }
      }
      logger.info('Sample drive candidate registrations seeded successfully.');
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Non-fatal drive registration seeding notice.');
  }
}

// Run migrations then start server
(async () => {
  await runSchemaMigrations();
  const server = app.listen(PORT, () => {
    logger.info(`TalentPulse.ai Server successfully running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // Graceful shutdown controls
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception thrown');
  process.exit(1);
});
