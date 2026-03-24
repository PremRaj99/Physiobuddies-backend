import { Router } from 'express';
import { contactController } from './contact.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';

export const contactRouter = Router();

contactRouter.post('/', contactController.submitContactForm);

contactRouter.use(verifyJWT);
contactRouter.use(AdminOnly);

contactRouter.get('/', contactController.getAllContacts);
contactRouter.get('/:id', contactController.getContactById);
contactRouter.patch('/:id/status', contactController.updateContactStatus);
