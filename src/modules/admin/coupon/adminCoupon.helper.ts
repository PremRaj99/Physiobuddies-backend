import { CouponAssignmentType, Prisma } from '@prisma/client';
import { removeUndefinedProps } from '@/shared/helper/object.helper';
import { UpdateCouponDTO } from './adminCoupon.types';

/**
 * Prepares coupon assignment whitelist objects for batch insertion.
 */
export const buildCouponAssignmentsData = (couponId: string, patientIds?: string[]) => {
  if (!patientIds || patientIds.length === 0) return [];
  return patientIds.map((patientId) => ({
    patientId,
    couponId,
    type: 'whitelist' as CouponAssignmentType,
  }));
};

/**
 * Prepares coupon therapist constraint objects for batch insertion.
 */
export const buildCouponTherapistConstraintsData = (couponId: string, therapistIds?: string[]) => {
  if (!therapistIds || therapistIds.length === 0) return [];
  return therapistIds.map((therapistId) => ({
    therapistId,
    couponId,
  }));
};

/**
 * Builds clean Prisma update payload for coupon records.
 */
export const buildCouponUpdatePayload = (data: UpdateCouponDTO): Prisma.CouponUpdateInput => {
  const expiresOn =
    data.expiresOn !== undefined
      ? data.expiresOn === '' || data.expiresOn === null
        ? null
        : new Date(data.expiresOn)
      : undefined;

  return removeUndefinedProps({
    code: data.code,
    minPrice: data.minPrice,
    discount: data.discount,
    expiresOn,
    status: data.status,
    isGlobal: data.isGlobal,
  }) as Prisma.CouponUpdateInput;
};
