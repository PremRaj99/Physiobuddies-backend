import { Prisma } from '@prisma/client';
import { UpdateAdminTherapistDTO } from './adminTherapist.types';

export const updateTherapistData = (data: UpdateAdminTherapistDTO) => {
  const updateTherapistData: Prisma.TherapistUpdateInput = {};
  if (data.location) updateTherapistData.location = data.location;
  if (data.displayAddress) updateTherapistData.displayAddress = data.displayAddress;
  if (data.price) updateTherapistData.price = data.price;
  if (data.priceAlt) updateTherapistData.priceAlt = data.priceAlt;
  if (data.rating) updateTherapistData.rating = data.rating;
  if (data.gender) updateTherapistData.gender = data.gender;
  if (data.mode) updateTherapistData.mode = data.mode;
  if (data.about) updateTherapistData.about = data.about;

  const updateTherapistMetaDta: Prisma.TherapistMetaUpdateInput = {};
  if (data.dob) updateTherapistMetaDta.dob = data.dob;
  if (data.experience) updateTherapistMetaDta.experience = data.experience;
  if (data.specialization) updateTherapistMetaDta.specialization = data.specialization;
  if (data.languagesSpoken) updateTherapistMetaDta.languagesSpoken = data.languagesSpoken;
  if (data.educationQualification)
    updateTherapistMetaDta.educationQualification = data.educationQualification;
  if (data.currentlyAffiliation)
    updateTherapistMetaDta.currentlyAffiliation = data.currentlyAffiliation;
  if (data.IAPId) updateTherapistMetaDta.IAPId = data.IAPId;
  if (data.professionalCertificates)
    updateTherapistMetaDta.professionalCertificates = data.professionalCertificates;

  return { updateTherapistData, updateTherapistMetaDta };
};
