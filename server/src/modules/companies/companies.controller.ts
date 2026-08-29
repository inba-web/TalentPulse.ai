import { Request, Response } from 'express';
import { CompanyService } from './companies.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync, AppError } from '../../utils/errors';
import { prisma } from '../../config/db';
import { createCompanySchema, updateCompanySchema } from './companies.validator';
import { AuthenticatedRequest } from '../../middleware/auth';
import { OpportunityStatus } from '@prisma/client';

export class CompanyController {
  public static getCompanies = catchAsync(async (req: Request, res: Response) => {
    const search = req.query.search as string;
    const status = req.query.status as OpportunityStatus;
    const industry = req.query.industry as string;
    const employeeSizeTier = req.query.employeeSizeTier as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await CompanyService.getCompanies({
      search,
      status,
      industry,
      employeeSizeTier,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });

  public static getCompanyById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await CompanyService.getCompanyById(id);

    res.status(200).json({
      success: true,
      data: { company },
    });
  });

  public static createCompany = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createCompanySchema.parse(req.body);
    const company = await CompanyService.createCompany(parsed);

    await AuditService.log({
      action: 'COMPANY_CREATED',
      actorId: req.user?.id,
      entity: 'Company',
      entityId: company.id,
      metadata: { name: company.name },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(201).json({
      success: true,
      data: { company },
    });
  });

  public static updateCompany = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = updateCompanySchema.parse(req.body);
    const company = await CompanyService.updateCompany(id, parsed);

    await AuditService.log({
      action: 'COMPANY_UPDATED',
      actorId: req.user?.id,
      entity: 'Company',
      entityId: company.id,
      metadata: { name: company.name },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { company },
    });
  });

  public static searchLocations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const name = req.query.name as string;
    const location = req.query.location as string;

    if (!name || !location) {
      throw new AppError('Name and location are required query parameters.', 400, 'BAD_REQUEST');
    }

    const candidates = await CompanyService.searchLocations(name, location);

    res.status(200).json({
      success: true,
      data: { candidates },
    });
  });

  public static resolveLocation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, placeId } = req.body;

    if (!companyId || !placeId) {
      throw new AppError('companyId and placeId are required fields.', 400, 'BAD_REQUEST');
    }

    const company = await CompanyService.resolveCompanyLocation(companyId, placeId);

    await AuditService.log({
      action: 'COMPANY_LOCATION_RESOLVED',
      actorId: req.user?.id,
      entity: 'Company',
      entityId: companyId,
      metadata: { address: company.exactAddress },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      data: { company },
    });
  });

  public static deleteCompany = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await CompanyService.deleteCompany(id);

    await AuditService.log({
      action: 'COMPANY_DELETED',
      actorId: req.user?.id,
      entity: 'Company',
      entityId: id,
      metadata: { id },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: 'Company record deleted successfully.',
    });
  });

  public static getIndustries = catchAsync(async (req: Request, res: Response) => {
    const companies = await prisma.company.findMany({
      select: { industry: true },
      distinct: ['industry'],
      where: { industry: { not: null } },
    });
    const industries = companies.map((c: any) => c.industry).filter(Boolean);
    res.status(200).json({
      success: true,
      data: industries,
    });
  });
}
