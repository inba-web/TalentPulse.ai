import { Router } from 'express';
import { JobController } from './jobs.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.get('/', hasPermission('JOB_READ'), JobController.getJobs);
jobsRouter.post('/', hasPermission('JOB_CREATE'), JobController.createJob);
jobsRouter.post('/extract-jd', hasPermission('JOB_CREATE'), upload.single('file'), JobController.extractJdDetails);
jobsRouter.get('/:id', hasPermission('JOB_READ'), JobController.getJobById);
jobsRouter.patch('/:id', hasPermission('JOB_UPDATE'), JobController.updateJob);

// Approval actions
jobsRouter.post('/:id/forward', hasPermission('JOB_UPDATE'), JobController.forwardJob);
jobsRouter.post('/:id/review', hasPermission('APPROVAL_APPROVE'), JobController.reviewJob);

export default jobsRouter;
