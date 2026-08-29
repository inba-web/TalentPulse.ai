import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { DriveStudentStatus, PlacementStatus } from '@prisma/client';

export class DriveService {
  public static async getDriveStudents(
    jobId: string,
    query: { status?: string; search?: string; page?: number; limit?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Check job existence
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: { id: true, name: true, website: true, status: true },
        },
      },
    });

    if (!job) {
      throw new AppError('Job placement drive not found.', 404, 'JOB_NOT_FOUND');
    }

    // Build filter
    const where: any = { jobId };
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as DriveStudentStatus;
    }

    if (query.search) {
      where.student = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { rollNumber: { contains: query.search, mode: 'insensitive' } },
          { collegeEmail: { contains: query.search, mode: 'insensitive' } },
          { personalEmail: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [driveStudents, total, statsRaw] = await Promise.all([
      prisma.driveStudent.findMany({
        where,
        include: {
          student: {
            include: {
              department: true,
              academics: true,
              links: true,
              documents: {
                where: { documentType: 'RESUME' },
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { registeredAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.driveStudent.count({ where }),
      prisma.driveStudent.groupBy({
        by: ['status'],
        where: { jobId },
        _count: { _all: true },
      }),
    ]);

    // Aggregate stats
    const stats = {
      totalRegistered: 0,
      totalAttended: 0,
      totalShortlisted: 0,
      totalSelected: 0,
      totalRejected: 0,
      totalCount: 0,
    };

    statsRaw.forEach((s) => {
      const count = s._count._all;
      stats.totalCount += count;
      if (s.status === 'REGISTERED') stats.totalRegistered += count;
      if (s.status === 'ATTENDED') stats.totalAttended += count;
      if (s.status === 'SHORTLISTED') stats.totalShortlisted += count;
      if (s.status === 'SELECTED') stats.totalSelected += count;
      if (s.status === 'REJECTED') stats.totalRejected += count;
    });

    // Attended drives includes ATTENDED, SHORTLISTED, SELECTED
    const aggregateAttended = stats.totalAttended + stats.totalShortlisted + stats.totalSelected;

    return {
      job: {
        id: job.id,
        jobTitle: job.jobTitle,
        ctc: job.ctc,
        location: job.location,
        status: job.status,
        company: job.company,
      },
      stats: {
        ...stats,
        aggregateAttended,
      },
      students: driveStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async registerStudentsToDrive(jobId: string, studentIds: string[]) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new AppError('Job placement drive not found.', 404, 'JOB_NOT_FOUND');
    }

    if (!studentIds || studentIds.length === 0) {
      throw new AppError('At least one student ID must be provided.', 400, 'NO_STUDENTS_PROVIDED');
    }

    // Filter valid non-deleted students
    const validStudents = await prisma.student.findMany({
      where: { id: { in: studentIds }, isDeleted: false },
      select: { id: true },
    });

    const validIds = validStudents.map((s) => s.id);

    if (validIds.length === 0) {
      throw new AppError('No valid active candidates selected.', 400, 'INVALID_STUDENTS');
    }

    // Create registrations with skipDuplicates
    const created = await prisma.driveStudent.createMany({
      data: validIds.map((studentId) => ({
        jobId,
        studentId,
        status: DriveStudentStatus.REGISTERED,
        registeredAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return {
      totalRequested: studentIds.length,
      successfullyRegistered: created.count,
    };
  }

  public static async updateDriveStudentStatus(
    jobId: string,
    studentId: string,
    data: { status: DriveStudentStatus; remarks?: string }
  ) {
    const existing = await prisma.driveStudent.findUnique({
      where: { jobId_studentId: { jobId, studentId } },
      include: { job: true },
    });

    if (!existing) {
      throw new AppError('Student drive registration record not found.', 404, 'REGISTRATION_NOT_FOUND');
    }

    const now = new Date();
    const updatePayload: any = {
      status: data.status,
      remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
    };

    if (data.status === DriveStudentStatus.ATTENDED && !existing.attendedAt) {
      updatePayload.attendedAt = now;
    }
    if (data.status === DriveStudentStatus.SHORTLISTED) {
      if (!existing.attendedAt) updatePayload.attendedAt = now;
      if (!existing.shortlistedAt) updatePayload.shortlistedAt = now;
    }
    if (data.status === DriveStudentStatus.SELECTED) {
      if (!existing.attendedAt) updatePayload.attendedAt = now;
      if (!existing.shortlistedAt) updatePayload.shortlistedAt = now;
      if (!existing.selectedAt) updatePayload.selectedAt = now;
    }

    const updated = await prisma.driveStudent.update({
      where: { jobId_studentId: { jobId, studentId } },
      data: updatePayload,
      include: {
        student: {
          include: { department: true, academics: true },
        },
        job: { include: { company: true } },
      },
    });

    // If SELECTED, sync student placement status and add placement history record
    if (data.status === DriveStudentStatus.SELECTED) {
      await prisma.student.update({
        where: { id: studentId },
        data: { placementStatus: PlacementStatus.PLACED },
      });

      // Check if placement history exists
      const existingHistory = await prisma.studentPlacementHistory.findFirst({
        where: { studentId, jobId },
      });

      if (!existingHistory) {
        await prisma.studentPlacementHistory.create({
          data: {
            studentId,
            companyId: updated.job.companyId,
            jobId,
            ctc: updated.job.ctc,
            status: 'OFFERED',
          },
        });
      }
    }

    return updated;
  }

  public static async bulkUpdateDriveStudentStatus(
    jobId: string,
    studentIds: string[],
    status: DriveStudentStatus,
    remarks?: string
  ) {
    if (!studentIds || studentIds.length === 0) {
      throw new AppError('Select at least one candidate for bulk status update.', 400, 'NO_STUDENTS_SELECTED');
    }

    const results = [];
    for (const studentId of studentIds) {
      try {
        const updated = await this.updateDriveStudentStatus(jobId, studentId, { status, remarks });
        results.push(updated);
      } catch (err) {
        console.error(`Failed to update drive status for student ${studentId}:`, err);
      }
    }

    return {
      updatedCount: results.length,
      requestedCount: studentIds.length,
    };
  }

  public static async removeDriveStudent(jobId: string, studentId: string) {
    const existing = await prisma.driveStudent.findUnique({
      where: { jobId_studentId: { jobId, studentId } },
    });

    if (!existing) {
      throw new AppError('Drive registration not found.', 404, 'NOT_FOUND');
    }

    await prisma.driveStudent.delete({
      where: { jobId_studentId: { jobId, studentId } },
    });

    return { success: true };
  }

  public static async getStudentDriveHistory(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError('Student candidate not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const driveRegistrations = await prisma.driveStudent.findMany({
      where: { studentId },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, website: true, status: true },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    const registeredCount = driveRegistrations.length;
    const attendedCount = driveRegistrations.filter((d) =>
      ['ATTENDED', 'SHORTLISTED', 'SELECTED'].includes(d.status)
    ).length;
    const shortlistedCount = driveRegistrations.filter((d) =>
      ['SHORTLISTED', 'SELECTED'].includes(d.status)
    ).length;
    const selectedCount = driveRegistrations.filter((d) => d.status === 'SELECTED').length;

    return {
      metrics: {
        registeredCount,
        attendedCount,
        shortlistedCount,
        selectedCount,
        placementStatus: student.placementStatus,
      },
      drives: driveRegistrations.map((d) => ({
        id: d.id,
        jobId: d.jobId,
        jobTitle: d.job.jobTitle,
        ctc: d.job.ctc,
        location: d.job.location,
        jobStatus: d.job.status,
        company: d.job.company,
        driveStatus: d.status,
        registeredAt: d.registeredAt,
        attendedAt: d.attendedAt,
        shortlistedAt: d.shortlistedAt,
        selectedAt: d.selectedAt,
        remarks: d.remarks,
      })),
    };
  }
}
