import { Router } from 'express';
import therapistWalletController from './therapistWallet.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistWalletRouter = Router();

therapistWalletRouter.use(verifyJWT);
therapistWalletRouter.use(TherapistOnly);

therapistWalletRouter.get('/', therapistWalletController.getWalletInfo);
