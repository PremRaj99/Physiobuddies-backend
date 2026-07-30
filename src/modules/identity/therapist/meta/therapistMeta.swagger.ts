import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { SubmitFinalOnboardingSchema, SubmitOnboardingSchema } from './therapistMeta.type';

const therapistMetaDocs = swaggerRouter('/therapist/meta', ['Therapist Meta']);

therapistMetaDocs.post('/onboarding', {
  summary: 'Submit Therapist Onboarding Info',
  body: SubmitOnboardingSchema,
  success: success(200),
});

therapistMetaDocs.post('/onboarding/final', {
  summary: 'Submit Final Onboarding Info',
  body: SubmitFinalOnboardingSchema,
  success: success(200),
});
