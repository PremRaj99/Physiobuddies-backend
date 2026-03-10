import type { NextFunction, Request, Response } from 'express';

class NotificationController {
  async getUserNotifications(_req: Request, _res: Response, _next: NextFunction) {}

  async markAsRead(_req: Request, _res: Response, _next: NextFunction) {}

  async markAllAsRead(_req: Request, _res: Response, _next: NextFunction) {}

  async deleteNotification(_req: Request, _res: Response, _next: NextFunction) {}

  async getUnreadCount(_req: Request, _res: Response, _next: NextFunction) {}
}

export const notificationController = new NotificationController();
