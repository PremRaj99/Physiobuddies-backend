import type { Request } from 'express';
import prisma from '@/config/prisma';
import { getTimestampFromObjectId } from '@/shared/helper/mongo.helper';
import { extractClientIp, stringifyPayload } from './activity.helper';

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

    const ipAddress = extractClientIp(req, customIp);
    const dataStr = (stringifyPayload(data) || '') as string;
    const beforeStr = stringifyPayload(before);
    const afterStr = stringifyPayload(after);

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
