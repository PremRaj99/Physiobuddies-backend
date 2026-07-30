import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const notificationDocs = swaggerRouter('/notification', ['Notifications']);

notificationDocs.get('/', {
  summary: 'Get User Notifications',
  success: success(200),
});

notificationDocs.get('/unread-count', {
  summary: 'Get Unread Notifications Count',
  success: success(200),
});

notificationDocs.patch('/:id/read', {
  summary: 'Mark Notification as Read',
  success: success(200),
});

notificationDocs.patch('/read-all', {
  summary: 'Mark All Notifications as Read',
  success: success(200),
});

notificationDocs.delete('/:id', {
  summary: 'Delete Notification',
  success: success(200),
});
