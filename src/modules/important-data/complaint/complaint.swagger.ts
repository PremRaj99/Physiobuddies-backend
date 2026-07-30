import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { CreateComplaintSchema, CreateReplySchema } from './complaint.type';

const complaintDocs = swaggerRouter('/complaint', ['Complaint']);

complaintDocs.get('/', {
  summary: 'Get User Complaints',
  description: 'Retrieve complaints for logged in user (or all if admin).',
  success: success(200),
});

complaintDocs.post('/', {
  summary: 'Create Support Complaint',
  body: CreateComplaintSchema,
  success: success(201),
});

complaintDocs.post('/:id/reply', {
  summary: 'Add Reply to Complaint',
  body: CreateReplySchema,
  success: success(200),
  errors: [404],
});
