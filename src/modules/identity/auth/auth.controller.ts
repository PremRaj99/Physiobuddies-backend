import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SendEmailBeforeSignupSchema,
  SignupPatientSchema,
  SignupPhysiotherapistSchema,
  VerifyEmailSchema,
} from './auth.type';
import { setCookie } from './setCookie';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';

class AuthController {
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const parseData = validateSchema(LoginSchema, req.body);

    const { accessToken, refreshToken } = await authService.login(
      parseData.email,
      parseData.password,
      req,
    );

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    res.json(new OkResponse({ accessToken, refreshToken }));
  });

  sendEmailBeforeSignup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement email verification before signup logic here using authService
    const parseData = validateSchema(SendEmailBeforeSignupSchema, req.body);

    await authService.sendEmailBeforeSignup(parseData.email);

    res.status(202).json(new AcceptedResponse('OTP sent to email.'));
  });

  signupPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement signup logic here using authService
    const parseData = validateSchema(SignupPatientSchema, req.body);

    await authService.signupPatient(
      parseData.name,
      parseData.email,
      parseData.token,
      parseData.mobile,
      parseData.password,
    );

    res.status(201).json(new CreatedResponse('User registered successfully.'));
  });

  signupPhysiotherapist = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

    res.status(201).json(new CreatedResponse('User registered successfully.'));
  });

  google = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement Google OAuth logic here using authService
    const { code } = req.query;

    const { accessToken, refreshToken } = await authService.google(String(code), req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);
    res.json(new OkResponse({ accessToken, refreshToken }));
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement refresh token logic here using authService
    const { accessToken, refreshToken } = await authService.refreshToken(req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    res.json(new OkResponse({ accessToken, refreshToken }));
  });

  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement logout logic here using authService

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    await authService.logout(req);
    res.status(202).json(new AcceptedResponse('Logged out successfully.'));
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement forgot password logic here using authService

    const parseData = validateSchema(ForgotPasswordSchema, req.body);

    await authService.forgotPassword(parseData.email);

    res.status(202).json(new AcceptedResponse('Password reset OTP sent to email.'));
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement email verification logic here using authService
    const parseData = validateSchema(VerifyEmailSchema, req.body);

    await authService.verifyEmail(parseData.email, parseData.token);

    res.status(202).json(new AcceptedResponse('Email verified successfully.'));
  });

  resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implement reset password logic here using authService

    const parseData = validateSchema(ResetPasswordSchema, req.body);
    await authService.resetPassword(parseData.email, parseData.token, parseData.newPassword);

    res.status(202).json(new AcceptedResponse('Password reset successfully.'));
  });
}

export const authController = new AuthController();
