import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';

const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get('/overview', hasPermission('REPORT_READ'), ReportsController.getOverview);
reportsRouter.get('/placements', hasPermission('REPORT_READ'), ReportsController.getPlacements);

export default reportsRouter;
