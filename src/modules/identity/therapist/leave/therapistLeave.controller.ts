import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import therapistLeaveService from './therapistLeave.service';
import { ApplyLeaveSchema } from './therapistLeave.type';
import { isAuth } from '@/core/middlewares/isAuth';

class TherapistLeaveController {
  applyLeave = asyncHandler(async (req, res, _next) => {
    const body = validateSchema(ApplyLeaveSchema, req.body);
    isAuth(req);
    await therapistLeaveService.applyLeave(body, req.user.id);
    return new AcceptedResponse('Leave applied successfully').send(res);
  });
}

export default new TherapistLeaveController();
