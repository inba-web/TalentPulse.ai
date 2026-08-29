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

    // Auto-seed INBAVARUNAN S student profile if not present
    let dept = await prisma.department.findFirst({ where: { name: 'Computer Science' } });
    if (!dept) {
      dept = await prisma.department.findFirst({ where: { code: 'CSE' } });
    }
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'Computer Science', code: 'CS' },
      });
    }

    const inbaRoll = 'RCAS2024BCY046';
    const existingInba = await prisma.student.findUnique({ where: { rollNumber: inbaRoll } });

    if (!existingInba) {
      // Check if email or mobile already registered under different roll
      await prisma.student.deleteMany({
        where: {
          OR: [
            { personalEmail: 'inbavarunans@gmail.com' },
            { collegeEmail: 'inbavarunans.bcy24@rathinam.in' },
            { mobileNumber: '9876543210' },
          ],
        },
      });

      const student = await prisma.student.create({
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
          academics: {
            create: {
              sslcPercentage: 91.2,
              hscPercentage: 89.5,
              ugPercentage: 82.4,
            },
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
      logger.info(`Student profile ${student.rollNumber} (${student.fullName}) seeded successfully.`);
    }

    logger.info('Schema auto-migration completed successfully.');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Schema auto-migration warning (non-fatal).');
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
