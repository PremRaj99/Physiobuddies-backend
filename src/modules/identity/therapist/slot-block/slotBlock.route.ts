import { Router } from 'express';
import slotBlockController from './slotBlock.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const slotBlockRouter = Router();

slotBlockRouter.use(verifyJWT);
slotBlockRouter.use(TherapistOnly);

slotBlockRouter.post('/block', slotBlockController.blockSlots);
slotBlockRouter.delete('/block', slotBlockController.unblockSlots);
