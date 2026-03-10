import { Router } from 'express';
import therapistWalletController from './therapistWallet.controller';

export const therapistWalletRouter = Router();

therapistWalletRouter.get('/', therapistWalletController.getWalletInfo);
