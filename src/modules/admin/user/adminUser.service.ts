import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';

class AdminUserService {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        image: true,
        phone: true,
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
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: user.status === 'active' ? 'blocked' : 'active',
      },
    });
    return `${user.name} has been ${user.status === 'active' ? 'blocked' : 'unblocked'} successfully.`;
  }
}

export default new AdminUserService();
