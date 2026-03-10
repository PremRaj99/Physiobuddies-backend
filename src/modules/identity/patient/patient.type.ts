import { z } from 'zod';
import { PhoneRegex } from '../auth/auth.type';

export const PatientDetailsSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(3, { message: 'Name Should have atleast 3 character' }),
  dob: z.date(),
  gender: z.enum(['male', 'female', 'other'], {
    message: "Gender must be 'male', 'female', or 'other'",
  }),
  phone: z
    .string({ message: 'phone number is required' })
    .trim()
    .regex(PhoneRegex, 'Invalid phone number'),
});

export const UpdatePatientDetailsSchema = PatientDetailsSchema.partial();

export const PatientLocationSchema = z.object({
  address: z.string({ message: 'Address is required' }).trim(),
  landmark: z.string({ message: 'Landmark is required' }).trim(),
  city: z.string({ message: 'City is required' }).trim(),
  state: z.string({ message: 'State is required' }).trim(),
  postalCode: z.string({ message: 'Postal code is required' }).trim(),
  location: z.object({
    lng: z.number({ message: 'Longitude is required' }),
    lat: z.number({ message: 'Latitude is required' }),
  }),
});

export const UpdatePatientLocationSchema = PatientLocationSchema.partial();
