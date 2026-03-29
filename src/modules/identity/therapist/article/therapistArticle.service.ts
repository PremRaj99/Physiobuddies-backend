import prisma from '@/config/prisma';
import { therapistService } from '../therapist.service';
import { TherapistArticleDTO, UpdateTherapistArticleDTO } from './therapistArticle.type';
import { NotFoundError } from '@/core/errors/ApiError';
import { updateTherapistArticleData } from './therapistArticle.helper';

class therapistArticleService {
  async createArticle(data: TherapistArticleDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);

    await prisma.therapistArticle.create({
      data: {
        title: data.title,
        content: data.content,
        therapistId: therapist.id,
      },
    });

    return;
  }

  async updateArticle(id: string, data: UpdateTherapistArticleDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const existingArticle = await prisma.therapistArticle.findUnique({
      where: { id, therapistId: therapist.id },
    });

    if (!existingArticle) {
      throw new NotFoundError('Article not found');
    }

    const updateData = updateTherapistArticleData(data);

    await prisma.therapistArticle.update({
      where: { id },
      data: updateData,
    });

    return;
  }

  async deleteArticle(id: string, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const existingArticle = await prisma.therapistArticle.findUnique({
      where: { id, therapistId: therapist.id },
    });

    if (!existingArticle) {
      throw new NotFoundError('Article not found');
    }

    await prisma.therapistArticle.delete({
      where: { id },
    });

    return;
  }
}

export default new therapistArticleService();
