import { Router } from 'express';
import { swaggerRouter } from './core/api-docs/swagger';
import { adminRouter } from './modules/admin/admin.route';
import { appointmentRouter } from './modules/treatment-lifecycle/treatment/appointment.route';
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
import { invoiceRouter } from './modules/billing-ledger/invoice/invoice.route';
import { webhookRouter } from './modules/billing-ledger/webhook/webhook.route';
import { cronRouter } from './modules/internal/cron/cron.route';
import { reservationRouter } from './modules/treatment-lifecycle/reservation/reservation.route';
import { treatmentSessionRouter } from './modules/treatment-lifecycle/treatment-session/treatmentSession.route';
import { logRouter } from './modules/log/log.route';
// src/app.ts
import '@/core/api-docs/swagger-init';

export const router = Router();

router.use('/docs', swaggerRouter);

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/patient', patientRouter);
router.use('/therapist', therapistRouter);

router.use('/admin', adminRouter);
router.use('/blog', blogRouter);
router.use('/contact', contactRouter);
router.use('/treatment-plan', appointmentRouter);
router.use('/coupon', couponRouter);
router.use('/invoice', invoiceRouter);
router.use('/webhook', webhookRouter);
router.use('/file-upload', fileUploadRouter);
router.use('/notification', notificationRouter);
router.use('/payment', paymentRouter);
router.use('/jobs', cronRouter);
router.use('/therapist-registration', therapistRegistrationRouter);
router.use('/reservation', reservationRouter);
router.use('/treatment-session', treatmentSessionRouter);

// dev route
router.use('/logs', logRouter);
