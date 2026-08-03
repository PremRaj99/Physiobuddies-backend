import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { NotFoundError } from '@/core/errors/ApiError';

class TherapistRegistrationService {
  async getAllRegistrations() {
    const therapists = await prisma.therapist.findMany({
      where: softDeleteWhereClause(),
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        meta: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return therapists.map((t) => ({
      id: t.id,
      name: t.user?.name || '',
      email: t.user?.email || '',
      phone: t.user?.phone || '',
      gender: t.gender,
      experience: t.meta?.experience,
      specialization: t.meta?.specialization || [],
      educationQualification: t.meta?.educationQualification || [],
      currentlyAffiliation: t.meta?.currentlyAffiliation || '',
      IAPId: t.meta?.IAPId || '',
      status: t.user?.status === 'blocked' ? 'rejected' : t.verifiedAt ? 'approved' : 'pending',
      createdAt: t.createdAt,
    }));
  }

  async getRegistrationById(id: string) {
    const therapist = await prisma.therapist.findFirst({
      where: softDeleteWhereClause({ id }),
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        meta: true,
      },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist registration not found');
    }

    return {
      id: therapist.id,
      name: therapist.user?.name || '',
      email: therapist.user?.email || '',
      phone: therapist.user?.phone || '',
      gender: therapist.gender,
      experience: therapist.meta?.experience,
      specialization: therapist.meta?.specialization || [],
      educationQualification: therapist.meta?.educationQualification || [],
      currentlyAffiliation: therapist.meta?.currentlyAffiliation || '',
      IAPId: therapist.meta?.IAPId || '',
      status:
        therapist.user?.status === 'blocked'
          ? 'rejected'
          : therapist.verifiedAt
            ? 'approved'
            : 'pending',
      createdAt: therapist.createdAt,
    };
  }

  async approveRegistration(id: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist registration not found');
    }

    await prisma.$transaction([
      prisma.therapist.update({
        where: { id },
        data: { verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: therapist.userId },
        data: { status: 'active' },
      }),
    ]);

    return 'Therapist registration approved successfully';
  }

  async rejectRegistration(id: string, _reason?: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist registration not found');
    }

    await prisma.user.update({
      where: { id: therapist.userId },
      data: { status: 'blocked' },
    });

    return 'Therapist registration rejected successfully';
  }
}

export const therapistRegistrationService = new TherapistRegistrationService();
