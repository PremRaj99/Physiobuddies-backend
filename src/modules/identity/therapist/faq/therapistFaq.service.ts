import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { therapistService } from '../therapist.service';
import { TherapistFaqDTO, UpdateTherapistFaqDTO } from './therapistFaq.type';
import { updateTherapistFaq } from './therapistFaq.helper';

class therapistFaqService {
  async createFaq(data: TherapistFaqDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);

    await prisma.therapistFAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        therapistId: therapist.id,
      },
    });

    return;
  }

  async updateFaq(id: string, data: UpdateTherapistFaqDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const existingFaq = await prisma.therapistFAQ.findUnique({
      where: { id, therapistId: therapist.id },
    });

    if (!existingFaq) {
      throw new NotFoundError('Faq not found');
    }

    const updateData = updateTherapistFaq(data);

    await prisma.therapistFAQ.update({
      where: { id },
      data: updateData,
    });

    return;
  }

  async deleteFaq(id: string, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const existingFaq = await prisma.therapistFAQ.findUnique({
      where: { id, therapistId: therapist.id },
    });

    if (!existingFaq) {
      throw new NotFoundError('Faq not found');
    }

    await prisma.therapistFAQ.delete({
      where: { id },
    });

    return;
  }
}

export default new therapistFaqService();
