import { Prisma } from '@prisma/client';
import { UpdatePatientDetailsDTO } from '../patient.type';

export const updatePatientDetailData = (data: UpdatePatientDetailsDTO) => {
  const updateData: Prisma.PatientDetailUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.dob !== undefined) updateData.dob = data.dob;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
  if (data.weightKg !== undefined) updateData.weightKg = data.weightKg;

  return updateData;
};
