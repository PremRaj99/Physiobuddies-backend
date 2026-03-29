import { NotFoundError } from '@/core/errors/ApiError';
import { CreateCouponDTO, UpdateCouponDTO } from './adminCoupon.types';
import prisma from '@/config/prisma';

class AdminCouponService {
  async getAllCoupons() {
    const coupons = await prisma.coupon.findMany({
      where: { deletedAt: null },
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
    // Logic to create a coupon
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
      await txn.couponAssignment.createMany({
        data: data.patientIds
          ? data.patientIds.map((id) => ({
              patientId: id,
              couponId: coupon.id,
              type: 'whitelist',
            }))
          : [],
      });
      await txn.couponTherapist.createMany({
        data: data.therapistIds
          ? data.therapistIds.map((id) => ({
              therapistId: id,
              couponId: coupon.id,
            }))
          : [],
      });
    });

    return;
  }

  async updateCoupon(id: string, data: UpdateCouponDTO) {
    const existingCoupon = await prisma.coupon.findUnique({ where: { id, deletedAt: null } });
    if (!existingCoupon) {
      throw new NotFoundError('Coupon not found');
    }

    const updateData = Object.fromEntries(
      Object.entries({
        code: data.code,
        minPrice: data.minPrice,
        discount: data.discount,
        expiresOn:
          data.expiresOn !== undefined
            ? data.expiresOn === '' || data.expiresOn === null
              ? null
              : new Date(data.expiresOn)
            : undefined,
        status: data.status,
        isGlobal: data.isGlobal,
      }).filter(([_, v]) => v !== undefined),
    );

    await prisma.$transaction(async (txn) => {
      await txn.coupon.update({
        where: { id },
        data: updateData,
      });
      if (data.patientIds !== undefined) {
        await txn.couponAssignment.deleteMany({ where: { couponId: id } });
        if (data.patientIds) {
          await txn.couponAssignment.createMany({
            data: data.patientIds.map((patientId) => ({
              patientId: patientId,
              couponId: id,
              type: 'whitelist',
            })),
          });
        }
      }
      if (data.therapistIds !== undefined) {
        await txn.couponTherapist.deleteMany({ where: { couponId: id } });
        if (data.therapistIds) {
          await txn.couponTherapist.createMany({
            data: data.therapistIds.map((therapistId) => ({
              therapistId: therapistId,
              couponId: id,
            })),
          });
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
