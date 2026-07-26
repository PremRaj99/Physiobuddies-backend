import { z } from 'zod';
import { PhoneRegex } from '../auth/auth.type';
import { ValidationError } from '@/core/errors/ApiError';

// date is such that agee must be more then 7 years old eg: 2004-04-01
export const dateSchema = z.preprocess((val) => {
  const date = new Date(val as string);
  const currentDate = new Date();

  if (date.getFullYear() > currentDate.getFullYear() - 7) {
    throw new ValidationError('Age must be more then 7 years old');
  }

  if (date.getFullYear() === currentDate.getFullYear() - 7) {
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    const birthMonth = date.getMonth();
    const birthDay = date.getDate();

    if (birthMonth > currentMonth || (birthMonth === currentMonth && birthDay > currentDay)) {
      throw new ValidationError('Age must be more then 7 years old');
    }
  }

  return date;
}, z.date());

export const PatientDetailsSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(3, { message: 'Name Should have atleast 3 character' }),
  dob: dateSchema,
  gender: z.enum(['male', 'female', 'other'], {
    message: "Gender must be 'male', 'female', or 'other'",
  }),
  phone: z
    .string({ message: 'phone number is required' })
    .trim()
    .regex(PhoneRegex, 'Invalid phone number'),
  heightCm: z
    .number({ message: 'Height should be in number' })
    .positive({ message: 'Height should be positive' })
    .optional(),
  weightKg: z
    .number({ message: 'Weight should be in number' })
    .positive({ message: 'Weight should be positive' })
    .optional(),
});

export const UpdatePatientDetailsSchema = PatientDetailsSchema.partial();

export type PatientDetailsDTO = z.infer<typeof PatientDetailsSchema>;
export type UpdatePatientDetailsDTO = z.infer<typeof UpdatePatientDetailsSchema>;

export const PatientLocationSchema = z.object({
  address: z.string({ message: 'Address is required' }).trim(),
  landmark: z.string({ message: 'Landmark is required' }).trim(),
  city: z.string({ message: 'City is required' }).trim(),
  state: z.string({ message: 'State is required' }).trim(),
  country: z.string({ message: 'Country is required' }).trim(),
  postalCode: z.string({ message: 'Postal code is required' }).trim(),
  location: z.object({
    lng: z.number({ message: 'Longitude is required' }),
    lat: z.number({ message: 'Latitude is required' }),
  }),
});
export type PatientLocationDTO = z.infer<typeof PatientLocationSchema>;

export const UpdatePatientLocationSchema = PatientLocationSchema.partial();

export type UpdatePatientLocationDTO = z.infer<typeof UpdatePatientLocationSchema>;
