import { Response } from 'express';
import { AdminService } from './admin.service';
import { catchAsync, AppError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AdminController {
  /**
   * Retrieves live record counts for placement entities.
   */
  public static getCounts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.roleName !== 'ADMIN') {
      throw new AppError('Access Denied. Only system administrators can inspect data management metrics.', 403, 'FORBIDDEN');
    }

    const counts = await AdminService.getPlacementCounts();

    res.status(200).json({
      success: true,
      data: counts,
    });
  });

  /**
   * Safe transactional reset of placement data.
   */
  public static resetData = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.roleName !== 'ADMIN') {
      throw new AppError('Access Denied. Only system administrators can execute placement data resets.', 403, 'FORBIDDEN');
    }

    const { confirmationText } = req.body;
    const normalized = (confirmationText || '').trim().replace(/\s+/g, ' ').toUpperCase();

    if (normalized !== 'RESET PLACEMENT DATA') {
      throw new AppError('Invalid confirmation text. You must type "RESET PLACEMENT DATA" to proceed.', 400, 'BAD_REQUEST');
    }

    const result = await AdminService.resetPlacementData();

    res.status(200).json({
      success: true,
      message: 'Placement Data Reset Complete. System users and configuration preserved.',
      data: result,
    });
  });
}
