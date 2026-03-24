import { Router } from 'express';
import invoiceController from './invoice.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const invoiceRouter = Router();

invoiceRouter.use(verifyJWT);

invoiceRouter.get('/:id', invoiceController.getInvoiceById);
