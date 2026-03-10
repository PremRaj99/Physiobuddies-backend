import { AdminOnly } from './core/middlewares/verifyAdmin';
import { verifyJWT } from './core/middlewares/verifyJWT';

import { Router } from 'express';
import { adminRouter } from './modules/admin/admin.route';
import { appointmentRouter } from './modules/treatment-lifecycle/appointment/appointment.route';
import { authRouter } from './modules/identity/auth/auth.route';
import { blogRouter } from './modules/content/blog/blog.route';
import { contactRouter } from './modules/important-data/contact/contact.route';
import { couponRouter } from './modules/billing-ledger/coupon/coupon.route';
import { fileUploadRouter } from './modules/content/file-upload/file-upload.route';
import { notificationRouter } from './modules/treatment-lifecycle/notification/notification.route';
import { paymentRouter } from './modules/billing-ledger/payment/payment.route';
import { therapistRouter } from './modules/identity/therapist/therapist.route';
import { therapistRegistrationRouter } from './modules/important-data/therapist-registration/therapist-registration.route';
import { userRouter } from './modules/identity/user/user.route';
import { patientRouter } from './modules/identity/patient/patient.route';

export const router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/patient', patientRouter);
router.use('/therapist', therapistRouter);

router.use('/admin', verifyJWT, AdminOnly, adminRouter);
router.use('/appointment', verifyJWT, appointmentRouter);
router.use('/blog', blogRouter);
router.use('/contact', contactRouter);
router.use('/coupon', verifyJWT, couponRouter);
router.use('/file-upload', verifyJWT, fileUploadRouter);
router.use('/notification', verifyJWT, notificationRouter);
router.use('/payment', verifyJWT, paymentRouter);
router.use('/therapist-registration', therapistRegistrationRouter);
