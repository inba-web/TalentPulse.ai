import { Request, Response } from 'express';
import { StudentService } from './students.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync, AppError } from '../../utils/errors';
import { createStudentSchema, updateStudentSchema, terminateStudentSchema } from './students.validator';
import { AuthenticatedRequest } from '../../middleware/auth';
import { PlacementStatus } from '@prisma/client';
import xlsx from 'xlsx';
import { EmailService } from '../../services/email/resend';

export class StudentController {
  public static getStudents = catchAsync(async (req: Request, res: Response) => {
    const search = req.query.search as string;
    const departmentId = req.query.departmentId as string;
    const placementStatus = req.query.placementStatus as PlacementStatus;
    const gender = req.query.gender as string;
    const hostelStatus = req.query.hostelStatus as string;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await StudentService.getStudents({
      search,
      departmentId,
      placementStatus,
      gender,
      hostelStatus,
      page,
      limit,
      includeDeleted,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  public static getStudentById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const student = await StudentService.getStudentById(id);

    res.status(200).json({
      success: true,
      data: { student },
    });
  });

  public static createStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createStudentSchema.parse(req.body);
    const student = await StudentService.createStudent(parsed);

    await AuditService.log({
      action: 'STUDENT_CREATED',
      actorId: req.user?.id,
      entity: 'Student',
      entityId: student.id,
      metadata: { rollNumber: student.rollNumber, name: student.fullName },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(201).json({
      success: true,
      data: { student },
    });
  });

  public static updateStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateStudentSchema.parse(req.body);
    const student = await StudentService.updateStudent(id, parsed);

    await AuditService.log({
      action: 'STUDENT_UPDATED',
      actorId: req.user?.id,
      entity: 'Student',
      entityId: student.id,
      metadata: { rollNumber: student.rollNumber },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { student },
    });
  });

  public static deleteStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Fetch details for logging before deleting
    const student = await StudentService.getStudentById(id);
    await StudentService.deleteStudent(id);

    await AuditService.log({
      action: 'STUDENT_DELETED',
      actorId: req.user?.id,
      entity: 'Student',
      entityId: id,
      metadata: { rollNumber: student.rollNumber, name: student.fullName },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully.',
    });
  });

  public static terminateStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = terminateStudentSchema.parse(req.body);
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError('Authentication mismatch.', 401, 'UNAUTHORIZED');
    }

    const termination = await StudentService.terminateStudent(id, parsed.reason, adminId);

    await AuditService.log({
      action: 'STUDENT_TERMINATED',
      actorId: adminId,
      entity: 'Student',
      entityId: id,
      metadata: { reason: parsed.reason },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { termination },
    });
  });

  public static revokeTermination = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError('Authentication mismatch.', 401, 'UNAUTHORIZED');
    }

    await StudentService.revokeTermination(id, adminId);

    await AuditService.log({
      action: 'TERMINATION_REVOKED',
      actorId: adminId,
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: 'Placement eligibility has been successfully reinstated.',
    });
  });

  public static recoverStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError('Authentication mismatch.', 401, 'UNAUTHORIZED');
    }

    await StudentService.recoverStudent(id);

    await AuditService.log({
      action: 'STUDENT_RECOVERED',
      actorId: adminId,
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: 'Student record has been successfully recovered.',
    });
  });

  public static importStudents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('Spreadsheet workbook file is required.', 400, 'FILE_REQUIRED');
    }

    // Parse Excel/CSV using xlsx library
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get all rows as raw arrays to scan for the header row index
    const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    let headerRowIndex = 0;
    
    // Scan the first 10 rows for fields containing 'roll' or 'name'
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i];
      if (Array.isArray(row)) {
        const hasRoll = row.some(cell => cell && String(cell).toLowerCase().replace(/[\s_\-%/]/g, '').includes('roll'));
        const hasName = row.some(cell => cell && String(cell).toLowerCase().replace(/[\s_\-%/]/g, '').includes('name'));
        if (hasRoll || hasName) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });

    if (rows.length === 0) {
      throw new AppError('No records found in the spreadsheet.', 400, 'EMPTY_FILE');
    }

    const result = await StudentService.importStudents(rows);

    await AuditService.log({
      action: 'STUDENT_IMPORTED',
      actorId: req.user?.id,
      entity: 'Import',
      metadata: {
        totalRows: result.totalRows,
        successCount: result.successCount,
        errorsCount: result.errorsCount,
      },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    // Notify uploader via email template
    if (req.user?.email) {
      await EmailService.sendStudentImportCompleted(
        req.user.email,
        result.totalRows,
        result.successCount,
        result.errorsCount
      );
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public static getDepartments = catchAsync(async (req: Request, res: Response) => {
    const { prisma } = require('../../config/db');
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({
      success: true,
      data: departments,
    });
  });
}
