import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { z } from 'zod';
import { HoldReservationSchema } from './reservation.type';

const reservationDocs = swaggerRouter('/reservation', ['Reservation']);

reservationDocs.post('/hold', {
  summary: 'Hold a Slot Reservation',
  description: 'Holds a slot for 10 minutes. The user must be a patient.',
  body: HoldReservationSchema,
  success: success(202),
});

reservationDocs.patch('/:id/confirm', {
  summary: 'Confirm a Held Reservation',
  description:
    'Confirms a reservation that was previously held. The user must be the same patient who held the slot.',
  params: ParamsObjectIdSchema,
  success: success(200, z.object({ reservationId: z.string(), message: z.string() })),
});

reservationDocs.delete('/:id', {
  summary: 'Cancel a Reservation',
  description: 'Cancels a held or confirmed reservation. The user must be the same patient.',
  params: ParamsObjectIdSchema,
  success: success(202),
});
