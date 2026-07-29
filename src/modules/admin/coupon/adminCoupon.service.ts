import { NotFoundError } from '@/core/errors/ApiError';
import { CreateCouponDTO, UpdateCouponDTO } from './adminCoupon.types';
import prisma from '@/config/prisma';
import {
  buildCouponAssignmentsData,
  buildCouponTherapistConstraintsData,
  buildCouponUpdatePayload,
} from './adminCoupon.helper';

class AdminCouponService {
  async getAllCoupons() {
    const coupons = await prisma.coupon.findMany({
      where: { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
      include: {
        assignments: {
          select: {
            patientId: true,
            type: true,
          },
        },
        therapistConstraints: {
          select: {
            therapistId: true,
          },
        },
      },
    });
    return coupons;
  }

  async createCoupon(data: CreateCouponDTO) {
    await prisma.$transaction(async (txn) => {
      const coupon = await txn.coupon.create({
        data: {
          code: data.code,
          minPrice: data.minPrice,
          discount: data.discount,
          expiresOn: new Date(data.expiresOn),
          status: data.status || 'active',
          isGlobal: data.isGlobal || false,
        },
      });

      const assignmentsData = buildCouponAssignmentsData(coupon.id, data.patientIds);
      if (assignmentsData.length > 0) {
        await txn.couponAssignment.createMany({ data: assignmentsData });
      }

      const therapistConstraintsData = buildCouponTherapistConstraintsData(
        coupon.id,
        data.therapistIds,
      );
      if (therapistConstraintsData.length > 0) {
        await txn.couponTherapist.createMany({ data: therapistConstraintsData });
      }
    });

    return;
  }

  async updateCoupon(id: string, data: UpdateCouponDTO) {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });
    if (!existingCoupon) {
      throw new NotFoundError('Coupon not found');
    }

    const updateData = buildCouponUpdatePayload(data);

    await prisma.$transaction(async (txn) => {
      await txn.coupon.update({
        where: { id },
        data: updateData,
      });

      if (data.patientIds !== undefined) {
        await txn.couponAssignment.deleteMany({ where: { couponId: id } });
        const assignmentsData = buildCouponAssignmentsData(id, data.patientIds);
        if (assignmentsData.length > 0) {
          await txn.couponAssignment.createMany({ data: assignmentsData });
        }
      }

      if (data.therapistIds !== undefined) {
        await txn.couponTherapist.deleteMany({ where: { couponId: id } });
        const therapistConstraintsData = buildCouponTherapistConstraintsData(id, data.therapistIds);
        if (therapistConstraintsData.length > 0) {
          await txn.couponTherapist.createMany({ data: therapistConstraintsData });
        }
      }
    });

    return;
  }

  async deleteCoupon(id: string) {
    await prisma.$transaction(async (txn) => {
      await txn.couponAssignment.deleteMany({ where: { couponId: id } });
      await txn.couponTherapist.deleteMany({ where: { couponId: id } });
      await txn.coupon.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  }
}

export default new AdminCouponService();
