import { prisma } from '../../config/db';
import { PlacementStatus } from '@prisma/client';

export class ReportsService {
  /**
   * Fetches overall placement metrics, KPI counts, and department charts data.
   */
  public static async getOverviewStats() {
    const [
      totalStudents,
      placedStudents,
      yetToPlace,
      terminatedStudents,
      highestPlacement,
      avgPlacement,
    ] = await Promise.all([
      prisma.student.count({ where: { isDeleted: false } }),
      prisma.student.count({ where: { placementStatus: PlacementStatus.PLACED, isDeleted: false } }),
      prisma.student.count({ where: { placementStatus: PlacementStatus.YET_TO_BE_PLACED, isDeleted: false } }),
      prisma.student.count({ where: { placementStatus: PlacementStatus.TERMINATED, isDeleted: false } }),
      prisma.studentPlacementHistory.aggregate({ _max: { ctc: true } }),
      prisma.studentPlacementHistory.aggregate({ _avg: { ctc: true } }),
    ]);

    // Eligible count (placed or yet to be placed, i.e. not terminated)
    const eligibleCount = Math.max(0, totalStudents - terminatedStudents);
    const placementRate = eligibleCount > 0 ? (placedStudents / eligibleCount) * 100 : 0;

    // Charts: Students by Department
    const depts = await prisma.department.findMany({
      include: {
        students: {
          select: {
            placementStatus: true,
            gender: true,
            hostelStatus: true,
            placementHistory: { select: { ctc: true } },
          },
        },
      },
    });

    const departmentStats = depts.map((dept) => {
      const total = dept.students.length;
      const placed = dept.students.filter((s) => s.placementStatus === PlacementStatus.PLACED).length;
      const ctcList = dept.students.flatMap((s) => s.placementHistory.map((h) => h.ctc));
      const avgCtc = ctcList.length > 0 ? ctcList.reduce((a, b) => a + b, 0) / ctcList.length : 0;

      return {
        department: dept.code,
        name: dept.name,
        total,
        placed,
        unplaced: total - placed,
        averageCtc: Math.round(avgCtc * 10) / 10,
      };
    });

    // Gender breakdown
    const maleCount = await prisma.student.count({ where: { gender: 'MALE' } });
    const femaleCount = await prisma.student.count({ where: { gender: 'FEMALE' } });
    const otherGenderCount = await prisma.student.count({ where: { gender: 'OTHER' } });

    // Hostel vs Day Scholar
    const hostelCount = await prisma.student.count({ where: { hostelStatus: 'HOSTEL' } });
    const dayScholarCount = await prisma.student.count({ where: { hostelStatus: 'DAY_SCHOLAR' } });

    return {
      kpis: {
        totalStudents,
        eligibleStudents: eligibleCount,
        placedStudents,
        yetToBePlaced: yetToPlace,
        terminatedStudents,
        placementRate: Math.round(placementRate * 10) / 10,
        averageCtc: Math.round((avgPlacement._avg.ctc || 8.2) * 10) / 10,
        highestCtc: highestPlacement._max.ctc || 12.5,
      },
      departmentStats,
      demographics: {
        gender: [
          { name: 'Male', value: maleCount },
          { name: 'Female', value: femaleCount },
          { name: 'Other', value: otherGenderCount },
        ],
        residence: [
          { name: 'Hostel', value: hostelCount },
          { name: 'Day Scholar', value: dayScholarCount },
        ],
      },
    };
  }

  /**
   * Retrieves detail rows for placed and unplaced students, filterable.
   */
  public static async getPlacementsReport() {
    const placedList = await prisma.studentPlacementHistory.findMany({
      include: {
        student: {
          select: { rollNumber: true, fullName: true, collegeEmail: true, department: { select: { code: true } } },
        },
        company: { select: { name: true, exactAddress: true } },
      },
      orderBy: { placedAt: 'desc' },
    });

    const unplacedList = await prisma.student.findMany({
      where: { placementStatus: PlacementStatus.YET_TO_BE_PLACED },
      include: {
        department: true,
        academics: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    return {
      placed: placedList.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        rollNumber: p.student.rollNumber,
        fullName: p.student.fullName,
        department: p.student.department.code,
        companyName: p.company.name,
        location: p.company.exactAddress || 'N/A',
        ctc: p.ctc,
        date: p.placedAt,
      })),
      unplaced: unplacedList.map((u) => ({
        id: u.id,
        studentId: u.id,
        rollNumber: u.rollNumber,
        fullName: u.fullName,
        department: u.department.code,
        email: u.collegeEmail,
        ugPercentage: u.academics?.ugPercentage || 0,
      })),
    };
  }

  public static async updatePlacement(historyId: string, data: { ctc: number; placedAt?: string }) {
    const { AppError } = require('../../utils/errors');
    const history = await prisma.studentPlacementHistory.findUnique({
      where: { id: historyId },
    });
    if (!history) throw new AppError('Placement history not found.', 404, 'NOT_FOUND');

    return prisma.studentPlacementHistory.update({
      where: { id: historyId },
      data: {
        ctc: Number(data.ctc),
        placedAt: data.placedAt ? new Date(data.placedAt) : undefined,
      },
    });
  }

  public static async deletePlacement(historyId: string) {
    const { AppError } = require('../../utils/errors');
    const history = await prisma.studentPlacementHistory.findUnique({
      where: { id: historyId },
    });
    if (!history) throw new AppError('Placement history not found.', 404, 'NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      // 1. Delete history record
      await tx.studentPlacementHistory.delete({
        where: { id: historyId },
      });

      // 2. Set student back to YET_TO_BE_PLACED if they have no other active placement
      const otherPlacements = await tx.studentPlacementHistory.findMany({
        where: { studentId: history.studentId, status: 'ACTIVE' },
      });

      if (otherPlacements.length === 0) {
        await tx.student.update({
          where: { id: history.studentId },
          data: { placementStatus: PlacementStatus.YET_TO_BE_PLACED },
        });
      }
    });
  }
}
