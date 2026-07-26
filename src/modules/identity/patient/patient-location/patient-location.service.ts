import prisma from '@/config/prisma';
import { patientService } from '../patient.service';
import type { PatientLocationDTO, UpdatePatientLocationDTO } from '../patient.type';
import { updatePatientLocationData } from './patient-location.helper';

class PatientLocationService {
  // Implement patient location-specific business logic here
  createPatientLocation = async (userId: string, data: PatientLocationDTO) => {
    const patient = await patientService.getPatientByUserId(userId);
    await prisma.patientLocation.create({
      data: {
        address: data.address,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        location: {
          lat: data.location.lat,
          lng: data.location.lng,
        },
        patientId: patient.id,
        country: data.country,
      },
    });
  };

  getPatientLocations = async (userId: string) => {
    const data = await prisma.patientLocation.findMany({
      where: { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }], patient: { userId } },
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
    data: UpdatePatientLocationDTO,
  ) => {
    const updateData = updatePatientLocationData(data);
    await prisma.patientLocation.update({
      where: { id: locationId, patient: { userId } },
      data: updateData,
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
