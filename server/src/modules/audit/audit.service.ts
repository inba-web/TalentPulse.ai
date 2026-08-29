import { prisma } from '../../config/db';
import { logger } from '../../utils/logger';

export class AuditService {
  /**
   * Records a security or system operation audit event.
   */
  public static async log({
    action,
    actorId,
    entity,
    entityId,
    metadata = {},
    ipAddress,
    requestId,
  }: {
    action: string;
    actorId?: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    requestId?: string;
  }) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          action,
          actorId,
          entity,
          entityId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          ipAddress,
          requestId: requestId || Math.random().toString(36).substring(2, 15),
        },
      });
      logger.info({ action, actorId, entity, entityId }, 'Audit event recorded');
      return log;
    } catch (error) {
      // Ensure logging failure does not crash the system, but log it to server errors
      logger.error({ error, action, actorId }, 'Failed to record audit event in database');
    }
  }

  /**
   * Fetches audit records, filterable.
   */
  public static async getLogs(filters: {
    actorId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              fullName: true,
              email: true,
              roleName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse metadata back to object
    const parsedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata as string) : null,
    }));

    return { logs: parsedLogs, total };
  }
}
