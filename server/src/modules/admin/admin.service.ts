import { prisma } from '../../config/db';
import fs from 'fs';
import path from 'path';

export class AdminService {
  /**
   * Retrieves live record counts for all placement & business entities.
   */
  public static async getPlacementCounts() {
    const [
      students,
      companies,
      jobs,
      jds,
      drives,
      placements,
      atsAnalyses,
      businessNotifications,
      systemUsers,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.company.count(),
      prisma.job.count(),
      prisma.job.count({ where: { jdPdfUrl: { not: null } } }),
      prisma.driveStudent.count(),
      prisma.studentPlacementHistory.count(),
      prisma.aTSAnalysis.count(),
      prisma.notification.count(),
      prisma.user.count(),
    ]);

    return {
      students,
      companies,
      jobs,
      jds,
      drives,
      placements,
      atsAnalyses,
      businessNotifications,
      systemUsers,
    };
  }

  /**
   * Safe transactional deletion of placement/business data respecting foreign keys.
   * System users, roles, permissions, sessions, audit logs, and settings remain untouched.
   */
  public static async resetPlacementData() {
    // 1. Capture record counts before deletion
    const beforeCounts = await this.getPlacementCounts();

    // 2. Perform deletion in foreign-key dependent order
    await prisma.$transaction(async (tx) => {
      // Step A: Dependent analysis and histories
      await tx.aTSAnalysis.deleteMany({});
      await tx.studentPlacementHistory.deleteMany({});
      await tx.driveStudent.deleteMany({});
      
      // Step B: Jobs and approvals
      await tx.jobApproval.deleteMany({});
      await tx.job.deleteMany({});
      
      // Step C: Companies & archives
      await tx.companyArchive.deleteMany({});
      await tx.company.deleteMany({});
      
      // Step D: Student dependencies
      await tx.studentTermination.deleteMany({});
      await tx.studentDocument.deleteMany({});
      await tx.studentLinks.deleteMany({});
      await tx.studentAcademics.deleteMany({});
      await tx.student.deleteMany({});
      
      // Step E: Business notifications
      await tx.notification.deleteMany({});
    });

    // 3. Storage cleanup: Clean uploaded files from /uploads directory safely
    const uploadsDir = path.join(__dirname, '../../../../uploads');
    let deletedFilesCount = 0;

    if (fs.existsSync(uploadsDir)) {
      try {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          // Do not delete hidden system files or directory structures
          if (file.startsWith('.')) continue;
          const filePath = path.join(uploadsDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
          }
        }
      } catch (err) {
        console.error('Non-fatal uploads directory cleanup warning:', err);
      }
    }

    // 4. Verify post-reset count state
    const afterCounts = await this.getPlacementCounts();

    return {
      summary: {
        studentsRemoved: beforeCounts.students,
        companiesRemoved: beforeCounts.companies,
        jobsRemoved: beforeCounts.jobs,
        jdsRemoved: beforeCounts.jds,
        drivesRemoved: beforeCounts.drives,
        placementsRemoved: beforeCounts.placements,
        atsAnalysesRemoved: beforeCounts.atsAnalyses,
        businessNotificationsRemoved: beforeCounts.businessNotifications,
        filesDeleted: deletedFilesCount,
        systemUsersPreserved: afterCounts.systemUsers,
      },
      currentCounts: afterCounts,
    };
  }
}
