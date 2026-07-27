import prisma from '@/config/prisma';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '@/core/constants';
import { THERAPIST_PRICE } from '@/core/constants/site-setting';
import { NotFoundError, ValidationError } from '@/core/errors/ApiError';
import { sendMail } from '@/shared/mailHandler';
import bcrypt from 'bcrypt';
import type { Request } from 'express';
import geoip from 'fast-geoip';
import jwt from 'jsonwebtoken';
import { generatePatientId, generateTherapistId } from './generateBussinessId';
import { googleUserResponse, oauth2Client } from './googleClient';
import { checkOTP, checkRateLimits, createAndStoreOTP, verifyOTP } from './otp-management';
import { logActivity } from '@/modules/log/activity/activity.service';

class AuthService {
  constructor() {}

  getUserByEmail = async (email: string) => {
    return await prisma.user.findFirst({
      where: {
        email: email,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        status: 'active',
      },
    });
  };

  generateTokens = async (
    user: { id: string; role: string },
    req: Request,
    refreshTokenParams?: string,
  ) => {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_TOKEN_SECRET as string, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: '7d',
      },
    );

    const geo = await geoip.lookup(req.ip || '');

    if (refreshTokenParams) {
      try {
        await prisma.authSession.update({
          where: {
            refreshToken: refreshTokenParams,
          },
          data: {
            refreshToken: refreshToken,
            ip: req.ip || '',
            agent: req.get('User-Agent') || '',
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            location: geo ? `${geo.city}, ${geo.region}, ${geo.country}` : '', // You can use a geoip library to get location from IP
            lastLoggedAt: new Date(),
          },
        });
      } catch {
        throw new ValidationError('invalid session');
      }
    } else {
      await prisma.authSession.create({
        data: {
          userId: user.id,
          refreshToken: refreshToken,
          ip: req.ip || '',
          agent: req.get('User-Agent') || '',
          expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          location: geo ? `${geo.city}, ${geo.region}, ${geo.country}` : '', // You can use a geoip library to get location from IP
          lastLoggedAt: new Date(),
        },
      });
    }

    return { accessToken, refreshToken };
  };

  login = async (email: string, password: string, req: Request) => {
    const isUserExist = await this.getUserByEmail(email);

    if (!isUserExist) {
      throw new NotFoundError('User not found');
    }

    if (!isUserExist.password) {
      throw new ValidationError('invalid credential');
    }

    const isPasswordValid = await bcrypt.compare(password, isUserExist.password);

    if (!isPasswordValid) {
      throw new ValidationError('Invalid credentials');
    }

    const tokens = await this.generateTokens(isUserExist, req);

    await logActivity({
      userId: isUserExist.id,
      title: 'User Logged In',
      data: `User ${isUserExist.email} logged in successfully`,
      type: 'frequent',
      req,
    });

    return tokens;
  };

  sendEmailBeforeSignup = async (email: string) => {
    const isUserExist = await this.getUserByEmail(email);
    if (isUserExist) {
      throw new ValidationError('Email already in use');
    }

    await checkRateLimits(email);

    // Save OTP to cache with an expiration time
    const otp = await createAndStoreOTP(email);

    // Send OTP via email logic here (e.g., using nodemailer)
    const emailSubject = 'Verify your email for Physiobuddies';
    const emailText = `Your Verification Code is: ${otp}. It expires in 5 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Physiobuddies!</h2>
        <p>Please use the following One Time Password (OTP) to verify your email address:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `;

    await sendMail(email, emailSubject, emailText, emailHtml);

    return true;
  };

  signupPatient = async (
    name: string,
    email: string,
    token: string,
    mobile: string,
    password: string,
  ) => {
    const isUserExist = await this.getUserByEmail(email);

    if (isUserExist) {
      throw new ValidationError('Email already in use');
    }

    const cachedOTP = await checkOTP(email);

    if (!cachedOTP || cachedOTP !== token) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: mobile,
        password: hashedPassword,
        role: 'patient',
        status: 'active',
      },
    });

    await prisma.patient.create({
      data: {
        userId: user.id,
        patientId: generatePatientId(),
      },
    });

    return user;
  };

  signupPhysiotherapist = async (
    name: string,
    email: string,
    token: string,
    mobile: string,
    password: string,
    location: { lng: number; lat: number },
    displayAddress: string,
    gender: 'male' | 'female' | 'other',
    mode: 'home_visit' | 'clinic' | 'online',
  ) => {
    const isUserExist = await this.getUserByEmail(email);

    if (isUserExist) {
      throw new ValidationError('Email already in use');
    }

    const cachedOTP = await checkOTP(email);

    if (!cachedOTP || cachedOTP !== token) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: mobile,
        password: hashedPassword,
        role: 'therapist',
        status: 'active',
      },
    });

    await prisma.therapist.create({
      data: {
        userId: user.id,
        location,
        displayAddress,
        gender,
        mode,
        price: THERAPIST_PRICE,
        therapistId: generateTherapistId(),
        commissionRate: 0.2, // 20% commission
      },
    });

    return user;
  };

  google = async (code: string, req: Request) => {
    const googleResponse = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(googleResponse.tokens);

    if (!googleResponse.tokens.access_token) {
      throw new ValidationError('Google access token not found');
    }
    const userInfo = await googleUserResponse(googleResponse);

    const user = await this.getUserByEmail(userInfo.email);

    if (!user) {
      throw new NotFoundError('No user found with this Google account. Please sign up first.');
    }

    const tokens = await this.generateTokens(user, req);

    return tokens;
  };

  refreshToken = async (req: Request) => {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refresh ||
      req.body?.refreshToken ||
      req.body?.refresh_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (!refreshToken) {
      throw new ValidationError('Refresh token not provided');
    }

    try {
      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET as string);
    } catch {
      throw new ValidationError('Invalid or expired refresh token');
    }

    let session;

    try {
      session = await prisma.authSession.findUnique({
        where: {
          refreshToken: refreshToken,
        },
        include: {
          user: true,
        },
      });
    } catch {
      throw new ValidationError('Invalid or expired refresh token');
    }
    if (
      !session ||
      !session.user ||
      session.user.status !== 'active' ||
      session.expiredAt < new Date()
    ) {
      throw new ValidationError('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(session.user, req, session.refreshToken);

    return tokens;
  };

  logout = async (req: Request) => {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refresh ||
      req.body?.refreshToken ||
      req.body?.refresh_token;

    if (!refreshToken) {
      return false;
    }

    try {
      await prisma.authSession.delete({
        where: {
          refreshToken: refreshToken,
        },
      });
    } catch {
      // Session might already be deleted
    }

    return true;
  };

  forgotPassword = async (email: string) => {
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await checkRateLimits(email);

    const otp = await createAndStoreOTP(email);
    const emailSubject = 'Password Reset OTP for Physiobuddies';
    const emailText = `Your Password Reset OTP is: ${otp}. It expires in 5 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Please use the following One Time Password (OTP) to reset your password:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    await sendMail(email, emailSubject, emailText, emailHtml);

    return true;
  };

  verifyEmail = async (email: string, token: string) => {
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }
    await verifyOTP(email, token);

    return true;
  };

  resetPassword = async (email: string, token: string, newPassword: string) => {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const cachedOTP = await checkOTP(email);

    if (!cachedOTP || cachedOTP !== token) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
  };
}

export const authService = new AuthService();
