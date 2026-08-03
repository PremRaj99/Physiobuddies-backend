import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { patientService } from '../patient.service';
import type { PatientDetailsDTO, UpdatePatientDetailsDTO } from '../patient.type';
import { updatePatientDetailData } from './patient-detail.helper';

class PatientDetailService {
  // Implement patient detail-specific business logic here
  createPatientDetail = async (userId: string, data: PatientDetailsDTO) => {
    const patient = await patientService.getPatientByUserId(userId);
    await prisma.patientDetail.create({
      data: {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        patientId: patient.id,
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
      },
    });
  };
  getPatientDetails = async (userId: string) => {
    const details = await prisma.patientDetail.findMany({
      where: softDeleteWhereClause({
        patient: { userId },
      }),
    });
    return details.map((detail) => ({
      id: detail.id,
      name: detail.name,
      dob: detail.dob,
      gender: detail.gender,
      phone: detail.phone,
      heightCm: detail.heightCm,
      weightKg: detail.weightKg,
    }));
  };

  updatePatientDetail = async (detailId: string, userId: string, data: UpdatePatientDetailsDTO) => {
    const updateData = updatePatientDetailData(data);

    await prisma.patientDetail.updateMany({
      where: softDeleteWhereClause({
        id: detailId,
        patient: { userId },
      }),
      data: updateData,
    });
  };
  deletePatientDetail = async (detailId: string, userId: string) => {
    await prisma.patientDetail.updateMany({
      where: softDeleteWhereClause({
        id: detailId,
        patient: { userId },
      }),
      data: { deletedAt: new Date() },
    });
  };
}

export const patientDetailService = new PatientDetailService();
