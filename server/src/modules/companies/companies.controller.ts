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

  public static importCompanies = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('Excel file is required for import.', 400, 'FILE_REQUIRED');
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new AppError('No worksheets found in uploaded Excel file.', 400, 'INVALID_EXCEL');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rows || rows.length === 0) {
      throw new AppError('The Excel worksheet is empty.', 400, 'EMPTY_FILE');
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errorDetails: { row: number; companyName: string; reason: string }[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNumber = idx + 2; // 1-indexed header offset

      // Flexible column key resolution
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          const match = Object.keys(row).find(
            (rk) => rk.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
            return String(row[match]).trim();
          }
        }
        return '';
      };

      const name = getVal(['Company Name', 'CompanyName', 'Company', 'Name', 'Organization']);
      if (!name) {
        skippedCount++;
        errorDetails.push({ row: rowNumber, companyName: 'Unknown', reason: 'Missing mandatory Company Name' });
        continue;
      }

      const website = getVal(['Website', 'URL', 'Web', 'Company Website']) || null;
      const industry = getVal(['Industry', 'Sector', 'Domain']) || 'Corporate Partner';
      const contactPerson = getVal(['Contact Person', 'Recruiter Name', 'HR Name', 'Contact', 'Person']) || 'HR Manager';
      const designation = getVal(['Designation', 'Title', 'Role', 'Contact Designation']) || 'Talent Acquisition Lead';
      const contactEmail = getVal(['Contact Email', 'Email', 'HR Email', 'Email Address']) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@talentpulse.ai`;
      const contactMobile = getVal(['Contact Mobile', 'Mobile', 'Phone', 'Contact Number']) || '9876543210';
      const exactAddress = getVal(['Address', 'Location', 'Headquarters', 'HQ', 'City', 'Place']) || null;
      
      const rawStatus = getVal(['Status', 'Pipeline', 'Company Status']).toUpperCase();
      let status: OpportunityStatus = OpportunityStatus.COLD;
      if (rawStatus.includes('HOT')) status = OpportunityStatus.HOT;
      else if (rawStatus.includes('WARM')) status = OpportunityStatus.WARM;
      else if (rawStatus.includes('DRIVE') || rawStatus.includes('COMPLETED')) status = OpportunityStatus.DRIVE_COMPLETED;
      else if (rawStatus.includes('COLD')) status = OpportunityStatus.COLD;

      const empSizeVal = parseInt(getVal(['Employee Size', 'Size', 'Employees', 'Company Size']));
      const employeeSize = !isNaN(empSizeVal) && empSizeVal > 0 ? empSizeVal : 250;

      try {
        const existing = await prisma.company.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: 'insensitive' } },
              { contactEmail: { equals: contactEmail, mode: 'insensitive' } },
            ],
          },
        });

        if (existing) {
          await prisma.company.update({
            where: { id: existing.id },
            data: {
              website: website || existing.website,
              industry: industry || existing.industry,
              contactPerson: contactPerson || existing.contactPerson,
              designation: designation || existing.designation,
              contactEmail: contactEmail || existing.contactEmail,
              contactMobile: contactMobile || existing.contactMobile,
              exactAddress: exactAddress || existing.exactAddress,
              status,
              employeeSize,
            },
          });
          updatedCount++;
        } else {
          await prisma.company.create({
            data: {
              name,
              website,
              industry,
              contactPerson,
              designation,
              contactEmail,
              contactMobile,
              exactAddress,
              status,
              employeeSize,
            },
          });
          createdCount++;
        }
      } catch (err: any) {
        skippedCount++;
        errorDetails.push({ row: rowNumber, companyName: name, reason: err.message || 'Database write error' });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRows: rows.length,
        validRows: createdCount + updatedCount,
        invalidRows: skippedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errorDetails,
      },
    });
  });
}

