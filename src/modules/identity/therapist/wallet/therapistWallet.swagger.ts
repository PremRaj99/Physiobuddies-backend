import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const therapistWalletDocs = swaggerRouter('/therapist/wallet', ['Therapist Wallet']);

therapistWalletDocs.get('/', {
  summary: 'Get Wallet Info',
  success: success(200),
});
