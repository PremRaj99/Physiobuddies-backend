import { Prisma } from '@prisma/client';
import { UpdatePatientLocationDTO } from '../patient.type';

export const updatePatientLocationData = (data: UpdatePatientLocationDTO) => {
  const updateData: Prisma.PatientLocationUpdateInput = {};

  if (data.address !== undefined) updateData.address = data.address;
  if (data.landmark !== undefined) updateData.landmark = data.landmark;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
  if (data.country !== undefined) updateData.country = data.country;

  if (data.location !== undefined) {
    updateData.location = {
      ...(data.location.lat !== undefined && { lat: data.location.lat }),
      ...(data.location.lng !== undefined && { lng: data.location.lng }),
    };
  }

  return updateData;
};
