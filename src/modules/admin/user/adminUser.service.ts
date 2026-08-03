import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { NotFoundError } from '@/core/errors/ApiError';
import { formatUserBlockResponseMessage, getToggledUserStatus } from './adminUser.helper';

class AdminUserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      where: softDeleteWhereClause(),
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        status: true,
        image: true,
        phone: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users;
  }

  async blockUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const nextStatus = getToggledUserStatus(user.status);

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: nextStatus,
      },
    });

    return formatUserBlockResponseMessage(user.name, nextStatus);
  }
}

export default new AdminUserService();
