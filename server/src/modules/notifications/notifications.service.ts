import { prisma } from '../../config/db';
import { RoleName } from '@prisma/client';

export class NotificationService {
  /**
   * Fetch notifications scoped by user ID and user role.
   */
  public static async getUserNotifications(userId: string, roleName: RoleName) {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { targetRole: roleName },
          { targetRole: null, userId: null }, // System global
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return notifications;
  }

  /**
   * Permanently erase single notification upon read/dismiss.
   */
  public static async markRead(notificationId: string) {
    try {
      return await prisma.notification.delete({
        where: { id: notificationId },
      });
    } catch (err) {
      // If already deleted, return silently
      return null;
    }
  }

  /**
   * Permanently erase all notifications for user/role upon Mark All Read.
   */
  public static async markAllRead(userId: string, roleName: RoleName) {
    return prisma.notification.deleteMany({
      where: {
        OR: [
          { userId },
          { targetRole: roleName },
          { targetRole: null, userId: null },
        ],
      },
    });
  }

  /**
   * Create notification helper.
   */
  public static async createNotification(data: {
    title: string;
    description: string;
    type: 'STUDENT' | 'JOB' | 'COMPANY' | 'ATS' | 'PLACEMENT';
    link: string;
    targetRole?: RoleName;
    userId?: string;
  }) {
    return prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        link: data.link,
        targetRole: data.targetRole ?? null,
        userId: data.userId ?? null,
      },
    });
  }
}
