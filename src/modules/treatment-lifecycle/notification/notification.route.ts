import { Router } from 'express';
import { notificationController } from './notification.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';

export const notificationRouter = Router();

notificationRouter.use(verifyJWT);

notificationRouter.get('/', notificationController.getUserNotifications);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);

notificationRouter.use(AdminOnly);

notificationRouter.delete('/:id', notificationController.deleteNotification);
