import { Response } from 'express';
import { NotificationService } from './notifications.service';
import { catchAsync, AppError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import { RoleName } from '@prisma/client';

export class NotificationController {
  public static getNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

    const notifications = await NotificationService.getUserNotifications(req.user.id, req.user.roleName as RoleName);

    res.status(200).json({
      success: true,
      data: { notifications },
    });
  });

  public static markRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await NotificationService.markRead(id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  });

  public static markAllRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

    await NotificationService.markAllRead(req.user.id, req.user.roleName as RoleName);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  });

  public static createNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, type, link, targetRole, userId } = req.body;
    if (!title || !description || !type || !link) {
      throw new AppError('title, description, type, and link are required.', 400, 'BAD_REQUEST');
    }

    const notification = await NotificationService.createNotification({
      title,
      description,
      type,
      link,
      targetRole,
      userId,
    });

    res.status(201).json({
      success: true,
      data: { notification },
    });
  });
}
