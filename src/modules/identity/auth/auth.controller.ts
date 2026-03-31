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
  login = asyncHandler(async (req, res, _next) => {
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

  sendEmailBeforeSignup = asyncHandler(async (req, res, _next) => {
    // Implement email verification before signup logic here using authService
    const parseData = validateSchema(SendEmailBeforeSignupSchema, req.body);

    await authService.sendEmailBeforeSignup(parseData.email);

    return new AcceptedResponse('OTP sent to email.').send(res);
  });

  signupPatient = asyncHandler(async (req, res, _next) => {
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

  signupPhysiotherapist = asyncHandler(async (req, res, _next) => {
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

  google = asyncHandler(async (req, res, _next) => {
    // Implement Google OAuth logic here using authService
    const parseData = validateSchema(GoogleLoginSchema, req.query);

    const { accessToken, refreshToken } = await authService.google(parseData.code, req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);
    return new OkResponse({ accessToken, refreshToken }).send(res);
  });

  refreshToken = asyncHandler(async (req, res, _next) => {
    // Implement refresh token logic here using authService
    validateSchema(RefershTokenSchema, req.body);

    const { accessToken, refreshToken } = await authService.refreshToken(req);

    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'refresh_token', refreshToken);

    return new OkResponse({ accessToken, refreshToken }).send(res);
  });

  logout = asyncHandler(async (req, res, _next) => {
    // Implement logout logic here using authService

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    await authService.logout(req);
    return new AcceptedResponse('Logged out successfully.').send(res);
  });

  forgotPassword = asyncHandler(async (req, res, _next) => {
    // Implement forgot password logic here using authService

    const parseData = validateSchema(ForgotPasswordSchema, req.body);

    await authService.forgotPassword(parseData.email);

    return new AcceptedResponse('Password reset OTP sent to email.').send(res);
  });

  verifyEmail = asyncHandler(async (req, res, _next) => {
    // Implement email verification logic here using authService
    const parseData = validateSchema(VerifyEmailSchema, req.body);

    await authService.verifyEmail(parseData.email, parseData.token);

    return new AcceptedResponse('Email verified successfully.').send(res);
  });

  resetPassword = asyncHandler(async (req, res, _next) => {
    // Implement reset password logic here using authService

    const parseData = validateSchema(ResetPasswordSchema, req.body);
    await authService.resetPassword(parseData.email, parseData.token, parseData.newPassword);

    return new AcceptedResponse('Password reset successfully.').send(res);
  });
}

export const authController = new AuthController();
