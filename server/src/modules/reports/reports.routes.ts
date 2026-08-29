import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';

const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get('/overview', hasPermission('REPORT_READ'), ReportsController.getOverview);
reportsRouter.get('/placements', hasPermission('REPORT_READ'), ReportsController.getPlacements);
reportsRouter.patch('/placements/:historyId', hasPermission('STUDENT_UPDATE'), ReportsController.updatePlacement);
reportsRouter.delete('/placements/:historyId', hasPermission('STUDENT_UPDATE'), ReportsController.deletePlacement);

export default reportsRouter;
