import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { NotFoundError } from '@/core/errors/ApiError';
import { UpdateAdminTherapistDTO, UpdateCommissionRateDTO } from './adminTherapist.types';
import { updateTherapistData } from './adminTherapist.helper';

class AdminTherapistService {
  async getAllTherapists() {
    const therapists = prisma.therapist.findMany({
      where: softDeleteWhereClause(),
      orderBy: {
        createdAt: 'desc',
      },
    });
    return therapists;
  }

  async verifyTherapist(id: string) {
    const therapist = await prisma.therapist.findUnique({
      where: {
        id,
      },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    await prisma.therapist.update({
      where: {
        id,
      },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  async updateTherapist(id: string, data: UpdateAdminTherapistDTO) {
    const therapist = await prisma.therapist.findUnique({
      where: {
        id,
      },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }
    const updateData = updateTherapistData(data);

    await prisma.therapist.update({
      where: {
        id,
      },
      data: {
        ...updateData.updateTherapistData,
        meta: {
          update: {
            ...updateData.updateTherapistMetaDta,
          },
        },
      },
    });
  }

  async updateCommissionRate(id: string, data: UpdateCommissionRateDTO) {
    const therapist = await prisma.therapist.findUnique({
      where: {
        id,
      },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    await prisma.therapist.update({
      where: {
        id,
      },
      data: {
        commissionRate: data.commissionRate,
        updateCommissionRateAt: new Date(),
      },
    });
  }
}

export default new AdminTherapistService();
