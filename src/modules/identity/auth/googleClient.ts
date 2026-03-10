import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/core/constants';
import { ValidationError } from '@/core/errors/ApiError';
import { logger } from '@/core/logger/logger';
import axios from 'axios';
import type { Credentials } from 'google-auth-library';
import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage',
);

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string;
}

export const googleUserResponse = async (googleResponse: {
  tokens: Credentials;
}): Promise<GoogleUserInfo> => {
  try {
    const { data } = await axios.get<GoogleUserInfo>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`,
    );
    return data;
  } catch (error) {
    logger.error('Error fetching user info from Google', { error });
    throw new ValidationError('Failed to fetch user info from Google');
  }
};
