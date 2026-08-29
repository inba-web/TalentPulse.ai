import { Request, Response } from 'express';
import { AtsService } from './ats.service';
import { catchAsync, AppError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AtsController {
  /**
   * Directly upload a resume and match against a job.
   */
  public static analyzeResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { studentId, jobId } = req.body;

    if (!studentId || !jobId) {
      throw new AppError('studentId and jobId are required fields.', 400, 'BAD_REQUEST');
    }

    const fileBuffer = req.file?.buffer;
    const analysis = await AtsService.analyzeResume(studentId, jobId, fileBuffer);

    res.status(200).json({
      success: true,
      data: { analysis },
    });
  });

  /**
   * Run match evaluations and retrieve ranked candidate list for a specific job.
   */
  public static getJobCandidates = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id: jobId } = req.params;
    
    const candidates = await AtsService.getRankedCandidatesForJob(jobId);

    res.status(200).json({
      success: true,
      data: { candidates },
    });
  });

  /**
   * Run standalone JD matching for all eligible students.
   */
  public static analyzeJdForCandidates = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jdText } = req.body;
    const fileBuffer = req.file?.buffer;

    const candidates = await AtsService.analyzeJdForCandidates(jdText, fileBuffer);

    res.status(200).json({
      success: true,
      data: { candidates },
    });
  });
}
