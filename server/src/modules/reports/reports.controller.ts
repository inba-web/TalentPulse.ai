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

  public static updatePlacement = catchAsync(async (req: Request, res: Response) => {
    const { historyId } = req.params;
    const { ctc, date } = req.body;
    const updated = await ReportsService.updatePlacement(historyId, { ctc, placedAt: date });
    res.status(200).json({
      success: true,
      data: updated,
    });
  });

  public static deletePlacement = catchAsync(async (req: Request, res: Response) => {
    const { historyId } = req.params;
    await ReportsService.deletePlacement(historyId);
    res.status(200).json({
      success: true,
      message: 'Placement offer revoked successfully.',
    });
  });
}
