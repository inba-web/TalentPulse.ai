import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { catchAsync, AppError } from '../../utils/errors';

export class GlobalSearchController {
  /**
   * Universal global search (Ctrl + K proxy) query.
   */
  public static search = catchAsync(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(200).json({
        success: true,
        data: { STUDENTS: [], COMPANIES: [], USERS: [], JOBS: [] },
      });
    }

    const searchTerm = query.trim();

    // Run parallel search queries across all entities
    const [students, companies, users, jobs] = await Promise.all([
      // 1. Search Students
      prisma.student.findMany({
        where: {
          OR: [
            { rollNumber: { contains: searchTerm, mode: 'insensitive' } },
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { collegeEmail: { contains: searchTerm, mode: 'insensitive' } },
            { mobileNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: { department: { select: { code: true } } },
        take: 5,
      }),

      // 2. Search Companies
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { industry: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // 3. Search Users
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: { id: true, fullName: true, email: true, roleName: true },
        take: 5,
      }),

      // 4. Search Jobs
      prisma.job.findMany({
        where: {
          jobTitle: { contains: searchTerm, mode: 'insensitive' },
        },
        include: { company: { select: { name: true } } },
        take: 5,
      }),
    ]);

    // Group result structures
    res.status(200).json({
      success: true,
      data: {
        STUDENTS: students.map((s) => ({
          id: s.id,
          title: s.rollNumber,
          subtitle: s.fullName,
          tag: s.department.code,
        })),
        COMPANIES: companies.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.industry || 'Business Services',
          tag: c.status,
        })),
        USERS: users.map((u) => ({
          id: u.id,
          title: u.fullName,
          subtitle: u.email,
          tag: u.roleName,
        })),
        JOBS: jobs.map((j) => ({
          id: j.id,
          title: j.jobTitle,
          subtitle: j.company.name,
          tag: j.status,
        })),
      },
    });
  });
}
