import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { TherapistArticleSchema, UpdateTherapistArticleSchema } from './therapistArticle.type';

const therapistArticleDocs = swaggerRouter('/therapist/articles', ['Therapist Article']);

therapistArticleDocs.post('/', {
  summary: 'Create Article',
  body: TherapistArticleSchema,
  success: success(201),
});

therapistArticleDocs.patch('/:id', {
  summary: 'Update Article',
  body: UpdateTherapistArticleSchema,
  params: ParamsObjectIdSchema,
  success: success(202),
});

therapistArticleDocs.delete('/:id', {
  summary: 'Delete Article',
  params: ParamsObjectIdSchema,
  success: success(202),
});
