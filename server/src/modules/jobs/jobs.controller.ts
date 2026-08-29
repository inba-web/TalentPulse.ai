import { Request, Response } from 'express';
import { JobService } from './jobs.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync, AppError } from '../../utils/errors';
import { createJobSchema, updateJobSchema, approveJobSchema } from './jobs.validator';
import { AuthenticatedRequest } from '../../middleware/auth';
import { JobStatus } from '@prisma/client';
import pdfParse from 'pdf-parse';
import { GeminiProvider } from '../../services/ai/gemini';

export class JobController {
  public static getJobs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const search = req.query.search as string;
    const status = req.query.status as JobStatus;
    const companyId = req.query.companyId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Recruiters cannot view COLD jobs. Verify role
    const excludeCold = req.user?.roleName === 'RECRUITER';

    const data = await JobService.getJobs({
      search,
      status,
      companyId,
      page,
      limit,
      excludeCold,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  public static getJobById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const job = await JobService.getJobById(id);

    res.status(200).json({
      success: true,
      data: { job },
    });
  });

  public static createJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createJobSchema.parse(req.body);
    const creatorId = req.user?.id;

    if (!creatorId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const job = await JobService.createJob(parsed, creatorId);

    await AuditService.log({
      action: 'JOB_CREATED',
      actorId: creatorId,
      entity: 'Job',
      entityId: job.id,
      metadata: { jobTitle: job.jobTitle, company: job.company.name },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(201).json({
      success: true,
      data: { job },
    });
  });

  public static updateJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateJobSchema.parse(req.body);
    const job = await JobService.updateJob(id, parsed);

    await AuditService.log({
      action: 'JOB_UPDATED',
      actorId: req.user?.id,
      entity: 'Job',
      entityId: job.id,
      metadata: { jobTitle: job.jobTitle },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { job },
    });
  });

  public static forwardJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const job = await JobService.forwardToAdmin(id);

    await AuditService.log({
      action: 'JOB_FORWARDED',
      actorId: req.user?.id,
      entity: 'Job',
      entityId: id,
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { job },
    });
  });

  public static reviewJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { approve, comment } = approveJobSchema.parse(req.body);
    const reviewerId = req.user?.id;

    if (!reviewerId) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const job = await JobService.reviewJob(id, approve, reviewerId, comment);

    await AuditService.log({
      action: approve ? 'JOB_APPROVED' : 'JOB_REJECTED',
      actorId: reviewerId,
      entity: 'Job',
      entityId: id,
      metadata: { comment },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { job },
    });
  });

  /**
   * PDF file parser proxy converting JD PDFs to structured JSON via Gemini.
   */
  public static extractJdDetails = catchAsync(async (req: Request, res: Response) => {
    let jdText = '';

    if (req.file) {
      // 1. PDF text extraction
      if (req.file.mimetype !== 'application/pdf') {
        throw new AppError('Only PDF files are supported for extraction.', 400, 'UNSUPPORTED_MIME');
      }

      const parsedPdf = await pdfParse(req.file.buffer);
      jdText = parsedPdf.text || '';
    } else if (req.body.text) {
      jdText = req.body.text;
    }

    if (!jdText || jdText.trim().length === 0) {
      throw new AppError('No job description text detected to extract.', 400, 'EMPTY_CONTENT');
    }

    // 2. Query Gemini Structured extraction
    const extracted = await GeminiProvider.extractJobDetails(jdText);

    res.status(200).json({
      success: true,
      data: {
        extracted,
        rawTextLength: jdText.length,
      },
    });
  });
}
