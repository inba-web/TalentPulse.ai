import { Router } from 'express';
import { AuditService } from './audit.service';
import { requireAuth, hasPermission } from '../../middleware/auth';
import { catchAsync } from '../../utils/errors';

const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.get(
  '/',
  hasPermission('AUDIT_READ'),
  catchAsync(async (req: any, res: any) => {
    const actorId = req.query.actorId as string;
    const action = req.query.action as string;
    const entity = req.query.entity as string;
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const data = await AuditService.getLogs({
      actorId,
      action,
      entity,
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data,
    });
  })
);

export default auditRouter;
