import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
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
import { setCookie } from './setCookie';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';

class AuthController {
  login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parseData = validateSchema(LoginSchema, req.body);

    const { accessToken, refreshToken } = await authService.login(
      parseData.email,
      parseData.password,
      req,
    );

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    return new OkResponse({ accessToken, refreshToken }).send(res);
  });

  sendEmailBeforeSignup = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement email verification before signup logic here using authService
    const parseData = validateSchema(SendEmailBeforeSignupSchema, req.body);

    await authService.sendEmailBeforeSignup(parseData.email);

    return new AcceptedResponse('OTP sent to email.').send(res);
  });

  signupPatient = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement signup logic here using authService
    const parseData = validateSchema(SignupPatientSchema, req.body);

    await authService.signupPatient(
      parseData.name,
      parseData.email,
      parseData.token,
      parseData.mobile,
      parseData.password,
    );

    return new CreatedResponse('User registered successfully.').send(res);
  });

  signupPhysiotherapist = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement signup logic here using authService
    const parseData = validateSchema(SignupPhysiotherapistSchema, req.body);

    await authService.signupPhysiotherapist(
      parseData.name,
      parseData.email,
      parseData.token,
      parseData.mobile,
      parseData.password,
      parseData.location,
      parseData.displayAddress,
      parseData.gender,
      parseData.mode,
    );

    return new CreatedResponse('Physiotherapist registered successfully.').send(res);
  });

  google = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement Google OAuth logic here using authService
    const parseData = validateSchema(GoogleLoginSchema, req.query);

    const { accessToken, refreshToken } = await authService.google(parseData.code, req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);
    return new OkResponse({ accessToken, refreshToken }).send(res);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement refresh token logic here using authService
    validateSchema(RefershTokenSchema, req.body);

    const { accessToken, refreshToken } = await authService.refreshToken(req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    return new OkResponse({ accessToken, refreshToken }).send(res);
  });

  logout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement logout logic here using authService

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    await authService.logout(req);
    return new AcceptedResponse('Logged out successfully.').send(res);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement forgot password logic here using authService

    const parseData = validateSchema(ForgotPasswordSchema, req.body);

    await authService.forgotPassword(parseData.email);

    return new AcceptedResponse('Password reset OTP sent to email.').send(res);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement email verification logic here using authService
    const parseData = validateSchema(VerifyEmailSchema, req.body);

    await authService.verifyEmail(parseData.email, parseData.token);

    return new AcceptedResponse('Email verified successfully.').send(res);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Implement reset password logic here using authService

    const parseData = validateSchema(ResetPasswordSchema, req.body);
    await authService.resetPassword(parseData.email, parseData.token, parseData.newPassword);

    return new AcceptedResponse('Password reset successfully.').send(res);
  });
}

export const authController = new AuthController();
