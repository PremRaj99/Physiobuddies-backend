import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { ApplyCouponRequestDTO } from './coupon.type';

class CouponService {
  getAvailableCoupons = async (userId: string) => {
    const patientId = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patientId) {
      throw new NotFoundError('Patient not found');
    }

    const couponAssignments = await prisma.couponAssignment.findMany({
      where: {
        patientId: patientId.id,
        coupon: {
          expiresOn: { gt: new Date() },
        },
        type: 'whitelist',
      },
      include: { coupon: true },
    });
    return couponAssignments.map((assignment) => ({
      code: assignment.coupon.code,
      minPrice: assignment.coupon.minPrice,
      expiresOn: assignment.coupon.expiresOn,
    }));
  };

  applyCoupon = async (data: ApplyCouponRequestDTO, userId: string) => {
    const patientId = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patientId) {
      throw new NotFoundError('Patient not found');
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: data.couponCode,
        expiresOn: { gt: new Date() },
      },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found or expired');
    }

    await prisma.couponUsage.findFirst({
      where: {
        patientId: patientId.id,
        couponId: coupon.id,
        treatmentSessionId: data.treatmentSessionId,
      },
    });
  };
}

export const couponService = new CouponService();
