import prisma from '@/config/prisma';

function getTimestampFromObjectId(id: string): Date {
  try {
    const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
  } catch {
    return new Date();
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
}

export const activityService = new ActivityService();
