import prisma from '@/config/prisma';
import type { PatientDetailsSchema, UpdatePatientDetailsSchema } from '../patient.type';
import type z from 'zod';
import { patientService } from '../patient.service';

class PatientDetailService {
  // Implement patient detail-specific business logic here
  createPatientDetail = async (userId: string, data: z.infer<typeof PatientDetailsSchema>) => {
    const patient = await patientService.getPatientByUserId(userId);
    await prisma.patientDetail.create({
      data: {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        patientId: patient.id,
      },
    });
  };
  getPatientDetails = async (userId: string) => {
    const details = await prisma.patientDetail.findMany({
      where: {
        patient: { userId },
        deletedAt: null,
      },
    });
    return details.map((detail) => ({
      id: detail.id,
      name: detail.name,
      dob: detail.dob,
      gender: detail.gender,
      phone: detail.phone,
    }));
  };

  updatePatientDetail = async (
    detailId: string,
    userId: string,
    data: z.infer<typeof UpdatePatientDetailsSchema>,
  ) => {
    await prisma.patientDetail.update({
      where: { id: detailId, deletedAt: null, patient: { userId } },
      data: {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
      },
    });
  };
  deletePatientDetail = async (detailId: string, userId: string) => {
    await prisma.patientDetail.update({
      where: { id: detailId, deletedAt: null, patient: { userId } },
      data: { deletedAt: new Date() },
    });
  };
}

export const patientDetailService = new PatientDetailService();
