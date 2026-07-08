import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { BlockSlotsSchema } from './slotBlock.type';

const slotBlockDocs = swaggerRouter('/therapist/slots', ['Therapist Slot Block']);

slotBlockDocs.post('/block', {
  summary: 'Block Therapist Slots',
  body: BlockSlotsSchema,
  success: success(200),
});

slotBlockDocs.delete('/block', {
  summary: 'Unblock Therapist Slots',
  body: BlockSlotsSchema,
  success: success(200),
});
