import { Prisma } from '@prisma/client';
import { UpdateTherapistFaqDTO } from './therapistFaq.type';

export const updateTherapistFaq = (data: UpdateTherapistFaqDTO) => {
  const updateData: Prisma.TherapistFAQUpdateInput = {};
  if (data.question !== undefined) updateData.question = data.question;
  if (data.answer !== undefined) updateData.answer = data.answer;

  return updateData;
};
