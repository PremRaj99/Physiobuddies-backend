import { Prisma } from '@prisma/client';
import { UpdateUserDTO } from './user.type';

export const updateInfoData = (data: UpdateUserDTO) => {
  const updateData: Prisma.UserUpdateInput = {};
  if (data.mobile !== undefined) updateData.phone = data.mobile;
  if (data.name !== undefined) updateData.name = data.name;

  return updateData;
};
