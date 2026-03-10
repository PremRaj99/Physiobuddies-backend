import type { NextFunction, Request, Response } from 'express';

class NotificationController {
  async getUserNotifications(req: Request, res: Response, next: NextFunction) {}

  async markAsRead(req: Request, res: Response, next: NextFunction) {}

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {}

  async deleteNotification(req: Request, res: Response, next: NextFunction) {}

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {}
}

export const notificationController = new NotificationController();
