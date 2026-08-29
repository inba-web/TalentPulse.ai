import { prisma } from '../../config/db';
import { AppError } from '../../utils/errors';
import { OpportunityStatus } from '@prisma/client';
import { GooglePlacesProvider } from '../../services/places/google';

export class CompanyService {
  public static async createCompany(data: any) {
    const existing = await prisma.company.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Company name already registered.', 400, 'COMPANY_EXISTS');

    return prisma.company.create({ data });
  }

  public static async updateCompany(id: string, data: any) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new AppError('Company record not found.', 404, 'COMPANY_NOT_FOUND');

    return prisma.company.update({
      where: { id },
      data,
    });
  }

  public static async getCompanies(filters: {
    search?: string;
    status?: OpportunityStatus;
    industry?: string;
    employeeSizeTier?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) where.status = filters.status;
    
    if (filters.industry) {
      where.industry = { equals: filters.industry, mode: 'insensitive' };
    }

    if (filters.employeeSizeTier) {
      if (filters.employeeSizeTier === 'SMALL') {
        where.employeeSize = { lt: 50 };
      } else if (filters.employeeSizeTier === 'MEDIUM') {
        where.employeeSize = { gte: 50, lte: 250 };
      } else if (filters.employeeSizeTier === 'LARGE') {
        where.employeeSize = { gte: 251, lte: 1000 };
      } else if (filters.employeeSizeTier === 'ENTERPRISE') {
        where.employeeSize = { gt: 1000 };
      }
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, total, page, limit };
  }

  public static async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) throw new AppError('Company record not found.', 404, 'COMPANY_NOT_FOUND');
    return company;
  }

  /**
   * Run Google Places search for candidate locations.
   */
  public static async searchLocations(name: string, location: string) {
    const query = `${name} ${location}`;
    return GooglePlacesProvider.searchPlaces(query);
  }

  /**
   * Fetch details for a Place ID and update company location fields.
   */
  public static async resolveCompanyLocation(companyId: string, placeId: string) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Company record not found.', 404, 'COMPANY_NOT_FOUND');

    const details = await GooglePlacesProvider.getPlaceDetails(placeId);

    return prisma.company.update({
      where: { id: companyId },
      data: {
        exactAddress: details.exactAddress,
        latitude: details.latitude,
        longitude: details.longitude,
        placeId,
        mapsUrl: details.mapsUrl,
      },
    });
  }

  public static async deleteCompany(id: string, note?: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { jobs: true, placements: true } },
      },
    });
    if (!company) throw new AppError('Company record not found.', 404, 'COMPANY_NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      // 1. Archive the company snapshot
      await (tx as any).companyArchive.create({
        data: {
          id: `arc-${id}-${Date.now()}`,
          originalId: company.id,
          name: company.name,
          website: company.website,
          employeeSize: company.employeeSize,
          industry: company.industry,
          exactAddress: company.exactAddress,
          latitude: company.latitude,
          longitude: company.longitude,
          placeId: company.placeId,
          mapsUrl: company.mapsUrl,
          contactPerson: company.contactPerson,
          designation: company.designation,
          contactEmail: company.contactEmail,
          contactMobile: company.contactMobile,
          status: company.status,
          jobCount: (company as any)._count.jobs,
          placementCount: (company as any)._count.placements,
          deletedByNote: note ?? null,
        },
      });

      // 2. Delete jobs for this company first (FK constraint)
      await tx.job.deleteMany({ where: { companyId: id } });

      // 3. Delete the company record
      await tx.company.delete({ where: { id } });
    });
  }
}
