import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const fileUploadDocs = swaggerRouter('/file-upload', ['File Upload']);

fileUploadDocs.post('/single', {
  summary: 'Upload Single',
  success: success(201),
});

fileUploadDocs.post('/multiple', {
  summary: 'Upload Multiple',
  success: success(201),
});

fileUploadDocs.delete('/:filename', {
  summary: 'Delete File',
  params: ParamsObjectIdSchema,
  success: success(202),
});
