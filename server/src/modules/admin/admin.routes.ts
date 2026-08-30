import { Router } from 'express';
import { AdminController } from './admin.controller';
import { requireAuth } from '../../middleware/auth';

const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get('/reset-counts', AdminController.getCounts);
adminRouter.post('/reset-data', AdminController.resetData);

export default adminRouter;
