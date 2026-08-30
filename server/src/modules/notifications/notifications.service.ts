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
   * Mark single notification read.
   */
  public static async markRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications read for user/role.
   */
  public static async markAllRead(userId: string, roleName: RoleName) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { targetRole: roleName },
          { targetRole: null, userId: null },
        ],
        read: false,
      },
      data: { read: true },
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
