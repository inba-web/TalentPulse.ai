import { Router } from 'express';
import { AtsController } from './ats.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const atsRouter = Router();

atsRouter.use(requireAuth);

atsRouter.post('/resume/analyze', hasPermission('ATS_ANALYSIS'), upload.single('file'), AtsController.analyzeResume);
atsRouter.post('/jd/analyze', hasPermission('ATS_ANALYSIS'), upload.single('file'), AtsController.analyzeJdForCandidates);
atsRouter.get('/jobs/:id/candidates', hasPermission('RECRUITER_READ'), AtsController.getJobCandidates);

export default atsRouter;
