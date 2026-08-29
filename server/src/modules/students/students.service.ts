import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { PlacementStatus } from '@prisma/client';
import { createStudentSchema } from './students.validator';
import { z } from 'zod';
import { EmailService } from '../../services/email/resend';

export class StudentService {
  /**
   * Create student with nested academics and links inside a Prisma transaction.
   */
  public static async createStudent(data: z.infer<typeof createStudentSchema>) {
    // Check uniqueness
    const existingRoll = await prisma.student.findUnique({ where: { rollNumber: data.rollNumber } });
    if (existingRoll) throw new AppError('Roll number already exists.', 400, 'ROLL_NUMBER_EXISTS');

    const existingEmail = await prisma.student.findFirst({
      where: { OR: [{ personalEmail: data.personalEmail }, { collegeEmail: data.collegeEmail }] },
    });
    if (existingEmail) throw new AppError('Email address already associated with another student.', 400, 'EMAIL_EXISTS');

    return prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          rollNumber: data.rollNumber,
          fullName: data.fullName,
          departmentId: data.departmentId,
          gender: data.gender,
          hostelStatus: data.hostelStatus,
          personalEmail: data.personalEmail,
          collegeEmail: data.collegeEmail,
          mobileNumber: data.mobileNumber,
          graduationDate: data.graduationDate,
          studentPhotoUrl: data.studentPhotoUrl,
          selfIntroVideoUrl: data.selfIntroVideoUrl,
          academics: {
            create: {
              sslcPercentage: data.sslcPercentage,
              hscPercentage: data.hscPercentage,
              ugPercentage: data.ugPercentage,
              pgPercentage: data.pgPercentage,
            },
          },
          links: {
            create: {
              githubUrl: data.githubUrl,
              linkedinUrl: data.linkedinUrl,
              portfolioUrl: data.portfolioUrl,
            },
          },
        },
        include: {
          academics: true,
          links: true,
        },
      });

      return student;
    });
  }

  /**
   * Update student details inside a Prisma transaction.
   */
  public static async updateStudent(studentId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      // Split off academic and links data
      const {
        sslcPercentage,
        hscPercentage,
        ugPercentage,
        pgPercentage,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        ...coreData
      } = data;

      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          ...coreData,
          academics: {
            update: {
              sslcPercentage,
              hscPercentage,
              ugPercentage,
              pgPercentage,
            },
          },
          links: {
            update: {
              githubUrl,
              linkedinUrl,
              portfolioUrl,
            },
          },
        },
        include: {
          academics: true,
          links: true,
        },
      });

      return updatedStudent;
    });
  }

  /**
   * Fetch paginated student records with multiple search and category filters.
   */
  public static async getStudents(filters: {
    search?: string;
    departmentId?: string;
    placementStatus?: PlacementStatus;
    gender?: string;
    hostelStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { rollNumber: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { personalEmail: { contains: filters.search, mode: 'insensitive' } },
        { collegeEmail: { contains: filters.search, mode: 'insensitive' } },
        { mobileNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.placementStatus) where.placementStatus = filters.placementStatus;
    if (filters.gender) where.gender = filters.gender;
    if (filters.hostelStatus) where.hostelStatus = filters.hostelStatus;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          department: true,
          academics: true,
          links: true,
        },
        orderBy: { rollNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
  }

  /**
   * Retrieve a student profile along with related documents, history, and placement details.
   */
  public static async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        academics: true,
        links: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        terminations: {
          include: {
            terminatedBy: { select: { fullName: true, email: true } },
            revokedBy: { select: { fullName: true, email: true } },
          },
          orderBy: { terminatedAt: 'desc' },
        },
        placementHistory: {
          include: {
            company: { select: { name: true, exactAddress: true } },
            job: { select: { jobTitle: true } },
          },
          orderBy: { placedAt: 'desc' },
        },
        atsAnalyses: {
          include: {
            job: {
              select: {
                jobTitle: true,
                company: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    }

    return student;
  }

  /**
   * Delete student from database.
   */
  public static async deleteStudent(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');

    await prisma.student.delete({ where: { id } });
    return true;
  }

  /**
   * Terminate student placement eligibility.
   */
  public static async terminateStudent(studentId: string, reason: string, adminId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');

    if (student.placementStatus === PlacementStatus.TERMINATED) {
      throw new AppError('Student is already terminated.', 400, 'ALREADY_TERMINATED');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create termination record
      const term = await tx.studentTermination.create({
        data: {
          studentId,
          reason,
          terminatedById: adminId,
          isActive: true,
        },
      });

      // 2. Set student status to TERMINATED
      await tx.student.update({
        where: { id: studentId },
        data: { placementStatus: PlacementStatus.TERMINATED },
      });

      // Send email notification
      await EmailService.sendStudentTerminated(student.collegeEmail, student.fullName, student.rollNumber, reason);
      await EmailService.sendStudentTerminated(student.personalEmail, student.fullName, student.rollNumber, reason);

      return term;
    });
  }

  /**
   * Revoke student placement termination.
   */
  public static async revokeTermination(studentId: string, adminId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        terminations: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    if (student.placementStatus !== PlacementStatus.TERMINATED || student.terminations.length === 0) {
      throw new AppError('Student eligibility is not currently terminated.', 400, 'NOT_TERMINATED');
    }

    const activeTermination = student.terminations[0];

    return prisma.$transaction(async (tx) => {
      // 1. Update termination record
      await tx.studentTermination.update({
        where: { id: activeTermination.id },
        data: {
          isActive: false,
          revokedById: adminId,
          revokedAt: new Date(),
        },
      });

      // 2. Revert student status
      // We check if student has any prior offers to revert to PLACED, else YET_TO_BE_PLACED
      const offersCount = await tx.studentPlacementHistory.count({ where: { studentId } });
      const newStatus = offersCount > 0 ? PlacementStatus.PLACED : PlacementStatus.YET_TO_BE_PLACED;

      await tx.student.update({
        where: { id: studentId },
        data: { placementStatus: newStatus },
      });

      // Send email notification
      await EmailService.sendStudentTerminationRevoked(student.collegeEmail, student.fullName, student.rollNumber);
      await EmailService.sendStudentTerminationRevoked(student.personalEmail, student.fullName, student.rollNumber);

      return true;
    });
  }

  /**
   * Import students list in a transaction, performing row-level validations and duplicate screening.
   */
  public static async importStudents(rows: any[]) {
    let successCount = 0;
    const errors: { row: number; error: string }[] = [];
    const duplicates: string[] = [];

    // Parse whitelisted domains or configurations if needed, here we validate via schema
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // spreadsheet header is row 1

      try {
        // Parse row values matching createStudentSchema (mapping column headers)
        const parsed = createStudentSchema.parse({
          rollNumber: String(row.rollNumber || ''),
          fullName: String(row.fullName || ''),
          departmentId: String(row.departmentId || ''),
          gender: String(row.gender || '').toUpperCase(),
          hostelStatus: String(row.hostelStatus || '').toUpperCase().replace(' ', '_'),
          personalEmail: String(row.personalEmail || ''),
          collegeEmail: String(row.collegeEmail || ''),
          mobileNumber: String(row.mobileNumber || ''),
          graduationDate: String(row.graduationDate || '2027-05-31'),
          sslcPercentage: Number(row.sslcPercentage ?? 0),
          hscPercentage: Number(row.hscPercentage ?? 0),
          ugPercentage: Number(row.ugPercentage ?? 0),
          pgPercentage: row.pgPercentage ? Number(row.pgPercentage) : null,
          githubUrl: row.githubUrl || null,
          linkedinUrl: row.linkedinUrl || null,
          portfolioUrl: row.portfolioUrl || null,
          studentPhotoUrl: row.studentPhotoUrl || null,
          selfIntroVideoUrl: row.selfIntroVideoUrl || null,
        });

        // Unique checks
        const dupRoll = await prisma.student.findUnique({ where: { rollNumber: parsed.rollNumber } });
        if (dupRoll) {
          duplicates.push(`Row ${rowNum}: Roll number ${parsed.rollNumber} is a duplicate.`);
          continue;
        }

        const dupEmail = await prisma.student.findFirst({
          where: { OR: [{ personalEmail: parsed.personalEmail }, { collegeEmail: parsed.collegeEmail }] },
        });
        if (dupEmail) {
          duplicates.push(`Row ${rowNum}: Email is already registered.`);
          continue;
        }

        // Insert
        await this.createStudent(parsed);
        successCount++;
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: rowNum,
            error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          } as any);
        } else {
          errors.push({ row: rowNum, error: error.message } as any);
        }
      }
    }

    return {
      totalRows: rows.length,
      successCount,
      errorsCount: errors.length + duplicates.length,
      errors,
      duplicates,
    };
  }
}
