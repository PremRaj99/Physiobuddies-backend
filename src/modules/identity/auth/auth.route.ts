import { Router } from 'express';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/send-email-before-signup', authController.sendEmailBeforeSignup);
authRouter.post('/signup-patient', authController.signupPatient);
authRouter.post('/signup-physiotherapist', authController.signupPhysiotherapist);
authRouter.post('/google', authController.google);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post('/reset-password', authController.resetPassword);
