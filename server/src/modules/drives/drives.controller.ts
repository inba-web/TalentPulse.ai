import { Request, Response } from 'express';
import { DriveService } from './drives.service';
import { catchAsync } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import { DriveStudentStatus } from '@prisma/client';

export class DriveController {
  public static getDriveStudents = catchAsync(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const data = await DriveService.getDriveStudents(jobId, {
      status,
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  public static registerStudents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;
    const { studentIds } = req.body;

    const result = await DriveService.registerStudentsToDrive(jobId, studentIds);

    res.status(201).json({
      success: true,
      data: result,
      message: `${result.successfullyRegistered} candidates registered for drive.`,
    });
  });

  public static updateStudentStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jobId, studentId } = req.params;
    const { status, remarks } = req.body;

    const updated = await DriveService.updateDriveStudentStatus(jobId, studentId, {
      status: status as DriveStudentStatus,
      remarks,
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: `Candidate status updated to ${status}.`,
    });
  });

  public static bulkUpdateStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;
    const { studentIds, status, remarks } = req.body;

    const result = await DriveService.bulkUpdateDriveStudentStatus(
      jobId,
      studentIds,
      status as DriveStudentStatus,
      remarks
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Updated status for ${result.updatedCount} candidates to ${status}.`,
    });
  });

  public static removeStudent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jobId, studentId } = req.params;

    await DriveService.removeDriveStudent(jobId, studentId);

    res.status(200).json({
      success: true,
      message: 'Candidate registration removed from drive.',
    });
  });

  public static getStudentDriveHistory = catchAsync(async (req: Request, res: Response) => {
    const { studentId } = req.params;

    const history = await DriveService.getStudentDriveHistory(studentId);

    res.status(200).json({
      success: true,
      data: history,
    });
  });
}
