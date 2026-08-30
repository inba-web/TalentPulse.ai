import { Router } from 'express';
import { NotificationController } from './notifications.controller';
import { requireAuth } from '../../middleware/auth';

const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', NotificationController.getNotifications);
notificationsRouter.patch('/read-all', NotificationController.markAllRead);
notificationsRouter.patch('/:id/read', NotificationController.markRead);
notificationsRouter.post('/', NotificationController.createNotification);

export default notificationsRouter;
