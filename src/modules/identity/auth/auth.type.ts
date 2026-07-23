import { z } from 'zod';

export const PhoneRegex = new RegExp(/^(\+\d{1,3}[ -]?)?\d{9,14}$/);

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const ParamsObjectIdSchema = z.object({
  id: ObjectIdSchema.openapi({ param: { in: 'path', name: 'id' } }),
});

export const OtpTokenSchema = z
  .string({ message: 'token is required' })
  .length(6, { message: 'token should be 6 characters' });

export const EmailSchema = z.string({ message: 'email is required' }).trim().email({
  message: 'invalid email',
});

export const PasswordSchema = z
  .string({ message: 'password is required' })
  .min(6, { message: 'password should be at least 6 characters' });

// Schemas for request validation
export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const SendEmailBeforeSignupSchema = z.object({
  email: EmailSchema,
});

export const SignupPatientSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(3, { message: 'Name Should have atleast 3 character' }),
  email: EmailSchema,
  token: OtpTokenSchema,
  mobile: z
    .string({ message: 'phone number is required' })
    .trim()
    .regex(PhoneRegex, 'Invalid phone number'),
  password: PasswordSchema,
});

export const SignupPhysiotherapistSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(3, { message: 'Name Should have atleast 3 character' }),
  email: EmailSchema,
  token: OtpTokenSchema,
  mobile: z
    .string({ message: 'phone number is required' })
    .trim()
    .regex(PhoneRegex, 'Invalid phone number'),
  password: PasswordSchema,
  location: z.object({
    lng: z.number({ message: 'Longitude is required' }),
    lat: z.number({ message: 'Latitude is required' }),
  }),
  displayAddress: z.string({ message: 'Display address is required' }).trim(),
  gender: z.enum(['male', 'female', 'other'], {
    message: "Gender must be 'male', 'female', or 'other'",
  }),
  mode: z.enum(['home_visit', 'clinic', 'online'], {
    message: "Mode must be 'home_visit', 'clinic', or 'online'",
  }),
});

export const GoogleLoginSchema = z.object({
  code: z.string('invalid login'),
});

export const RefershTokenSchema = z
  .object({
    refresh: z.string().optional(),
  })
  .optional();

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const VerifyEmailSchema = z.object({
  email: EmailSchema,
  token: OtpTokenSchema,
});

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
  token: OtpTokenSchema,
  newPassword: PasswordSchema,
});

export type LoginDTO = z.infer<typeof LoginSchema>;
export type SendEmailBeforeSignupDTO = z.infer<typeof SendEmailBeforeSignupSchema>;
export type SignupPatientDTO = z.infer<typeof SignupPatientSchema>;
export type SignupPhysiotherapistDTO = z.infer<typeof SignupPhysiotherapistSchema>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;
export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
