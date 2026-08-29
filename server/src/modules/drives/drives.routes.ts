import { Router } from 'express';
import { DriveController } from './drives.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';

const router = Router();

// Public/Authenticated Drive endpoints
router.use(requireAuth);

// Drive candidate management
router.get('/job/:jobId/students', hasPermission('JOB_READ'), DriveController.getDriveStudents);
router.post('/job/:jobId/register', hasPermission('JOB_CREATE'), DriveController.registerStudents);
router.patch('/job/:jobId/students/:studentId', hasPermission('JOB_CREATE'), DriveController.updateStudentStatus);
router.post('/job/:jobId/bulk-status', hasPermission('JOB_CREATE'), DriveController.bulkUpdateStatus);
router.delete('/job/:jobId/students/:studentId', hasPermission('JOB_CREATE'), DriveController.removeStudent);

// Student drive history profile endpoint
router.get('/student/:studentId', hasPermission('STUDENT_READ'), DriveController.getStudentDriveHistory);

export default router;
