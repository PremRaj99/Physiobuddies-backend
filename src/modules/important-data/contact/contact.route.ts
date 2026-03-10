import { Router } from 'express';
import { contactController } from './contact.controller';

export const contactRouter = Router();

contactRouter.post('/', contactController.submitContactForm);
contactRouter.get('/', contactController.getAllContacts);
contactRouter.get('/:id', contactController.getContactById);
contactRouter.patch('/:id/status', contactController.updateContactStatus);
