import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { contactService } from './contact.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class ContactController {
  submitContactForm = asyncHandler(async (req, res, _next) => {
    await contactService.submitContactForm(req.body);
    return new CreatedResponse('Contact inquiry submitted successfully').send(res);
  });

  getAllContacts = asyncHandler(async (_req, res, _next) => {
    const contacts = await contactService.getAllContacts();
    return new OkResponse(contacts).send(res);
  });

  getContactById = asyncHandler(async (req, res, _next) => {
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const contact = await contactService.getContactById(id);
    return new OkResponse(contact).send(res);
  });

  updateContactStatus = asyncHandler(async (req, res, _next) => {
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const status = req.body?.status || 'completed';
    const message = await contactService.updateContactStatus(id, status);
    return new AcceptedResponse(message).send(res);
  });
}

export const contactController = new ContactController();
