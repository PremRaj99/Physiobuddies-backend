import nodemailer from 'nodemailer';
import { ValidationError } from '@/core/errors/ApiError';
import { MAIL_PASS, SENDING_EMAIL } from '@/core/constants';
import { logger } from '@/core/logger/logger';

export const sendMail = async (email: string, subject: string, text: string, html: string) => {
  // Create a transporter object using SMTP transport
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      auth: {
        user: SENDING_EMAIL,
        pass: MAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Physiobuddies" <${SENDING_EMAIL}>`,
      to: email,
      subject: subject,
      text: text,
      html: html,
    });
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new ValidationError('Email not sent');
  }
};
