import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';

class UserSessionService {
  async getSessions(userId: string, currentRefreshToken?: string) {
    const sessions = await prisma.authSession.findMany({
      where: { userId },
      orderBy: { lastLoggedAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      agent: session.agent,
      location: session.location,
      ip: session.ip,
      lastLoggedAt: session.lastLoggedAt,
      createdAt: session.createdAt,
      isCurrentSession: !!currentRefreshToken && session.refreshToken === currentRefreshToken,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.authSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await prisma.authSession.delete({ where: { id: sessionId } });

    return;
  }
}

export const userSessionService = new UserSessionService();
