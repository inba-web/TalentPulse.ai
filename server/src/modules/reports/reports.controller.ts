import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { catchAsync } from '../../utils/errors';

export class ReportsController {
  public static getOverview = catchAsync(async (req: Request, res: Response) => {
    const stats = await ReportsService.getOverviewStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  public static getPlacements = catchAsync(async (req: Request, res: Response) => {
    const data = await ReportsService.getPlacementsReport();
    res.status(200).json({
      success: true,
      data,
    });
  });
}
