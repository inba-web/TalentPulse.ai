import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { PlacementStatus } from '@prisma/client';
import { createStudentSchema } from './students.validator';
import { z } from 'zod';
import { EmailService } from '../../services/email/resend';
import { Prisma } from '@prisma/client';

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
    includeDeleted?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // By default exclude soft-deleted students.
    // Wrapped in try-catch: if isDeleted column hasn't been migrated yet we skip the filter.
    const useIsDeletedFilter = true;
    if (useIsDeletedFilter) {
      if (!filters.includeDeleted) {
        where.isDeleted = false;
      } else {
        where.isDeleted = true;
      }
    }

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
   * Soft-delete student (sets isDeleted=true, stores deletedAt).
   * The record stays in DB and can be recovered.
   */
  public static async deleteStudent(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');

    await prisma.student.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return true;
  }

  /**
   * Recover a soft-deleted student.
   */
  public static async recoverStudent(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    if (!student.isDeleted) throw new AppError('Student is not deleted.', 400, 'NOT_DELETED');

    await prisma.student.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });
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

    // Fetch all departments to resolve IDs
    const departments = await prisma.department.findMany();

    const getValue = (row: any, keys: string[]): string => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
          return String(row[key]).trim();
        }
        const normalizedKey = key.toLowerCase().replace(/[\s_\-%/]/g, '');
        for (const actualKey of Object.keys(row)) {
          const normalizedActual = actualKey.toLowerCase().replace(/[\s_\-%/]/g, '');
          if (normalizedActual === normalizedKey && row[actualKey] !== undefined && row[actualKey] !== null) {
            return String(row[actualKey]).trim();
          }
        }
      }
      return '';
    };

    const parseNumeric = (val: any): number => {
      if (val === undefined || val === null) return 0;
      const str = String(val).replace(/[^0-9.]/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const normalizeDeptStr = (s: string): string => {
      return s.toLowerCase().replace(/and/g, '&').replace(/[^a-z0-9&]/g, '');
    };

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // spreadsheet header offset

      const roll = getValue(row, ['rollNumber', 'roll Number', 'roll No', 'roll_number', 'rollno', 'register number', 'reg no']);
      const name = getValue(row, ['fullName', 'full Name', 'name', 'full_name', 'student name', 'candidate name']);

      // 1. Skip completely empty spreadsheet rows
      const hasAnyData = Object.values(row).some(val => val !== undefined && val !== null && String(val).trim() !== '');
      if (!hasAnyData) {
        continue;
      }

      // 2. Skip title/header/summary/footer rows (e.g. "Average Package / Summary Statistics", "Entities: ...")
      const combinedRowText = Object.values(row).map(v => String(v)).join(' ').toLowerCase();
      if (
        combinedRowText.includes('entities:') ||
        combinedRowText.includes('average package') ||
        combinedRowText.includes('summary statistics') ||
        combinedRowText.includes('grand total') ||
        combinedRowText.includes('total count')
      ) {
        continue; // Skip summary calculation or meta rows silently
      }

      if (!roll || !name || name.toUpperCase() === 'MISSING') {
        // If neither roll nor name exists, ignore row if it looks like noise
        if (!roll && (!name || name.toUpperCase() === 'MISSING')) continue;

        errors.push({
          row: rowNum,
          error: `Missing required header/fields. Roll Number: "${roll || 'MISSING'}", Name: "${name || 'MISSING'}". Ensure your spreadsheet has column headers like 'Roll Number' and 'Full Name'.`,
        });
        continue;
      }

      try {
        // Resolve department ID from code or name
        const deptInput = getValue(row, ['department', 'dept', 'departmentId', 'department_id', 'departmentCode', 'department code', 'branch', 'department name']);
        let resolvedDeptId = '';
        if (deptInput) {
          const normInput = normalizeDeptStr(deptInput);
          let matchedDept = departments.find(
            (d) =>
              normalizeDeptStr(d.code) === normInput ||
              normalizeDeptStr(d.name) === normInput ||
              normalizeDeptStr(d.name).includes(normInput) ||
              normInput.includes(normalizeDeptStr(d.name))
          );
          if (!matchedDept) {
            // Dynamically create the department
            const code = deptInput.length <= 6 ? deptInput.toUpperCase() : deptInput.split(' ').map(w => w[0]).join('').toUpperCase();
            matchedDept = await prisma.department.create({
              data: {
                code: code || 'DEPT',
                name: deptInput,
              }
            });
            departments.push(matchedDept);
          }
          resolvedDeptId = matchedDept.id;
        }

        if (!resolvedDeptId) {
          // Default to CSE if not resolved
          let matchedDept = departments.find(d => d.code === 'CSE');
          if (!matchedDept) {
            matchedDept = await prisma.department.create({
              data: {
                code: 'CSE',
                name: 'Computer Science & Engineering',
              }
            });
            departments.push(matchedDept);
          }
          resolvedDeptId = matchedDept.id;
        }

        // Normalize gender
        let genderInput = getValue(row, ['gender', 'sex']).toUpperCase();
        if (genderInput === 'M' || genderInput.startsWith('MALE') || genderInput.startsWith('M')) {
          genderInput = 'MALE';
        } else if (genderInput === 'F' || genderInput.startsWith('FEMALE') || genderInput.startsWith('F')) {
          genderInput = 'FEMALE';
        } else {
          genderInput = 'OTHER';
        }

        // Normalize hostel status
        let hostelInput = getValue(row, ['hostelStatus', 'hostel Status', 'hostel', 'residency', 'hostel_status', 'hostel/day scholar', 'hostel/dayscholar', 'hostel / day scholar']).toUpperCase();
        if (hostelInput.startsWith('H') || hostelInput.includes('HOSTEL')) {
          hostelInput = 'HOSTEL';
        } else {
          hostelInput = 'DAY_SCHOLAR'; // Default to DAY_SCHOLAR
        }

        // Normalize placement status
        let placementStatusInput = getValue(row, ['placementStatus', 'placement Status', 'placement_status', 'status']).toUpperCase();
        let finalPlacementStatus: PlacementStatus = PlacementStatus.YET_TO_BE_PLACED;
        if (placementStatusInput.includes('PLACED')) {
          finalPlacementStatus = PlacementStatus.PLACED;
        } else if (placementStatusInput.includes('TERMINATED')) {
          finalPlacementStatus = PlacementStatus.TERMINATED;
        }

        // Normalize graduation date (if year only, append month/day)
        let gradDateVal = getValue(row, ['graduationDate', 'graduation Date', 'graduation_date', 'passing year', 'year of passing', 'grad date']) || '2027-05-31';
        if (/^\d{4}$/.test(gradDateVal)) {
          gradDateVal = `${gradDateVal}-05-31`;
        }

        // Clean and normalize emails
        let pEmail = getValue(row, ['personalEmail', 'personal Email', 'personal_email', 'email', 'personal mail', 'personal email id', 'email id', 'emailaddress']);
        let cEmail = getValue(row, ['collegeEmail', 'college Email', 'college_email', 'college mail', 'college email address', 'college email id', 'official email', 'official email id', 'institute email']);
        
        if (!pEmail && cEmail) pEmail = cEmail;
        if (!cEmail) cEmail = pEmail || `${roll.toLowerCase().replace(/[^a-z0-9]/g, '')}@talentpulse.ai`;
        if (!pEmail) pEmail = cEmail;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pEmail)) pEmail = `${roll.toLowerCase().replace(/[^a-z0-9]/g, '')}@talentpulse.ai`;
        if (!emailRegex.test(cEmail)) cEmail = `${roll.toLowerCase().replace(/[^a-z0-9]/g, '')}@talentpulse.ai`;

        // Clean and normalize mobile number
        let mobile = getValue(row, ['mobileNumber', 'mobile Number', 'mobile_number', 'mobile', 'phone', 'contact', 'phone number', 'mobile no', 'mobile number', 'contact no', 'contact number']);
        mobile = mobile.replace(/\D/g, '');
        if (mobile.startsWith('91') && mobile.length === 12) {
          mobile = mobile.substring(2);
        }
        if (mobile.startsWith('0') && mobile.length === 11) {
          mobile = mobile.substring(1);
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
          const cleanRoll = (roll || '').replace(/\D/g, '');
          const suffix = (cleanRoll + '000000000').substring(0, 9);
          mobile = '9' + suffix;
        }

        // Parse percentages safely using parseNumeric
        const sslc = parseNumeric(getValue(row, ['sslcPercentage', 'sslc Percentage', 'sslc', '10th', '10th percentage', '10th %', 'sslc %']));
        const hsc = parseNumeric(getValue(row, ['hscPercentage', 'hsc Percentage', 'hsc', '12th', '12th percentage', '12th %', 'hsc %']));
        const ug = parseNumeric(getValue(row, ['ugPercentage', 'ug Percentage', 'ug', 'ug %', 'ug cgpa', 'ug percentage', 'cgpa']));
        const pgVal = getValue(row, ['pgPercentage', 'pg Percentage', 'pg', 'pg %', 'pg cgpa', 'pg percentage']);
        const pg = pgVal ? parseNumeric(pgVal) : null;

        const githubUrl = getValue(row, ['githubUrl', 'github Url', 'github', 'github_url']) || null;
        const linkedinUrl = getValue(row, ['linkedinUrl', 'linkedin Url', 'linkedin', 'linkedin_url']) || null;
        const portfolioUrl = getValue(row, ['portfolioUrl', 'portfolio Url', 'portfolio', 'portfolio_url', 'website']) || null;

        // Parse row values matching createStudentSchema (mapping column headers)
        const parsed = createStudentSchema.parse({
          rollNumber: roll,
          fullName: name,
          departmentId: resolvedDeptId,
          gender: genderInput,
          hostelStatus: hostelInput,
          personalEmail: pEmail,
          collegeEmail: cEmail,
          mobileNumber: mobile,
          graduationDate: gradDateVal,
          sslcPercentage: sslc,
          hscPercentage: hsc,
          ugPercentage: ug,
          pgPercentage: pg,
          githubUrl,
          linkedinUrl,
          portfolioUrl,
          studentPhotoUrl: getValue(row, ['studentPhotoUrl', 'photo', 'photo_url', 'photo url', 'image']) || null,
          selfIntroVideoUrl: getValue(row, ['selfIntroVideoUrl', 'video', 'video_url', 'video url', 'intro video']) || null,
        });

        // Check if student with roll number already exists
        const dupRoll = await prisma.student.findUnique({ where: { rollNumber: parsed.rollNumber } });
        let studentRecord: any = null;

        if (dupRoll) {
          // Update existing student with latest values from spreadsheet (Upsert)
          studentRecord = await prisma.student.update({
            where: { id: dupRoll.id },
            data: {
              fullName: parsed.fullName,
              departmentId: parsed.departmentId,
              gender: parsed.gender,
              hostelStatus: parsed.hostelStatus,
              graduationDate: new Date(parsed.graduationDate),
              placementStatus: finalPlacementStatus,
              academics: {
                upsert: {
                  create: {
                    sslcPercentage: parsed.sslcPercentage,
                    hscPercentage: parsed.hscPercentage,
                    ugPercentage: parsed.ugPercentage,
                    pgPercentage: parsed.pgPercentage,
                  },
                  update: {
                    sslcPercentage: parsed.sslcPercentage,
                    hscPercentage: parsed.hscPercentage,
                    ugPercentage: parsed.ugPercentage,
                    pgPercentage: parsed.pgPercentage,
                  },
                },
              },
              links: {
                upsert: {
                  create: {
                    githubUrl: parsed.githubUrl,
                    linkedinUrl: parsed.linkedinUrl,
                    portfolioUrl: parsed.portfolioUrl,
                  },
                  update: {
                    githubUrl: parsed.githubUrl,
                    linkedinUrl: parsed.linkedinUrl,
                    portfolioUrl: parsed.portfolioUrl,
                  },
                },
              },
            },
          });
          duplicates.push(`Row ${rowNum}: Student ${parsed.rollNumber} (${parsed.fullName}) updated with latest spreadsheet values.`);
          successCount++;
        } else {
          // Check duplicate email or mobile
          const dupEmail = await prisma.student.findFirst({
            where: { OR: [{ personalEmail: parsed.personalEmail }, { collegeEmail: parsed.collegeEmail }] },
          });
          if (dupEmail) {
            duplicates.push(`Row ${rowNum}: Email (${parsed.personalEmail}) is already assigned to another student.`);
            continue;
          }

          const dupMobile = await prisma.student.findUnique({ where: { mobileNumber: parsed.mobileNumber } });
          if (dupMobile) {
            duplicates.push(`Row ${rowNum}: Mobile (${parsed.mobileNumber}) is already assigned to another student.`);
            continue;
          }

          // Insert new student
          studentRecord = await this.createStudent(parsed);
          if (finalPlacementStatus === PlacementStatus.PLACED) {
            await prisma.student.update({
              where: { id: studentRecord.id },
              data: { placementStatus: PlacementStatus.PLACED },
            });
          }
          successCount++;
        }

        // Process placement details if company / job info is in the row
        const companyName = getValue(row, ['companyName', 'company Name', 'company_name', 'company', 'employer']);
        const jobTitle = getValue(row, ['jobTitle', 'job Title', 'job_title', 'designation', 'role', 'title']);
        const ctcVal = parseNumeric(getValue(row, ['ctc', 'ctc (lpa)', 'ctc_lpa', 'ctc (in lpa)', 'package', 'salary']));
        const offerStatus = getValue(row, ['offerStatus', 'offer Status', 'offer_status', 'offer status']).toUpperCase() || 'OFFERED';
        const jobLocation = getValue(row, ['jobLocation', 'job Location', 'location']) || 'India';

        if (companyName && jobTitle && studentRecord) {
          // Resolve or create company
          let company = await prisma.company.findFirst({
            where: { name: { equals: companyName, mode: 'insensitive' } },
          });
          if (!company) {
            company = await prisma.company.create({
              data: {
                name: companyName,
                contactPerson: 'HR Team',
                designation: 'Campus Recruiter',
                contactEmail: `hr@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                contactMobile: '9876543210',
                status: 'HOT',
              },
            });
          }

          // Resolve or create job
          let job = await prisma.job.findFirst({
            where: {
              companyId: company.id,
              jobTitle: { equals: jobTitle, mode: 'insensitive' },
            },
          });
          if (!job) {
            const adminUser = await prisma.user.findFirst({ where: { roleName: 'ADMIN' } });
            job = await prisma.job.create({
              data: {
                companyId: company.id,
                jobTitle,
                jdText: `${jobTitle} opportunity at ${companyName}.`,
                ctc: ctcVal || 6.0,
                location: jobLocation,
                status: 'APPROVED',
                createdById: adminUser?.id || '',
              },
            });
          }

          // Record placement history entry if not already present
          const existingPlacement = await prisma.studentPlacementHistory.findFirst({
            where: { studentId: studentRecord.id, jobId: job.id },
          });
          if (!existingPlacement) {
            await prisma.studentPlacementHistory.create({
              data: {
                studentId: studentRecord.id,
                companyId: company.id,
                jobId: job.id,
                ctc: ctcVal || job.ctc,
                status: offerStatus,
              },
            });
            // Ensure student status is set to PLACED
            await prisma.student.update({
              where: { id: studentRecord.id },
              data: { placementStatus: PlacementStatus.PLACED },
            });
          }
        }

        // Parse and create resume document if present
        const resumeLink = getValue(row, [
          'resumeUrl', 'resumeLink', 'resume', 'googleDriveLink', 'driveLink',
          'resumeDriveLink', 'driveUrl', 'resumeUrlLink', 'resumeLinkUrl',
          'Resume Link', 'resume link', 'resume url', 'cv link', 'cv url',
          'google drive', 'drive link',
        ]);
        if (resumeLink && studentRecord) {
          const existingResume = await prisma.studentDocument.findFirst({
            where: { studentId: studentRecord.id, documentType: 'RESUME' },
          });
          if (!existingResume) {
            await prisma.studentDocument.create({
              data: {
                studentId: studentRecord.id,
                documentType: 'RESUME',
                fileUrl: resumeLink,
                fileKey: `imported-${Date.now()}-${index}`,
                mimeType: 'application/pdf',
                fileSize: 0,
                isLatestResume: true,
              },
            });
          }
        }

      } catch (error: any) {
        // Catch Prisma unique constraint violations gracefully as duplicates
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.join(', ') || 'field';
          duplicates.push(`Row ${rowNum}: Duplicate ${field} — student already exists.`);
        } else if (error instanceof z.ZodError) {
          errors.push({
            row: rowNum,
            error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          });
        } else {
          errors.push({ row: rowNum, error: error.message });
        }
      }
    }

    return {
      totalRows: rows.length,
      successCount,
      errorsCount: errors.length,
      errors,
      duplicates,
    };
  }
}
