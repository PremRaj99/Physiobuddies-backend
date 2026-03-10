import { z } from 'zod';
import { PasswordSchema, PhoneRegex } from '../auth/auth.type';

export const UpdateUserSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(3, { message: 'Name Should have atleast 3 character' })
    .optional(),
  mobile: z
    .string({ message: 'phone number is required' })
    .trim()
    .regex(PhoneRegex, 'Invalid phone number')
    .optional(),
});

export const UpdateAvatarSchema = z.object({
  avatar: z.string({ message: 'Avatar URL is required' }).trim().url('Invalid URL format'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema,
});
