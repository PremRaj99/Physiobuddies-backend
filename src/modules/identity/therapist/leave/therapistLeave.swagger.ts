import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ApplyLeaveSchema } from './therapistLeave.type';

const therapistLeaveDocs = swaggerRouter('/therapist/leaves', ['Therapist Leave']);

therapistLeaveDocs.post('/', {
  summary: 'Apply for Leave',
  body: ApplyLeaveSchema,
  success: success(202),
});
