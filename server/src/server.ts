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

    // Create Notification table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id"          TEXT NOT NULL,
        "title"       TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "type"        TEXT NOT NULL,
        "read"        BOOLEAN NOT NULL DEFAULT false,
        "link"        TEXT NOT NULL,
        "targetRole"  "RoleName",
        "userId"      TEXT,
        "createdAt"   DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `).catch(async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id"          TEXT NOT NULL,
          "title"       TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "type"        TEXT NOT NULL,
          "read"        BOOLEAN NOT NULL DEFAULT false,
          "link"        TEXT NOT NULL,
          "targetRole"  TEXT,
          "userId"      TEXT,
          "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
      `);
    });
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_targetRole_idx" ON "Notification"("targetRole");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
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

    logger.info('Schema auto-migration completed successfully.');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Schema auto-migration warning (non-fatal).');
  }
}

// Start server immediately so health checks & public routes respond without waiting for background DB tasks
const server = app.listen(PORT, () => {
  logger.info(`TalentPulse.ai Server successfully running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  // Run schema migrations and auto-seeding asynchronously in the background
  runSchemaMigrations().catch((err) => {
    logger.warn({ err: err.message }, 'Background schema migration completed with non-fatal warning.');
  });
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

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception thrown');
  process.exit(1);
});
