import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import bcrypt from 'bcrypt';
import { UpdateUserDTO } from './user.type';
import { updateInfoData } from './user.helper';

class UserService {
  getUserById = async (id: string) => {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: { isSet: false }, status: 'active' },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  };

  getInfo = async (userId: string) => {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: { isSet: false }, status: 'active' },
      include: {
        therapistProfile: {
          include: {
            meta: true,
            accounts: true,
            slots: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let therapistProfileData = null;
    let therapistStatus = null;
    if (user.role === 'therapist' && user.therapistProfile) {
      const therapist = user.therapistProfile;
      therapistStatus = {
        isOnboardingFilled: !!therapist.meta,
        isVerified: !!therapist.verifiedAt,
        isFinalOnboardingFilled: therapist.accounts.length > 0 && !!therapist.slots,
      };
      therapistProfileData = {
        id: therapist.id,
        about: therapist.about,
        displayAddress: therapist.displayAddress,
        location: therapist.location,
      };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      image: user.image,
      createdAt: user.createdAt,
      therapistStatus,
      therapistProfile: therapistProfileData,
    };
  };

  updateInfo = async (userId: string, data: UpdateUserDTO) => {
    // Implementation to update user information
    const user = await this.getUserById(userId);

    const updateData = updateInfoData(data);

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  };

  updateAvatar = async (userId: string, data: { avatar: string }) => {
    const user = await this.getUserById(userId);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        image: data.avatar,
      },
    });
  };

  changePassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ) => {
    const user = await this.getUserById(userId);

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new NotFoundError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });
  };
}

export const userService = new UserService();
