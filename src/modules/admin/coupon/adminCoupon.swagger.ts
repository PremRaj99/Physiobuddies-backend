import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { createCouponSchema, updateCouponSchema } from './adminCoupon.types';

const adminCouponDocs = swaggerRouter('/admin/coupon', ['Admin Coupon']);

adminCouponDocs.get('/', {
  summary: 'Get All Coupons',
  success: success(200),
});

adminCouponDocs.post('/', {
  summary: 'Create Coupon',
  body: createCouponSchema,
  success: success(201),
});

adminCouponDocs.patch('/:id', {
  summary: 'Update Coupon',
  body: updateCouponSchema,
  params: ParamsObjectIdSchema,
  success: success(202),
});

adminCouponDocs.delete('/:id', {
  summary: 'Delete Coupon',
  params: ParamsObjectIdSchema,
  success: success(202),
});
