import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ChangePasswordSchema, UpdateAvatarSchema, UpdateUserSchema } from './user.type';

const userDocs = swaggerRouter('/user', ['User']);

userDocs.get('/', {
  summary: 'Get Info',
  success: success(200),
});

userDocs.patch('/', {
  summary: 'Update User',
  body: UpdateUserSchema,
  success: success(202),
});

userDocs.patch('/avatar', {
  summary: 'Update Avatar',
  body: UpdateAvatarSchema,
  success: success(202),
});

userDocs.patch('/password', {
  summary: 'Change Password',
  body: ChangePasswordSchema,
  success: success(202),
});
