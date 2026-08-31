import { Request, Response } from 'express';
import { CompanyService } from './companies.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync, AppError } from '../../utils/errors';
import { prisma } from '../../config/db';
import { createCompanySchema, updateCompanySchema } from './companies.validator';
import { AuthenticatedRequest } from '../../middleware/auth';
import { OpportunityStatus, JobStatus } from '@prisma/client';

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

    // Read raw rows to auto-detect header row index
    const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    let headerRowIndex = 0;

    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
      const row = rawRows[i];
      if (Array.isArray(row)) {
        const rowStr = row.map((c) => String(c || '').toLowerCase()).join(' ');
        const hasCompany = rowStr.includes('company name') || rowStr.includes('company') || rowStr.includes('organization') || rowStr.includes('corporate');
        const hasRoleOrStatus = rowStr.includes('role') || rowStr.includes('title') || rowStr.includes('status') || rowStr.includes('ctc') || rowStr.includes('s.no') || rowStr.includes('sno') || rowStr.includes('placed');
        if (hasCompany && hasRoleOrStatus) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const rows: any[] = xlsx.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });

    if (!rows || rows.length === 0) {
      throw new AppError('The Excel worksheet is empty.', 400, 'EMPTY_FILE');
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let processedRowsCount = 0;
    const errorDetails: { row: number; companyName: string; reason: string }[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNumber = headerRowIndex + 2 + idx; // 1-indexed row number in Excel

      // 1. Skip completely empty rows
      const hasAnyData = Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '');
      if (!hasAnyData) {
        continue;
      }

      // 2. Skip metadata / header / summary footer rows
      const combinedRowText = Object.values(row).map((v) => String(v)).join(' ').toLowerCase();
      if (
        combinedRowText.includes('prisma schema entities:') ||
        combinedRowText.includes('corporate placement directory') ||
        combinedRowText.includes('overall average') ||
        combinedRowText.includes('summary statistics') ||
        combinedRowText.includes('grand total')
      ) {
        continue;
      }

      // Flexible column key resolution
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          const targetNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = Object.keys(row).find(
            (rk) => rk.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === targetNorm
          );
          if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
            return String(row[match]).trim();
          }
        }
        return '';
      };

      const name = getVal(['Company Name', 'CompanyName', 'Company', 'Name', 'Organization', 'Corporate Partner']);
      if (!name) {
        if (combinedRowText.includes('average') || combinedRowText.includes('total') || combinedRowText.includes('overall')) {
          continue;
        }
        skippedCount++;
        errorDetails.push({ row: rowNumber, companyName: 'Unknown', reason: 'Missing mandatory Company Name' });
        continue;
      }

      processedRowsCount++;

      const website = getVal(['Official Careers Link', 'Careers Link', 'Careers', 'Website', 'URL', 'Web', 'Company Website']) || null;
      const industry = getVal(['Industry', 'Sector', 'Domain']) || 'Corporate Partner';
      const contactPerson = getVal(['Contact Person', 'Recruiter Name', 'HR Name', 'Contact', 'Person']) || 'HR Manager';
      const designation = getVal(['Designation', 'Title', 'Role', 'Contact Designation']) || 'Talent Acquisition Lead';
      const contactEmail = getVal(['Contact Email', 'Email', 'HR Email', 'Email Address']) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@talentpulse.ai`;
      const contactMobile = getVal(['Contact Mobile', 'Mobile', 'Phone', 'Contact Number']) || '9876543210';
      const exactAddress = getVal(['Location', 'Address', 'Headquarters', 'HQ', 'City', 'Place']) || null;
      
      const rawStatus = getVal(['Opportunity Status', 'Status', 'Pipeline', 'Company Status']).toUpperCase();
      let status: OpportunityStatus = OpportunityStatus.COLD;
      if (rawStatus.includes('DRIVE') || rawStatus.includes('COMPLETED')) status = OpportunityStatus.DRIVE_COMPLETED;
      else if (rawStatus.includes('HOT')) status = OpportunityStatus.HOT;
      else if (rawStatus.includes('WARM')) status = OpportunityStatus.WARM;
      else if (rawStatus.includes('COLD')) status = OpportunityStatus.COLD;

      const empSizeVal = parseInt(getVal(['Employee Size', 'Size', 'Employees', 'Company Size']));
      const employeeSize = !isNaN(empSizeVal) && empSizeVal > 0 ? empSizeVal : 250;

      try {
        let company = await prisma.company.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: 'insensitive' } },
              { contactEmail: { equals: contactEmail, mode: 'insensitive' } },
            ],
          },
        });

        if (company) {
          company = await prisma.company.update({
            where: { id: company.id },
            data: {
              website: website || company.website,
              industry: industry || company.industry,
              contactPerson: contactPerson || company.contactPerson,
              designation: designation || company.designation,
              contactEmail: contactEmail || company.contactEmail,
              contactMobile: contactMobile || company.contactMobile,
              exactAddress: exactAddress || company.exactAddress,
              status,
              employeeSize,
            },
          });
          updatedCount++;
        } else {
          company = await prisma.company.create({
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

        // Process Job entity if Job details are present in the row
        const jobTitle = getVal(['Job Title / Role', 'Job Title', 'Role', 'Position', 'Job']);
        const rawCtc = getVal(['CTC (LPA)', 'CTC', 'Package', 'Salary']);
        let ctcVal = 6.0;
        if (rawCtc) {
          const match = rawCtc.match(/[\d.]+/);
          if (match) {
            ctcVal = parseFloat(match[0]);
          }
        }

        const rawJobStatus = getVal(['Job Status', 'Job Approval Status']).toUpperCase();
        let jobStatus: JobStatus = JobStatus.APPROVED;
        if (rawJobStatus.includes('PENDING')) jobStatus = JobStatus.PENDING_APPROVAL;
        else if (rawJobStatus.includes('REJECT')) jobStatus = JobStatus.REJECTED;
        else if (rawJobStatus.includes('DRAFT')) jobStatus = JobStatus.DRAFT;
        else if (rawJobStatus.includes('APPROV')) jobStatus = JobStatus.APPROVED;

        const jdText = getVal(['Job Description Summary', 'Job Description', 'JD Summary', 'JD']) || `${jobTitle || name} placement opportunity.`;
        const jdPdfUrl = getVal(['JD PDF Link (Rendering)', 'JD PDF Link', 'PDF Link', 'JD Link', 'Drive Link']) || null;
        const jobLocation = exactAddress || 'India';

        if (jobTitle && company) {
          let adminUser = await prisma.user.findFirst({ where: { roleName: 'ADMIN' } });
          if (!adminUser) {
            adminUser = await prisma.user.findFirst();
          }
          const createdById = req.user?.id || adminUser?.id;

          if (createdById) {
            let job = await prisma.job.findFirst({
              where: {
                companyId: company.id,
                jobTitle: { equals: jobTitle, mode: 'insensitive' },
              },
            });

            if (job) {
              job = await prisma.job.update({
                where: { id: job.id },
                data: {
                  jdText: jdText || job.jdText,
                  jdPdfUrl: jdPdfUrl || job.jdPdfUrl,
                  ctc: ctcVal || job.ctc,
                  location: jobLocation || job.location,
                  status: jobStatus,
                },
              });
            } else {
              job = await prisma.job.create({
                data: {
                  companyId: company.id,
                  jobTitle,
                  jdText,
                  jdPdfUrl,
                  ctc: ctcVal,
                  location: jobLocation,
                  status: jobStatus,
                  createdById,
                },
              });
            }

            if (job.status === JobStatus.APPROVED) {
              await prisma.jobApproval.upsert({
                where: { jobId: job.id },
                create: {
                  jobId: job.id,
                  reviewedById: createdById,
                  reviewedAt: new Date(),
                  comment: 'Auto-approved via Excel Bulk Import',
                },
                update: {
                  reviewedAt: new Date(),
                },
              });
            }

            // Process Placed Students if details are provided in the row
            const placedDetails = getVal(['Placed Students Details', 'Placed Students', 'Student Details']);
            if (placedDetails && placedDetails.trim() !== '') {
              const rollMatches = placedDetails.match(/([A-Z0-9]{8,15})/gi);
              if (rollMatches && rollMatches.length > 0) {
                for (const rollNum of rollMatches) {
                  const student = await prisma.student.findFirst({
                    where: { rollNumber: { equals: rollNum, mode: 'insensitive' } },
                  });
                  if (student) {
                    const existingPlacement = await prisma.studentPlacementHistory.findFirst({
                      where: { studentId: student.id, jobId: job.id },
                    });
                    if (!existingPlacement) {
                      await prisma.studentPlacementHistory.create({
                        data: {
                          studentId: student.id,
                          companyId: company.id,
                          jobId: job.id,
                          ctc: ctcVal,
                          status: 'OFFERED',
                        },
                      });
                      await prisma.student.update({
                        where: { id: student.id },
                        data: { placementStatus: 'PLACED' },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        skippedCount++;
        errorDetails.push({ row: rowNumber, companyName: name, reason: err.message || 'Database write error' });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRows: processedRowsCount,
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


