import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { TherapistFaqSchema, UpdateTherapistFaqSchema } from './therapistFaq.type';

const therapistFaqDocs = swaggerRouter('/therapist/faqs', ['Therapist Faq']);

therapistFaqDocs.post('/', {
  summary: 'Create Faq',
  body: TherapistFaqSchema,
  success: success(201),
});

therapistFaqDocs.patch('/:id', {
  summary: 'Update Faq',
  body: UpdateTherapistFaqSchema,
  params: ParamsObjectIdSchema,
  success: success(202),
});

therapistFaqDocs.delete('/:id', {
  summary: 'Delete Faq',
  params: ParamsObjectIdSchema,
  success: success(202),
});
