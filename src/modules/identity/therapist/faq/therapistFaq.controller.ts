import { AcceptedResponse, CreatedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { TherapistFaqSchema, UpdateTherapistFaqSchema } from './therapistFaq.type';
import therapistFaqService from './therapistFaq.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '../../auth/auth.type';

class TherapistFaqController {
  createFaq = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const parseData = validateSchema(TherapistFaqSchema, req.body);
    const userId = req.user.id;
    await therapistFaqService.createFaq(parseData, userId);
    return new CreatedResponse('Faq created successfully').send(res);
  });

  updateFaq = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const articleId = validateSchema(ObjectIdSchema, req.params.id);
    const userId = req.user.id;
    const updateData = validateSchema(UpdateTherapistFaqSchema, req.body);
    await therapistFaqService.updateFaq(articleId, updateData, userId);

    return new AcceptedResponse('Faq updated successfully').send(res);
  });

  deleteFaq = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const articleId = validateSchema(ObjectIdSchema, req.params.id);
    const userId = req.user.id;

    await therapistFaqService.deleteFaq(articleId, userId);
    return new AcceptedResponse('Faq deleted successfully').send(res);
  });
}

export default new TherapistFaqController();
