import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import {
  ForgotPasswordSchema,
  GoogleLoginSchema,
  LoginSchema,
  RefershTokenSchema,
  ResetPasswordSchema,
  SendEmailBeforeSignupSchema,
  SignupPatientSchema,
  SignupPhysiotherapistSchema,
  VerifyEmailSchema,
} from './auth.type';

const authDocs = swaggerRouter('/auth', ['Auth']);

authDocs.post('/login', {
  summary: 'Login using email',
  body: LoginSchema,
  success: success(200),
  errors: [404],
});

authDocs.post('/send-email-before-signup', {
  summary: 'Send verification email before signup',
  body: SendEmailBeforeSignupSchema,
  success: success(202),
});

authDocs.post('/signup-patient', {
  summary: 'Signup for patient',
  body: SignupPatientSchema,
  success: success(201),
});

authDocs.post('/signup-physiotherapist', {
  summary: 'Signup for physiotherapist',
  body: SignupPhysiotherapistSchema,
  success: success(201),
});

authDocs.post('/google', {
  summary: 'Login from Google',
  query: GoogleLoginSchema,
  success: success(200),
  errors: [404],
});

authDocs.post('/logout', {
  summary: 'Logout',
  success: success(202),
});

authDocs.post('/refresh-token', {
  summary: 'Refresh Token',
  body: RefershTokenSchema,
  success: success(202),
  errors: [401],
});

authDocs.post('/forgot-password', {
  summary: 'Forget Password Using Email and OTP',
  body: ForgotPasswordSchema,
  success: success(202),
});

authDocs.post('/verify-email', {
  summary: 'Verify Email Using Email and OTP',
  body: VerifyEmailSchema,
  success: success(202),
});

authDocs.post('/reset-password', {
  summary: 'Enter Password for Forget Password',
  body: ResetPasswordSchema,
  success: success(202),
});
