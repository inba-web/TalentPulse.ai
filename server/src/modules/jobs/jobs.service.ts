import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { JobStatus, RoleName } from '@prisma/client';
import { EmailService } from '../../services/email/resend';

export class JobService {
  public static async createJob(data: any, createdById: string) {
    return prisma.job.create({
      data: {
        ...data,
        createdById,
        status: JobStatus.DRAFT,
      },
      include: {
        company: true,
      },
    });
  }

  public static async updateJob(id: string, data: any) {
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new AppError('Job record not found.', 404, 'JOB_NOT_FOUND');

    return prisma.job.update({
      where: { id },
      data,
      include: {
        company: true,
      },
    });
  }

  public static async getJobs(filters: {
    search?: string;
    status?: JobStatus;
    companyId?: string;
    page?: number;
    limit?: number;
    excludeCold?: boolean; // Recruiters cannot see COLD jobs
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.excludeCold) {
      where.company = {
        NOT: { status: 'COLD' },
      };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: true,
          createdBy: { select: { fullName: true, email: true } },
          approval: {
            include: {
              reviewedBy: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  public static async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: { select: { fullName: true, email: true } },
        approval: {
          include: {
            reviewedBy: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!job) throw new AppError('Job record not found.', 404, 'JOB_NOT_FOUND');
    return job;
  }

  /**
   * Forward a job opportunity from DRAFT to PENDING_APPROVAL, notifying Admin.
   */
  public static async forwardToAdmin(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: true,
      },
    });

    if (!job) throw new AppError('Job record not found.', 404, 'JOB_NOT_FOUND');
    if (job.status !== JobStatus.DRAFT) {
      throw new AppError('Only draft opportunities can be forwarded for approval.', 400, 'INVALID_STATUS');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update job status to PENDING_APPROVAL
      const updatedJob = await tx.job.update({
        where: { id },
        data: { status: JobStatus.PENDING_APPROVAL },
        include: { company: true, createdBy: true },
      });

      // 2. Create or reset approval record
      await tx.jobApproval.upsert({
        where: { jobId: id },
        update: {
          submittedAt: new Date(),
          reviewedById: null,
          reviewedAt: null,
          comment: null,
        },
        create: {
          jobId: id,
        },
      });

      // 3. Find administrators to notify
      const admins = await tx.user.findMany({
        where: { roleName: RoleName.ADMIN, isActive: true },
      });

      for (const admin of admins) {
        await EmailService.sendPlacementApprovalRequest(
          admin.email,
          job.jobTitle,
          job.company.name,
          job.createdBy.fullName
        );
      }

      return updatedJob;
    });
  }

  /**
   * Admin approves or rejects a job opportunity.
   */
  public static async reviewJob(id: string, approve: boolean, reviewerId: string, comment?: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: true,
      },
    });

    if (!job) throw new AppError('Job record not found.', 404, 'JOB_NOT_FOUND');
    if (job.status !== JobStatus.PENDING_APPROVAL) {
      throw new AppError('Only pending opportunities can be reviewed.', 400, 'INVALID_STATUS');
    }

    const newStatus = approve ? JobStatus.APPROVED : JobStatus.REJECTED;

    return prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id },
        data: { status: newStatus },
        include: { company: true, createdBy: true },
      });

      await tx.jobApproval.update({
        where: { jobId: id },
        data: {
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          comment,
        },
      });

      // Notify the Lead user who created it
      if (approve) {
        await EmailService.sendPlacementApproved(job.createdBy.email, job.jobTitle, job.company.name, comment);
      } else {
        await EmailService.sendPlacementRejected(job.createdBy.email, job.jobTitle, job.company.name, comment);
      }

      return updatedJob;
    });
  }
}
