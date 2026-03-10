import type z from 'zod';
import type { PatientLocationSchema, UpdatePatientLocationSchema } from '../patient.type';
import prisma from '@/config/prisma';
import { patientService } from '../patient.service';

class PatientLocationService {
  // Implement patient location-specific business logic here
  createPatientLocation = async (userId: string, data: z.infer<typeof PatientLocationSchema>) => {
    const patient = await patientService.getPatientByUserId(userId);
    await prisma.patientLocation.create({
      data: {
        address: data.address,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        location: {
          create: {
            lat: data.location.lat,
            lng: data.location.lng,
          },
        },
        patientId: patient.id,
        country: 'India', // Assuming country is fixed for now, can be made dynamic later
      },
    });
  };

  getPatientLocations = async (userId: string) => {
    const data = await prisma.patientLocation.findMany({
      where: { deletedAt: null, patient: { userId } },
      orderBy: { updatedAt: 'desc' },
    });

    return data.map((location) => ({
      id: location.id,
      address: location.address,
      landmark: location.landmark,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      country: location.country,
      location: location.location,
    }));
  };

  updatePatientLocation = async (
    locationId: string,
    userId: string,
    data: z.infer<typeof UpdatePatientLocationSchema>,
  ) => {
    await prisma.patientLocation.update({
      where: { id: locationId, patient: { userId } },
      data: {
        address: data.address,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        location: data.location
          ? {
              update: {
                lat: data.location.lat,
                lng: data.location.lng,
              },
            }
          : undefined,
      },
    });
  };

  deletePatientLocation = async (locationId: string, userId: string) => {
    await prisma.patientLocation.update({
      where: { id: locationId, patient: { userId } },
      data: {
        deletedAt: new Date(),
      },
    });
  };
}

export const patientLocationService = new PatientLocationService();
