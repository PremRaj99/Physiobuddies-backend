import { Router } from 'express';
import { notificationController } from './notification.controller';

export const notificationRouter = Router();

notificationRouter.get('/', notificationController.getUserNotifications);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);
notificationRouter.delete('/:id', notificationController.deleteNotification);
