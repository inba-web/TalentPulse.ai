import { Router } from 'express';
import { StudentController } from './students.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const studentsRouter = Router();

// Apply auth to all student routes
studentsRouter.use(requireAuth);

studentsRouter.get('/departments', StudentController.getDepartments);
studentsRouter.get('/', hasPermission('STUDENT_READ'), StudentController.getStudents);
studentsRouter.post('/', hasPermission('STUDENT_CREATE'), StudentController.createStudent);
studentsRouter.get('/:id', hasPermission('STUDENT_READ'), StudentController.getStudentById);
studentsRouter.patch('/:id', hasPermission('STUDENT_UPDATE'), StudentController.updateStudent);
studentsRouter.delete('/:id', hasPermission('STUDENT_DELETE'), StudentController.deleteStudent);

// Bulk Imports
studentsRouter.post(
  '/import',
  hasPermission('STUDENT_IMPORT'),
  upload.single('file'),
  StudentController.importStudents
);

// Terminations
studentsRouter.post('/:id/terminate', hasPermission('STUDENT_DELETE'), StudentController.terminateStudent);
studentsRouter.post('/:id/revoke-termination', hasPermission('STUDENT_DELETE'), StudentController.revokeTermination);
studentsRouter.post('/:id/recover', hasPermission('STUDENT_DELETE'), StudentController.recoverStudent);

export default studentsRouter;
