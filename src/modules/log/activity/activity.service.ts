import type { Request } from 'express';
import prisma from '@/config/prisma';

function getTimestampFromObjectId(id: string): Date {
  try {
    const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
  } catch {
    return new Date();
  }
}

export interface LogActivityInput {
  userId: string;
  title: string;
  data: string | Record<string, unknown>;
  type?: 'frequent' | 'likely' | 'possible' | 'rare' | 'unlikely';
  before?: Record<string, unknown> | string | null;
  after?: Record<string, unknown> | string | null;
  req?: Request;
  ip?: string;
}

export async function logActivity(input: LogActivityInput) {
  try {
    const {
      userId,
      title,
      data,
      type = 'frequent',
      before = null,
      after = null,
      req,
      ip: customIp,
    } = input;

    if (!userId) return;

    const ipAddress =
      customIp ||
      (req?.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';

    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const beforeStr = before
      ? typeof before === 'string'
        ? before
        : JSON.stringify(before)
      : null;
    const afterStr = after ? (typeof after === 'string' ? after : JSON.stringify(after)) : null;

    await prisma.activity.create({
      data: {
        userId,
        title,
        data: dataStr,
        type,
        before: beforeStr,
        after: afterStr,
        ip: ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}

class ActivityService {
  async getUserActivities(userId: string, role?: string) {
    const where = role === 'admin' ? {} : { userId };
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { id: 'desc' },
    });

    return activities.map((activity) => ({
      id: activity.id,
      userId: activity.userId,
      title: activity.title,
      data: activity.data,
      before: activity.before,
      after: activity.after,
      ip: activity.ip,
      type: activity.type,
      createdAt:
        (activity as { createdAt?: Date }).createdAt || getTimestampFromObjectId(activity.id),
    }));
  }

  logActivity = logActivity;
}

export const activityService = new ActivityService();
