import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ApplyCouponRequestSchema } from './coupon.type';

const couponDocs = swaggerRouter('/coupon', ['Coupon']);

couponDocs.get('/available', {
  summary: 'Get Available Coupons',
  success: success(200),
});

couponDocs.post('/apply', {
  summary: 'Apply Coupon',
  body: ApplyCouponRequestSchema,
  success: success(200),
});
