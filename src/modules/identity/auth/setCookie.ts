import type { Response } from 'express';
import { NODE_ENV } from '@/core/constants';

const options = (time = 15) => ({
  httpOnly: true,
  secure: String(NODE_ENV) === 'production',
  sameSite: 'lax' as const, // or 'none' if needed
  // domain: ".meowjiofficial.in",
  maxAge: time * 60 * 1000,
});

export const setCookie = (res: Response, name: string, value: string) => {
  if (name === 'access_token') {
    res.cookie(name, value, options(15));
  } else {
    res.cookie(name, value, options(8 * 24 * 60));
  }
  return;
};
