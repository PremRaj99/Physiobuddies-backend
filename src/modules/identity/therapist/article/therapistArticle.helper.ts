import { Prisma } from '@prisma/client';
import { UpdateTherapistArticleDTO } from './therapistArticle.type';

export const updateTherapistArticleData = (data: UpdateTherapistArticleDTO) => {
  const updateData: Prisma.TherapistArticleUpdateInput = {};

  if (data.content !== undefined) updateData.content = data.content;
  if (data.title !== undefined) updateData.title = data.title;

  return updateData;
};
